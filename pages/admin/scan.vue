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
const { i18n, dayLabel, clock } = useFormat();

setScreenTitle('Quét mã QR');

const result = ref<QrScanResult | null>(null);
const checking = ref(false);
const manualCode = ref('');

const REASON_HINTS: Record<string, string> = {
  NOT_FOUND: 'Kiểm tra lại mã hoặc tra cứu theo số điện thoại khách.',
  CANCELLED: 'Lịch hẹn này đã bị hủy. Hỏi khách có muốn đặt lại không.',
  ALREADY_RECEIVED: 'Xe đã được tiếp nhận trước đó. Mở phiếu dịch vụ để xem tiến độ.',
  EXPIRED: 'Mã QR quá 24 tiếng kể từ giờ hẹn. Tạo lịch hẹn mới cho khách.',
  NOT_CONFIRMED: 'Lịch hẹn chưa được xác nhận. Vào chi tiết lịch hẹn để xác nhận trước.',
};

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
    if (scanned.valid) ui.success('Mã hợp lệ', 'Có thể tiếp nhận xe.');
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    checking.value = false;
  }
}

function submitManual(): void {
  if (manualCode.value.trim()) check({ code: manualCode.value.trim().toUpperCase() });
}

useHead({ title: 'Quét mã QR — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-[15px]">
    <div
      class="grid items-start gap-3.5"
      style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); max-width: 1040px"
    >
      <section class="card gap-3" style="background: #fff">
        <h5>Quét mã QR của khách</h5>
        <AyQrScanner @scanned="check({ token: $event })" />
        <p class="text-muted text-[11.5px]">
          Quét bằng webcam hoặc đầu đọc mã vạch gắn tại quầy.
        </p>
      </section>

      <div class="flex flex-col gap-3.5">
        <section class="card gap-2.5" style="background: #fff">
          <h5>Nhập mã thủ công</h5>
          <p class="text-muted text-[12.5px]">Dùng khi không quét được mã QR.</p>
          <div class="flex flex-wrap gap-2.5">
            <input
              v-model="manualCode"
              class="input min-w-[180px] flex-1"
              placeholder="B-YYYYMMDD-nnnn"
              autocomplete="off"
              aria-label="Mã lịch hẹn"
              @keyup.enter="submitManual"
            />
            <button
              type="button"
              class="btn btn-primary flex-none"
              style="min-height: 46px; padding-inline: 20px"
              :disabled="!manualCode.trim() || checking"
              @click="submitManual"
            >
              Tra cứu
            </button>
          </div>
        </section>

        <section
          v-if="recent.length"
          class="card gap-2.5"
          style="background: #fff; padding: 0; overflow: hidden"
        >
          <div style="padding: 14px 16px 0"><h5>5 lần quét gần nhất</h5></div>
          <table class="table">
            <thead>
              <tr>
                <th style="white-space: nowrap">Mã lịch hẹn</th>
                <th>Khách</th>
                <th>Kết quả</th>
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
                    {{ entry.valid ? 'Hợp lệ' : 'Không hợp lệ' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>

    <AyLoading v-if="checking" label="Đang kiểm tra mã…" />

    <section v-else-if="result" class="card gap-3" style="background: #fff; max-width: 1040px">
      <div
        class="flex items-start gap-3 rounded-2xl px-3.5 py-3"
        :class="result.valid ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'"
      >
        <span class="text-[18px]" aria-hidden="true">{{ result.valid ? '✓' : '!' }}</span>
        <div>
          <p class="font-semibold">{{ result.valid ? 'Mã hợp lệ' : result.message }}</p>
          <p v-if="!result.valid && result.reason" class="text-[12.5px] opacity-90">
            {{ REASON_HINTS[result.reason] }}
          </p>
        </div>
      </div>

      <template v-if="result.booking">
        <dl class="grid gap-2.5 text-[14px] sm:grid-cols-2">
          <div>
            <dt class="text-muted text-[12px]">Mã lịch hẹn</dt>
            <dd class="font-mono">{{ result.booking.code }}</dd>
          </div>
          <div>
            <dt class="text-muted text-[12px]">Thời gian hẹn</dt>
            <dd>
              {{ dayLabel(result.booking.scheduledAt) }} · {{ clock(result.booking.slotStartTime) }}
            </dd>
          </div>
          <div>
            <dt class="text-muted text-[12px]">Khách hàng</dt>
            <dd>{{ result.booking.contactName }} · {{ result.booking.contactPhone }}</dd>
          </div>
          <div>
            <dt class="text-muted text-[12px]">Cửa hàng</dt>
            <dd>{{ i18n(result.booking.store?.name ?? null) }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-muted text-[12px]">Xe</dt>
            <dd>
              {{
                result.booking.vehicle
                  ? `${result.booking.vehicle.plateNumber} · ${result.booking.vehicle.maker} ${result.booking.vehicle.model}`
                  : 'Chưa khai báo'
              }}
            </dd>
          </div>
          <div v-if="result.booking.symptomDescription" class="sm:col-span-2">
            <dt class="text-muted text-[12px]">Mô tả của khách</dt>
            <dd class="whitespace-pre-line">{{ result.booking.symptomDescription }}</dd>
          </div>
        </dl>

        <div class="flex flex-wrap justify-end gap-2">
          <NuxtLink
            :to="`/admin/bookings/${result.booking.id}`"
            class="btn btn-secondary text-[13px]"
            style="min-height: 46px"
          >
            Mở chi tiết lịch hẹn
          </NuxtLink>
          <NuxtLink
            v-if="result.valid"
            :to="`/admin/work-orders/intake?bookingId=${result.booking.id}`"
            class="btn btn-primary text-[13px]"
            style="min-height: 46px"
          >
            Tiếp nhận xe →
          </NuxtLink>
        </div>
      </template>
    </section>
  </div>
</template>
