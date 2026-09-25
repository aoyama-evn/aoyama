<script setup lang="ts">
import type { QrScanResult } from '~/types/models';

/**
 * SA-07 Quet ma QR tiep nhan — FR-QR-05, FR-QR-08, BR-17.
 * Ban thiet ke chia hai cot: khung camera ben trai, o nhap tay va danh sach
 * nam lan quet gan nhat ben phai.
 */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { t, te } = useI18n();
const { i18n, dayLabel, clock } = useFormat();

setScreenTitle(() => t('sa07.title'));

const result = ref<QrScanResult | null>(null);
const checking = ref(false);
const manualCode = ref('');

/** Goi y xu ly cho tung ly do tu choi; ly do la khoa dung chung ba thu tieng. */
function reasonHint(reason: string): string {
  return te(`sa07.reason.${reason}`) ? t(`sa07.reason.${reason}`) : '';
}

/**
 * Nam lan quet gan nhat la tien ich cua rieng may tinh o quay, khong phai du
 * lieu dung chung, nen giu trong sessionStorage thay vi luu o may chu.
 */
interface RecentScan {
  code: string;
  name: string;
  valid: boolean;
  bookingId: string | null;
}
const RECENT_KEY = 'aoyama_recent_scans';
const recent = ref<RecentScan[]>([]);

onMounted(() => {
  try {
    recent.value = JSON.parse(sessionStorage.getItem(RECENT_KEY) ?? '[]') as RecentScan[];
  } catch {
    recent.value = [];
  }
});

function remember(entry: RecentScan): void {
  recent.value = [entry, ...recent.value.filter((r) => r.code !== entry.code)].slice(0, 5);
  try {
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(recent.value));
  } catch {
    // Trinh duyet chan luu tru — danh sach chi song trong phien nay.
  }
}

async function check(payload: { token?: string; code?: string }): Promise<void> {
  checking.value = true;
  result.value = null;
  try {
    const scanned = await api.post<QrScanResult>('/admin/scan', payload);
    result.value = scanned;
    remember({
      code: scanned.booking?.code ?? payload.code ?? '—',
      name: scanned.booking?.contactName ?? '—',
      valid: scanned.valid,
      bookingId: scanned.booking?.id ?? null,
    });
    if (scanned.valid) ui.success(t('sa07.validToast'), t('sa07.validToastSub'));
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    checking.value = false;
  }
}

function submitManual(): void {
  if (manualCode.value.trim()) check({ code: manualCode.value.trim().toUpperCase() });
}

useHead({ title: () => `${t('sa07.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-[15px]">
    <div
      class="grid items-start gap-3.5"
      style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); max-width: 1040px"
    >
      <section class="card gap-3" style="background: #fff">
        <h5>{{ $t('sa07.scanTitle') }}</h5>
        <AyQrScanner @scanned="check({ token: $event })" />
        <p class="text-muted text-[11.5px]">
          {{ $t('sa07.scanHint') }}
        </p>
      </section>

      <div class="flex flex-col gap-3.5">
        <section class="card gap-2.5" style="background: #fff">
          <h5>{{ $t('sa07.manual') }}</h5>
          <p class="text-muted text-[12.5px]">{{ $t('sa07.manualHint') }}</p>
          <div class="flex flex-wrap gap-2.5">
            <input
              v-model="manualCode"
              class="input min-w-[180px] flex-1"
              placeholder="B-YYYYMMDD-nnnn"
              autocomplete="off"
              :aria-label="$t('sc20.codeLabel')"
              @keyup.enter="submitManual"
            />
            <button
              type="button"
              class="btn btn-primary flex-none"
              style="min-height: 46px; padding-inline: 20px"
              :disabled="!manualCode.trim() || checking"
              @click="submitManual"
            >
              {{ $t('sa07.lookup') }}
            </button>
          </div>
        </section>

        <section
          v-if="recent.length"
          class="card gap-2.5"
          style="background: #fff; padding: 0; overflow: hidden"
        >
          <div style="padding: 14px 16px 0"><h5>{{ $t('sa07.recent') }}</h5></div>
          <table class="table">
            <thead>
              <tr>
                <th style="white-space: nowrap">{{ $t('sc20.codeLabel') }}</th>
                <th>{{ $t('sa02.colCustomer') }}</th>
                <th>{{ $t('sa07.colResult') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="entry in recent"
                :key="entry.code"
                :data-clickable="entry.bookingId ? '' : undefined"
                @click="entry.bookingId && navigateTo(`/admin/bookings/${entry.bookingId}`)"
              >
                <td class="whitespace-nowrap tabular-nums">{{ entry.code }}</td>
                <td>{{ entry.name }}</td>
                <td>
                  <span class="tag" :class="entry.valid ? 'tag-success' : 'tag-danger'">
                    {{ entry.valid ? $t('sa07.valid') : $t('sa07.invalid') }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>

    <AyLoading v-if="checking" :label="$t('sa07.checking')" />

    <section v-else-if="result" class="card gap-3" style="background: #fff; max-width: 1040px">
      <div
        class="flex items-start gap-3 rounded-2xl px-3.5 py-3"
        :class="result.valid ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'"
      >
        <span class="text-[18px]" aria-hidden="true">{{ result.valid ? '✓' : '!' }}</span>
        <div>
          <p class="font-semibold">
            {{ result.valid ? $t('sa07.validToast') : result.message }}
          </p>
          <p v-if="!result.valid && result.reason" class="text-[12.5px] opacity-90">
            {{ reasonHint(result.reason) }}
          </p>
        </div>
      </div>

      <template v-if="result.booking">
        <dl class="grid gap-2.5 text-[14px] sm:grid-cols-2">
          <div>
            <dt class="text-muted text-[12px]">{{ $t('sc20.codeLabel') }}</dt>
            <dd class="font-mono">{{ result.booking.code }}</dd>
          </div>
          <div>
            <dt class="text-muted text-[12px]">{{ $t('sa07.when') }}</dt>
            <dd>
              {{ dayLabel(result.booking.scheduledAt) }} · {{ clock(result.booking.slotStartTime) }}
            </dd>
          </div>
          <div>
            <dt class="text-muted text-[12px]">{{ $t('sa03.colCustomer') }}</dt>
            <dd>{{ result.booking.contactName }} · {{ result.booking.contactPhone }}</dd>
          </div>
          <div>
            <dt class="text-muted text-[12px]">{{ $t('sa03.colStore') }}</dt>
            <dd>{{ i18n(result.booking.store?.name ?? null) }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-muted text-[12px]">{{ $t('sa03.colVehicle') }}</dt>
            <dd>
              {{
                result.booking.vehicle
                  ? `${result.booking.vehicle.plateNumber} · ${result.booking.vehicle.maker} ${result.booking.vehicle.model}`
                  : $t('common.notDeclared')
              }}
            </dd>
          </div>
          <div v-if="result.booking.symptomDescription" class="sm:col-span-2">
            <dt class="text-muted text-[12px]">{{ $t('sa07.symptom') }}</dt>
            <dd class="whitespace-pre-line">{{ result.booking.symptomDescription }}</dd>
          </div>
        </dl>

        <div class="flex flex-wrap justify-end gap-2">
          <NuxtLink
            :to="`/admin/bookings/${result.booking.id}`"
            class="btn btn-secondary text-[13px]"
            style="min-height: 46px"
          >
            {{ $t('sa07.openBooking') }}
          </NuxtLink>
          <NuxtLink
            v-if="result.valid"
            :to="`/admin/work-orders/intake?bookingId=${result.booking.id}`"
            class="btn btn-primary text-[13px]"
            style="min-height: 46px"
          >
            {{ $t('sa07.receiveCta') }}
          </NuxtLink>
        </div>
      </template>
    </section>
  </div>
</template>
