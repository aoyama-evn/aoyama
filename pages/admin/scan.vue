<script setup lang="ts">
import type { QrScanResult } from '~/types/models';

/** SA-07 Quet ma QR — FR-QR-05, FR-QR-08, BR-17. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { i18n, dateTime } = useFormat();

const result = ref<QrScanResult | null>(null);
const checking = ref(false);

const REASON_HINTS: Record<string, string> = {
  NOT_FOUND: 'Kiểm tra lại mã hoặc tra cứu theo số điện thoại khách.',
  CANCELLED: 'Lịch hẹn này đã bị hủy. Hỏi khách có muốn đặt lại không.',
  ALREADY_RECEIVED: 'Xe đã được tiếp nhận trước đó. Mở phiếu dịch vụ để xem tiến độ.',
  EXPIRED: 'Mã QR quá 24 tiếng kể từ giờ hẹn. Tạo lịch hẹn mới cho khách.',
  NOT_CONFIRMED: 'Lịch hẹn chưa được xác nhận. Vào chi tiết lịch hẹn để xác nhận trước.',
};

async function check(payload: { token?: string; code?: string }): Promise<void> {
  checking.value = true;
  result.value = null;
  try {
    result.value = await api.post<QrScanResult>('/admin/scan', payload);
    if (result.value.valid) ui.success('Mã hợp lệ', 'Có thể tiếp nhận xe.');
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    checking.value = false;
  }
}

useHead({ title: 'Quét mã QR — AOYAMA Admin' });
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-4">
    <AyPageHeader
      code="SA-07" title="Quét mã QR tiếp nhận"
      description="Quét mã trên điện thoại khách, hoặc nhập mã lịch hẹn nếu camera không đọc được."
    />

    <AyQrScanner
      @scanned="check({ token: $event })"
      @manual="check({ code: $event })"
    />

    <AyLoading v-if="checking" label="Đang kiểm tra mã…" />

    <section v-else-if="result" class="card flex flex-col gap-3">
      <div
        class="flex items-start gap-3 rounded-xl px-3 py-2.5"
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
        <dl class="grid gap-2 text-[14px] sm:grid-cols-2">
          <div><dt class="text-muted">Mã lịch hẹn</dt><dd class="font-mono">{{ result.booking.code }}</dd></div>
          <div><dt class="text-muted">Thời gian hẹn</dt><dd>{{ dateTime(result.booking.scheduledAt) }}</dd></div>
          <div><dt class="text-muted">Khách hàng</dt><dd>{{ result.booking.contactName }} · {{ result.booking.contactPhone }}</dd></div>
          <div><dt class="text-muted">Cửa hàng</dt><dd>{{ i18n(result.booking.store?.name ?? null) }}</dd></div>
          <div class="sm:col-span-2">
            <dt class="text-muted">Xe</dt>
            <dd>
              {{ result.booking.vehicle
                ? `${result.booking.vehicle.plateNumber} · ${result.booking.vehicle.maker} ${result.booking.vehicle.model}`
                : 'Chưa khai báo' }}
            </dd>
          </div>
          <div v-if="result.booking.symptomDescription" class="sm:col-span-2">
            <dt class="text-muted">Mô tả của khách</dt>
            <dd class="whitespace-pre-line">{{ result.booking.symptomDescription }}</dd>
          </div>
        </dl>

        <div class="flex flex-wrap gap-2">
          <AyButton
            v-if="result.valid"
            :to="`/admin/work-orders/intake?bookingId=${result.booking.id}`"
          >
            Tiếp nhận xe →
          </AyButton>
          <AyButton :to="`/admin/bookings/${result.booking.id}`" variant="secondary">
            Mở chi tiết lịch hẹn
          </AyButton>
        </div>
      </template>
    </section>
  </div>
</template>
