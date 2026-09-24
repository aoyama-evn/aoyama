<script setup lang="ts">
import type { AiDiagnosis, ApiError, Booking, ServiceHistory, WorkOrder } from '~/types/models';

/** SA-08 Tiep nhan xe — FR-QR-06, FR-QR-07, FR-WO-01, FR-WO-03, BR-18. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { i18n, dateTime, money, number } = useFormat();

const bookingId = route.query.bookingId as string | undefined;

const { data: booking } = await useAsyncData(`intake-booking-${bookingId}`, () =>
  bookingId ? api.get<Booking>(`/admin/bookings/${bookingId}`) : Promise.resolve(null),
);

const { data: diagnosis } = await useAsyncData(`intake-diag-${bookingId}`, () =>
  booking.value?.aiDiagnosisId
    ? api.get<AiDiagnosis>(`/ai/diagnosis/sessions/${booking.value.aiDiagnosisId}`)
    : Promise.resolve(null),
);

const { data: history } = await useAsyncData(`intake-history-${bookingId}`, () =>
  booking.value?.vehicleId
    ? api.get<{ items: ServiceHistory[] }>(`/admin/vehicles/${booking.value.vehicleId}/history`, { limit: 3 })
    : Promise.resolve(null),
);

const form = reactive({
  intakeOdometer: null as number | null,
  intakeFuelLevel: 50,
  intakeNote: '',
  customerSymptom: '',
});
const photos = ref<string[]>([]);
const submitting = ref(false);
const error = ref<ApiError | null>(null);
const errors = reactive<Record<string, string>>({});

watchEffect(() => {
  if (!booking.value) return;
  if (!form.customerSymptom) form.customerSymptom = booking.value.symptomDescription ?? '';
  if (form.intakeOdometer === null && booking.value.vehicle?.currentOdometer) {
    form.intakeOdometer = booking.value.vehicle.currentOdometer;
  }
});

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k]);
  // BR-18 — so km va anh hien trang la bat buoc khi tiep nhan.
  if (form.intakeOdometer === null || form.intakeOdometer < 0) {
    errors.intakeOdometer = 'Vui lòng nhập số km hiện tại';
  }
  if (photos.value.length === 0) {
    errors.photos = 'Cần ít nhất một ảnh hiện trạng xe';
  }
  const previous = booking.value?.vehicle?.currentOdometer;
  if (previous != null && form.intakeOdometer != null && form.intakeOdometer < previous) {
    errors.intakeOdometer = `Số km nhỏ hơn lần ghi trước (${number(previous)} km) — kiểm tra lại`;
  }
  return Object.keys(errors).length === 0;
}

async function submit(): Promise<void> {
  if (!validate()) return;
  submitting.value = true;
  error.value = null;
  try {
    const created = await api.post<WorkOrder>('/admin/work-orders/intake', {
      bookingId: booking.value?.id,
      customerId: booking.value?.customerId,
      vehicleId: booking.value?.vehicleId ?? undefined,
      storeId: booking.value?.storeId,
      intakeOdometer: form.intakeOdometer,
      intakeFuelLevel: form.intakeFuelLevel,
      intakeNote: form.intakeNote.trim() || undefined,
      customerSymptom: form.customerSymptom.trim() || undefined,
      intakePhotoUrls: photos.value,
    });
    ui.success('Đã tiếp nhận xe', `Phiếu dịch vụ ${created.code} đã được mở.`);
    await navigateTo(`/admin/work-orders/${created.id}`);
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    submitting.value = false;
  }
}

useHead({ title: 'Tiếp nhận xe — AOYAMA Admin' });
</script>

<template>
  <div class="mx-auto flex max-w-4xl flex-col gap-4">
    <AyPageHeader
      code="SA-08" title="Tiếp nhận xe"
      :back-to="booking ? `/admin/bookings/${booking.id}` : '/admin/scan'"
      description="Ghi hiện trạng xe trước khi đưa vào xưởng. Số km và ảnh là bắt buộc."
    />

    <AyEmptyState
      v-if="!booking"
      title="Chưa chọn lịch hẹn"
      hint="Quét mã QR của khách hoặc mở chi tiết lịch hẹn rồi bấm Tiếp nhận xe."
    >
      <AyButton to="/admin/scan" size="sm">Quét mã QR</AyButton>
    </AyEmptyState>

    <template v-else>
      <!-- Thong tin hien ngay khi quet — FR-QR-06 -->
      <section class="ay-card">
        <h2 class="mb-2 font-heading text-[16px]">Thông tin lịch hẹn</h2>
        <dl class="grid gap-2 text-[14px] sm:grid-cols-2">
          <div><dt class="ay-muted">Mã</dt><dd class="font-mono">{{ booking.code }}</dd></div>
          <div><dt class="ay-muted">Giờ hẹn</dt><dd>{{ dateTime(booking.scheduledAt) }}</dd></div>
          <div><dt class="ay-muted">Khách hàng</dt><dd>{{ booking.contactName }} · {{ booking.contactPhone }}</dd></div>
          <div><dt class="ay-muted">Cửa hàng</dt><dd>{{ i18n(booking.store?.name ?? null) }}</dd></div>
          <div class="sm:col-span-2">
            <dt class="ay-muted">Xe</dt>
            <dd>
              {{ booking.vehicle
                ? `${booking.vehicle.plateNumber} · ${booking.vehicle.maker} ${booking.vehicle.model}`
                : 'Chưa khai báo — cần tạo hồ sơ xe trước' }}
            </dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="ay-muted">Dịch vụ đã đặt</dt>
            <dd>{{ (booking.services ?? []).map((s) => s.serviceName).join(', ') || '—' }}</dd>
          </div>
        </dl>
      </section>

      <div class="grid gap-4 lg:grid-cols-2">
        <section v-if="diagnosis && diagnosis.findings.length" class="ay-card">
          <div class="mb-2 flex items-center gap-2">
            <h2 class="font-heading text-[16px]">Chẩn đoán AI của khách</h2>
            <AyAiBadge />
          </div>
          <ul class="flex flex-col gap-1.5 text-[13.5px]">
            <li v-for="(f, i) in diagnosis.findings" :key="i" class="flex gap-2">
              <span class="ay-tag bg-teal-100 text-teal-800">{{ Math.round(f.matchPercent) }}%</span>
              <span>{{ f.label }}</span>
            </li>
          </ul>
        </section>

        <section v-if="(history?.items ?? []).length" class="ay-card">
          <h2 class="mb-2 font-heading text-[16px]">Lịch sử gần nhất</h2>
          <ul class="flex flex-col gap-1.5 text-[13.5px]">
            <li v-for="record in history?.items ?? []" :key="record.id" class="flex justify-between gap-2">
              <span>{{ dateTime(record.servicedAt) }} · {{ record.summary }}</span>
              <span class="whitespace-nowrap">{{ money(record.totalAmount) }}</span>
            </li>
          </ul>
        </section>
      </div>

      <!-- Ghi hien trang — FR-WO-03 -->
      <section class="ay-card grid gap-3 sm:grid-cols-2">
        <h2 class="font-heading text-[16px] sm:col-span-2">Hiện trạng xe khi nhận</h2>

        <AyField label="Số km hiện tại" required :error="errors.intakeOdometer">
          <template #default="{ id, invalid }">
            <input
              :id="id" v-model.number="form.intakeOdometer" class="ay-input" type="number"
              min="0" :aria-invalid="invalid" inputmode="numeric"
            >
          </template>
        </AyField>

        <AyField label="Mức nhiên liệu" :hint="`${form.intakeFuelLevel}%`">
          <template #default="{ id }">
            <input :id="id" v-model.number="form.intakeFuelLevel" class="w-full" type="range" min="0" max="100" step="5">
          </template>
        </AyField>

        <AyField label="Mô tả tình trạng do khách nêu" class="sm:col-span-2">
          <template #default="{ id }">
            <textarea :id="id" v-model="form.customerSymptom" class="ay-input min-h-[80px]" />
          </template>
        </AyField>

        <AyField label="Ghi chú tiếp nhận" hint="Vết xước, phụ kiện đi kèm, đồ khách để lại trong cốp…" class="sm:col-span-2">
          <template #default="{ id }">
            <textarea :id="id" v-model="form.intakeNote" class="ay-input min-h-[80px]" />
          </template>
        </AyField>

        <div class="sm:col-span-2">
          <AyImageUpload v-model="photos" label="Ảnh hiện trạng xe (bắt buộc)" :max="6" />
          <p v-if="errors.photos" class="ay-error">{{ errors.photos }}</p>
        </div>
      </section>

      <AyErrorNote :error="error" />

      <div class="sticky bottom-0 -mx-4 border-t border-divider bg-surface px-4 py-3">
        <div class="flex gap-2">
          <AyButton :loading="submitting" @click="submit">Tiếp nhận &amp; mở phiếu dịch vụ</AyButton>
          <AyButton :to="`/admin/bookings/${booking.id}`" variant="secondary">Hủy</AyButton>
        </div>
      </div>
    </template>
  </div>
</template>
