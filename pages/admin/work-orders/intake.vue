<script setup lang="ts">
import type { AiDiagnosis, ApiError, Booking, ServiceHistory, WorkOrder } from '~/types/models';

/**
 * SA-08 Tiep nhan xe — FR-QR-06, FR-QR-07, FR-WO-01, FR-WO-03, BR-18.
 * Ban thiet ke lap lai bo ba the tom tat cua SA-05, roi den the "Ghi nhan hien
 * trang khi tiep nhan" va hang hanh dong can phai.
 */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { i18n, dayLabel, clock, money, number } = useFormat();

const bookingId = route.query.bookingId as string | undefined;

const { data: booking } = await useAsyncData(`intake-booking-${bookingId}`, () =>
  bookingId ? api.get<Booking>(`/admin/bookings/${bookingId}`) : Promise.resolve(null),
);

setScreenTitle(() =>
  booking.value ? `Tiếp nhận xe · ${booking.value.code}` : 'Tiếp nhận xe',
);

const { data: diagnosis } = await useAsyncData(`intake-diag-${bookingId}`, () =>
  booking.value?.aiDiagnosisId
    ? api.get<AiDiagnosis>(`/ai/diagnosis/sessions/${booking.value.aiDiagnosisId}`)
    : Promise.resolve(null),
);

const { data: history } = await useAsyncData(`intake-history-${bookingId}`, () =>
  booking.value?.vehicleId
    ? api.get<{ items: ServiceHistory[] }>(`/admin/vehicles/${booking.value.vehicleId}/history`, {
        limit: 3,
      })
    : Promise.resolve(null),
);

const form = reactive({
  intakeOdometer: null as number | null,
  /** Muc nhien lieu theo phan tu binh, dung nhu ban thiet ke ghi "1/2". */
  intakeFuelLevel: 2,
  intakeAccessories: '',
  intakeNote: '',
  customerSymptom: '',
});
const photos = ref<string[]>([]);
const submitting = ref(false);
const error = ref<ApiError | null>(null);
const errors = reactive<Record<string, string>>({});

const FUEL_LEVELS = [
  { value: 0, label: 'Cạn' },
  { value: 1, label: '1/4' },
  { value: 2, label: '1/2' },
  { value: 3, label: '3/4' },
  { value: 4, label: 'Đầy' },
];

watchEffect(() => {
  if (!booking.value) return;
  if (!form.customerSymptom) form.customerSymptom = booking.value.symptomDescription ?? '';
  if (form.intakeOdometer === null && booking.value.vehicle?.currentOdometer) {
    form.intakeOdometer = booking.value.vehicle.currentOdometer;
  }
});

const estimatedTotal = computed(() =>
  (booking.value?.services ?? []).reduce((sum, line) => sum + line.estimatedPrice, 0),
);

function validate(): boolean {
  Object.keys(errors).forEach((key) => delete errors[key]);
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
      intakeAccessories: form.intakeAccessories.trim() || undefined,
      intakeNote: form.intakeNote.trim() || undefined,
      customerSymptom: form.customerSymptom.trim() || undefined,
      intakePhotoUrls: photos.value,
    });
    ui.success('Đã tiếp nhận xe', `Phiếu dịch vụ ${created.code} đã được mở.`);
    await navigateTo(`/admin/work-orders/${created.id}`);
  } catch (caught) {
    error.value = normalizeError(caught);
  } finally {
    submitting.value = false;
  }
}

useHead({ title: 'Tiếp nhận xe — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-[15px]">
    <AyEmptyState
      v-if="!booking"
      title="Chưa chọn lịch hẹn"
      hint="Quét mã QR của khách hoặc mở chi tiết lịch hẹn rồi bấm Tiếp nhận xe."
    >
      <NuxtLink to="/admin/scan" class="btn btn-primary text-[12.5px]">Quét mã QR</NuxtLink>
    </AyEmptyState>

    <template v-else>
      <!-- Ba the tom tat, giong SA-05 -->
      <div
        class="grid gap-[13px]"
        style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))"
      >
        <div class="card gap-1" style="background: #fff">
          <div class="card-kicker">Khách hàng</div>
          <p class="text-[14px] font-semibold">{{ booking.contactName }}</p>
          <p class="text-muted text-[12px]">{{ booking.contactPhone }}</p>
        </div>
        <div class="card gap-1" style="background: #fff">
          <div class="card-kicker">Xe</div>
          <p class="text-[14px] font-semibold">
            <template v-if="booking.vehicle">
              {{ booking.vehicle.maker }} {{ booking.vehicle.model }}
            </template>
            <template v-else>Chưa khai báo</template>
          </p>
          <p v-if="booking.vehicle" class="text-muted text-[12px]">
            {{ booking.vehicle.plateNumber }}
            <template v-if="booking.vehicle.currentOdometer">
              · {{ number(booking.vehicle.currentOdometer) }} km
            </template>
          </p>
        </div>
        <div class="card gap-1" style="background: #fff">
          <div class="card-kicker">Thời gian &amp; cửa hàng</div>
          <p class="text-[14px] font-semibold">
            {{ dayLabel(booking.scheduledAt) }}
            {{ clock(booking.slotStartTime) }}–{{ clock(booking.slotEndTime) }}
          </p>
          <p class="text-muted text-[12px]">{{ i18n(booking.store?.name ?? null) }}</p>
        </div>
      </div>

      <div
        class="grid gap-[13px]"
        style="grid-template-columns: repeat(auto-fit, minmax(330px, 1fr))"
      >
        <section class="card gap-2.5" style="background: #fff">
          <h5>Dịch vụ đã đặt</h5>
          <table class="table" style="min-width: 270px">
            <tbody>
              <tr v-for="line in booking.services ?? []" :key="line.id">
                <td>{{ line.serviceName }}</td>
                <td class="text-right">
                  {{ line.estimatedPrice ? money(line.estimatedPrice) : 'báo giá riêng' }}
                </td>
              </tr>
            </tbody>
          </table>
          <div class="flex justify-between text-[13px]">
            <span class="text-muted">Tham khảo</span>
            <strong>{{ money(estimatedTotal) }}</strong>
          </div>
          <div
            v-if="booking.symptomDescription"
            class="pt-2.5 text-[13px]"
            style="border-top: 1px solid var(--color-divider)"
          >
            <p class="text-muted mb-1 text-[11px]">Mô tả của khách</p>
            <p class="whitespace-pre-line">“{{ booking.symptomDescription }}”</p>
          </div>
        </section>

        <section
          v-if="diagnosis && diagnosis.findings.length"
          class="flex flex-col gap-[11px] p-4"
          style="
            border: 1.5px dashed var(--color-accent-2-400);
            background: var(--color-accent-2-100);
            border-radius: 26px;
          "
        >
          <div class="flex items-center gap-2">
            <span class="tag" style="background: var(--color-accent-2-500); color: #fff">
              ✦ Gợi ý bởi AI
            </span>
          </div>
          <div class="flex flex-col gap-2.5">
            <div v-for="(finding, index) in diagnosis.findings" :key="index">
              <div class="mb-1 flex justify-between text-[13px] font-semibold">
                <span>{{ finding.label }}</span>
                <span>{{ Math.round(finding.matchPercent) }} %</span>
              </div>
              <div
                style="height: 7px; border-radius: 999px; background: var(--color-accent-2-200)"
                role="progressbar"
                :aria-valuenow="Math.round(finding.matchPercent)"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="finding.label"
              >
                <div
                  style="height: 100%; border-radius: 999px; background: var(--color-accent-2-600)"
                  :style="{ width: `${Math.min(100, Math.max(0, finding.matchPercent))}%` }"
                />
              </div>
            </div>
          </div>
          <p class="text-[11.5px] leading-[1.45]" style="color: var(--color-accent-2-800)">
            Kết quả AI kèm hội thoại, ảnh và ghi âm được đính vào lịch hẹn này (FR-AI-12). Cần kỹ
            thuật viên kiểm tra thực tế trước khi báo giá.
          </p>
        </section>

        <section v-if="(history?.items ?? []).length" class="card gap-2" style="background: #fff">
          <h5>Lịch sử gần nhất</h5>
          <ul class="flex flex-col gap-1.5 text-[13.5px]">
            <li
              v-for="record in history?.items ?? []"
              :key="record.id"
              class="flex justify-between gap-2"
            >
              <span>{{ dayLabel(record.servicedAt) }} · {{ record.summary }}</span>
              <span class="whitespace-nowrap">{{ money(record.totalAmount) }}</span>
            </li>
          </ul>
        </section>
      </div>

      <!-- Ghi hien trang — FR-WO-03, BR-18 -->
      <section class="card gap-3" style="background: #fff">
        <h5>Ghi nhận hiện trạng khi tiếp nhận</h5>

        <div
          class="grid gap-3"
          style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))"
        >
          <AyField
            label="Số km"
            required
            hint="cảnh báo nếu nhỏ hơn lần trước"
            :error="errors.intakeOdometer"
          >
            <template #default="{ id, invalid }">
              <input
                :id="id"
                v-model.number="form.intakeOdometer"
                class="input"
                type="number"
                min="0"
                inputmode="numeric"
                :aria-invalid="invalid"
              />
            </template>
          </AyField>

          <AyField label="Mức nhiên liệu">
            <template #default="{ id }">
              <select :id="id" v-model.number="form.intakeFuelLevel" class="input">
                <option v-for="level in FUEL_LEVELS" :key="level.value" :value="level.value">
                  {{ level.label }}
                </option>
              </select>
            </template>
          </AyField>

          <AyField label="Phụ kiện đi kèm">
            <template #default="{ id }">
              <input
                :id="id"
                v-model="form.intakeAccessories"
                class="input"
                placeholder="mũ bảo hiểm, cốp sau"
              />
            </template>
          </AyField>
        </div>

        <AyField label="Ảnh hiện trạng" required :error="errors.photos">
          <AyImageUpload v-model="photos" :max="6" />
        </AyField>

        <AyField label="Mô tả tình trạng do khách nêu">
          <template #default="{ id }">
            <textarea :id="id" v-model="form.customerSymptom" class="input min-h-[62px]" />
          </template>
        </AyField>

        <AyField
          label="Ghi chú tiếp nhận"
          hint="Vết xước, đồ khách để lại trong cốp…"
        >
          <template #default="{ id }">
            <textarea
              :id="id"
              v-model="form.intakeNote"
              class="input min-h-[62px]"
              placeholder="Khách xin gọi trước khi thay phụ tùng…"
            />
          </template>
        </AyField>
      </section>

      <AyErrorNote :error="error" />

      <div class="flex flex-wrap items-center justify-end gap-2.5">
        <NuxtLink
          :to="`/admin/bookings/${booking.id}`"
          class="btn btn-secondary text-[13px]"
          style="min-height: 48px; padding-inline: 20px"
        >
          Quay lại lịch hẹn
        </NuxtLink>
        <button
          type="button"
          class="btn btn-primary text-[15px]"
          style="min-height: 48px; padding-inline: 26px"
          :disabled="submitting"
          @click="submit"
        >
          {{ submitting ? 'Đang lưu…' : 'Tiếp nhận xe' }}
        </button>
      </div>
    </template>
  </div>
</template>
