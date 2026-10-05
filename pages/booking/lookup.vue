<script setup lang="ts">
import type { ApiError } from '~/types/models';

/**
 * SC-20 Tra cuu lich hen cho khach chua dang nhap — FR-BOOK-15.
 * Ban thiet ke dat o tai anh ma QR len truoc, roi moi den o nhap ma. Anh QR
 * duoc giai ma ngay tren may de khong phai gui anh len may chu.
 */
const { t } = useI18n();
const api = useApi();
const route = useRoute();
const ui = useUiStore();

const term = ref((route.query.code as string) ?? '');
const loading = ref(false);
const decoding = ref(false);
const error = ref<ApiError | null>(null);

/**
 * Mot o duy nhat cho ca ma lich hen lan so dien thoai, giong o tra cuu cua
 * le tan: khach khong phai doan xem o nao danh cho cai minh dang cam trong
 * tay. May chu thu ma truoc, khong ra thi coi la so dien thoai.
 */
async function lookup(): Promise<void> {
  const value = term.value.trim();
  if (!value) return;

  error.value = null;
  loading.value = true;
  try {
    const booking = await api.post<{ code: string }>('/bookings/lookup', { term: value });
    await navigateTo(`/bookings/${booking.code}/progress`);
  } catch (caught) {
    error.value = localise(normalizeError(caught));
  } finally {
    loading.value = false;
  }
}

/**
 * May chu tra loi bang tieng Viet khong dau. Man nay phuc vu ca khach Nhat
 * lan khach doc tieng Anh, nen hai truong hop hay gap nhat phai noi dung
 * thu tieng ho dang xem.
 */
function localise(failure: ApiError): ApiError {
  const messages: Record<string, string> = {
    BOOKING_NOT_FOUND: t('sc20.notFound'),
    LOOKUP_TOO_SHORT: t('sc20.tooShort'),
    QR_NOT_FOUND: t('sc20.qrExpired'),
  };
  const message = messages[failure.code];
  return message ? { ...failure, message } : failure;
}

/**
 * Doc ma QR tu anh khach chon — xem utils/readQrFromFile.ts.
 *
 * Anh QR he thong sinh ra chua token cua lich hen chu khong phai ma lich hen,
 * nen doc xong phai hoi may chu xem token do la lich nao roi dua thang khach
 * sang man theo doi tien do. Khach cung co the tai len mot anh chua thang ma
 * lich hen; truong hop do dien vao o tim kiem roi tra cuu luon.
 */
async function decodeQrImage(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  decoding.value = true;
  error.value = null;

  let raw: string | null = null;
  try {
    raw = await readQrFromFile(file);
  } catch {
    ui.warning(t('sc20.qrUnreadable'), t('sc20.qrTypeIn'));
    decoding.value = false;
    input.value = '';
    return;
  }

  try {
    if (!raw) {
      ui.warning(t('sc20.qrNotFound'), t('sc20.qrRetry'));
      return;
    }

    // Ma cu la "AY-xxxxxxxx", ma moi la "B-<ngay gio><so thu tu>" — nhan ca hai.
    const asCode = raw.match(/(?:AY|B)-[0-9A-Z]{6,20}/i)?.[0];
    if (asCode) {
      term.value = asCode.toUpperCase();
      ui.success(t('sc20.qrOk'), t('sc20.qrOkSub'));
      await lookup();
      return;
    }

    const found = await api.post<{ code: string }>('/bookings/lookup-qr', { token: raw });
    ui.success(t('sc20.qrOk'), found.code);
    await navigateTo(`/bookings/${found.code}/progress`);
  } catch (caught) {
    error.value = localise(normalizeError(caught));
  } finally {
    decoding.value = false;
    // Xoa de chon lai dung tep do van kich hoat duoc su kien change.
    input.value = '';
  }
}

useHead({ title: () => t('sc20.title') });
</script>

<template>
  <form class="flex flex-col gap-3.5 pb-4 pt-2" @submit.prevent="lookup">
    <div>
      <h3 class="mb-1.5">{{ $t('sc20.title') }}</h3>
      <p class="text-muted text-[12.5px]">
        {{ $t('sc20.lead') }}
      </p>
    </div>

    <div
      class="flex flex-col items-center gap-2.5 p-4"
      style="
        border: 1.5px dashed var(--color-accent-400);
        background: var(--color-accent-100);
        border-radius: 22px;
      "
    >
      <svg
        width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-700)"
        stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
      >
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <path d="M14 14h3v3M21 21h.01M17 21h.01M21 17h.01" />
      </svg>
      <p class="text-[13.5px] font-semibold">{{ $t('sc20.qrTitle') }}</p>
      <p class="text-muted text-center text-[11.5px] leading-[1.5]">
        {{ $t('sc20.qrLead') }}
      </p>
      <label class="btn btn-primary cursor-pointer text-[13px]" style="min-height: 44px">
        {{ decoding ? $t('sc20.qrReading') : $t('sc20.qrPick') }}
        <input type="file" class="sr-only" accept="image/*" @change="decodeQrImage" />
      </label>
    </div>

    <div class="flex items-center gap-2.5">
      <span class="h-px flex-1" style="background: var(--color-divider)" />
      <span class="text-muted text-[11.5px]">{{ $t('sc20.orCode') }}</span>
      <span class="h-px flex-1" style="background: var(--color-divider)" />
    </div>

    <AyField for="term" :label="$t('sc20.termLabel')" :hint="$t('sc20.termHint')" required>
      <input
        id="term"
        v-model="term"
        class="input"
        type="search"
        placeholder="B-202610081226001 / 0969 376 966"
        autocomplete="off"
      />
    </AyField>

    <AyErrorNote :error="error" />

    <button
      type="submit"
      class="btn btn-primary btn-block"
      style="min-height: 48px; font-size: 15px; margin: 0"
      :disabled="loading || !term.trim()"
    >
      {{ loading ? $t('sc20.looking') : $t('sc20.submit') }}
    </button>

    <NuxtLink to="/" class="btn btn-ghost self-center text-[13px]">{{ $t('common.backHome') }}</NuxtLink>
  </form>
</template>
