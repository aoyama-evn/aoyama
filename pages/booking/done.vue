<script setup lang="ts">
import type { Booking } from '~/types/models';

/**
 * SC-16 Dat lich hoan tat (khach) va SC-16a (thanh vien) — FR-BOOK-10, FR-BOOK-11.
 * Ban thiet ke dat ma QR ngay tren man hinh nay. BR-17 chi sinh ma sau khi cua
 * hang xac nhan, nen khi chua co ma thi cho no bang mot dong nhac cho.
 */
const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { i18n, slotRange } = useFormat();

const code = route.query.code as string | undefined;

const { data } = await useAsyncData(`booking-done-${code}`, async () => {
  if (!code) return { booking: null, qr: null };
  const [booking, qr] = await Promise.all([
    api.get<Booking>(`/bookings/${code}`),
    api
      .get<{ available: boolean; dataUrl?: string; message?: string }>(`/bookings/${code}/qr`)
      .catch(() => ({ available: false }) as { available: boolean; dataUrl?: string }),
  ]);
  return { booking, qr };
});

const booking = computed(() => data.value?.booking ?? null);
const qr = computed(() => data.value?.qr ?? null);

async function copyCode(): Promise<void> {
  const value = booking.value?.code ?? code ?? '';
  try {
    await navigator.clipboard.writeText(value);
    ui.success(t('sc16.copied'));
  } catch {
    ui.warning('Trình duyệt không cho sao chép', `Mã của bạn là ${value}`);
  }
}

/** Trinh duyet khong cho tai tep tu trang nhung mo anh o tab moi thi duoc. */
function saveQr(): void {
  if (!qr.value?.dataUrl) return;
  const win = window.open();
  if (!win) {
    ui.warning('Trình duyệt chặn cửa sổ mới', 'Bạn có thể chụp màn hình mã QR.');
    return;
  }
  win.document.write(
    `<img src="${qr.value.dataUrl}" alt="Mã QR ${booking.value?.code ?? ''}" style="width:100%">`,
  );
  ui.success('Đã mở ảnh mã QR', 'Nhấn giữ để lưu về máy.');
}

useHead({ title: () => t('sc16.title') });
</script>

<template>
  <div class="flex flex-col items-center gap-4 px-1 pb-4 pt-6 text-center">
    <span
      class="grid place-items-center rounded-full text-white"
      style="width: 64px; height: 64px; background: var(--color-accent-2-500)"
      aria-hidden="true"
    >
      <svg
        width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.75" stroke-linecap="round"
      >
        <path d="M4 12.5 9.5 18 20 6.5" />
      </svg>
    </span>

    <div>
      <h3>{{ $t('sc16.title') }}</h3>
      <p class="text-muted mt-1 text-[12.5px]">{{ $t('sc16.subtitle') }}</p>
    </div>

    <div
      class="flex w-full flex-col items-center gap-2.5 px-5 py-4"
      style="background: var(--color-surface); border-radius: 24px"
    >
      <p class="text-muted text-[11px]">{{ $t('sc16.codeLabel') }}</p>
      <div class="flex items-center justify-center gap-2">
        <span class="select-all font-heading text-[23px]" style="letter-spacing: 0.02em">
          {{ booking?.code ?? code }}
        </span>
        <button
          type="button"
          class="btn btn-ghost flex-none p-1"
          :aria-label="$t('sc16.copyCode')"
          :title="$t('sc16.copyCode')"
          @click="copyCode"
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
          >
            <rect x="9" y="9" width="11" height="11" rx="2.5" />
            <path d="M5 15V5.5A1.5 1.5 0 0 1 6.5 4H15" />
          </svg>
        </button>
      </div>

      <div
        class="flex w-full flex-col items-center gap-2.5 pt-3"
        style="border-top: 1px solid var(--color-divider)"
      >
        <template v-if="qr?.available && qr.dataUrl">
          <img
            :src="qr.dataUrl"
            :alt="`Mã QR lịch hẹn ${booking?.code ?? ''}`"
            class="block bg-white"
            style="width: 172px; height: 172px; border-radius: 16px"
          />
          <button
            type="button"
            class="btn btn-secondary gap-[7px] text-[12.5px]"
            style="min-height: 42px"
            @click="saveQr"
          >
            <svg
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
            >
              <path d="M12 4v11M7.5 11 12 15.5 16.5 11M5 20h14" />
            </svg>
            {{ $t('sc16.saveQr') }}
          </button>
          <p class="text-muted text-center text-[11.5px] leading-[1.5]">
            {{ $t('sc16.qrHint') }}
          </p>
        </template>

        <p v-else class="text-muted text-center text-[11.5px] leading-[1.5]">
          {{ $t('sc16.qrPending') }}
        </p>
      </div>
    </div>

    <dl v-if="booking" class="flex w-full flex-col gap-2.5 text-left text-[13.5px]">
      <div class="flex gap-2.5">
        <dt class="text-muted w-[78px] flex-none text-[12px]">{{ $t('sc15.datetime') }}</dt>
        <dd>{{ slotRange(booking) }}</dd>
      </div>
      <div class="flex gap-2.5">
        <dt class="text-muted w-[78px] flex-none text-[12px]">{{ $t('sc16.store') }}</dt>
        <dd>{{ i18n(booking.store?.name ?? null) }}</dd>
      </div>
      <div class="flex gap-2.5">
        <dt class="text-muted w-[78px] flex-none text-[12px]">{{ $t('sc15.service') }}</dt>
        <dd>{{ (booking.services ?? []).map((s) => s.serviceName).join(', ') }}</dd>
      </div>
    </dl>

    <NuxtLink
      :to="`/bookings/${booking?.code ?? code}/progress`"
      class="btn btn-primary btn-block"
      style="min-height: 48px; font-size: 15px; margin: 0"
    >
      {{ $t('sc16.trackCta') }}
    </NuxtLink>
    <NuxtLink to="/" class="btn btn-secondary btn-block" style="min-height: 44px; margin: 0">
      {{ $t('common.backHome') }}
    </NuxtLink>
  </div>
</template>
