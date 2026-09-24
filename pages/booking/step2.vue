<script setup lang="ts">
import type { DayAvailability } from '~/types/models';

/** SC-13 Dat lich buoc 2 — FR-BOOK-04, FR-BOOK-05, BR-07, BR-08. */
const api = useApi();
const booking = useBookingStore();
const { i18n, date: fmtDate } = useFormat();

const days = ref<DayAvailability[]>([]);
const loading = ref(true);
/** Nap ca thang de lich thang co du du lieu tung ngay. */
const rangeFrom = ref(fmtDate(new Date(), 'yyyy-MM-dd'));

async function load(): Promise<void> {
  if (!booking.storeId) return;
  loading.value = true;
  try {
    days.value = await api.get<DayAvailability[]>('/bookings/availability', {
      storeId: booking.storeId,
      from: rangeFrom.value,
      days: 45,
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  booking.restore();
  if (!booking.step1Complete) {
    await navigateTo('/booking/step1');
    return;
  }
  await load();
});

watch(rangeFrom, load);
watch(() => booking.slot, () => booking.persist(), { deep: true });

/** Du kien hoan thanh = gio bat dau + tong thoi luong dich vu da chon. */
const estimatedEnd = computed(() => {
  if (!booking.slot || !booking.estimatedMinutes) return null;
  const [h, m] = booking.slot.startTime.split(':').map(Number);
  const total = h * 60 + m + booking.estimatedMinutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
});

useHead({ title: 'Đặt lịch — Bước 2' });
</script>

<template>
  <div class="flex flex-col gap-4 pb-24">
    <BookingSteps :current="2" />

    <!-- Nhac lai lua chon o buoc 1 -->
    <div class="card gap-1" style="background: var(--color-neutral-100)">
      <div class="card-kicker">Bước 1 đã chọn</div>
      <div class="text-[13px]">
        {{ booking.selectedServices.map((s) => i18n(s.name)).join(' · ') || 'Chưa chọn dịch vụ' }}
        <template v-if="booking.store"> — {{ i18n(booking.store.name) }}</template>
      </div>
    </div>

    <AySlotPicker
      v-model="booking.slot"
      :days="days"
      :loading="loading"
      @need-range="rangeFrom = $event"
    />
  </div>

  <div
    class="fixed inset-x-0 bottom-0 z-30 ay-safe-bottom"
    style="background: var(--color-bg); border-top: 1px solid var(--color-divider)"
  >
    <div class="sp-shell flex flex-col gap-2 px-4 py-3">
      <div v-if="booking.slot" class="flex justify-between text-[12.5px]">
        <span class="text-muted">Dự kiến hoàn thành</span>
        <strong v-if="estimatedEnd">≈ {{ estimatedEnd }} ({{ booking.estimatedMinutes }} phút)</strong>
        <strong v-else>—</strong>
      </div>
      <div v-else class="text-[12.5px] text-muted">Chọn một khung giờ để tiếp tục</div>

      <NuxtLink
        to="/booking/step3"
        class="btn btn-primary btn-cta"
        :class="booking.step2Complete ? '' : 'pointer-events-none opacity-50'"
        :aria-disabled="!booking.step2Complete"
      >
        Tiếp theo →
      </NuxtLink>
      <NuxtLink to="/booking/step1" class="btn btn-ghost self-center text-[13px]">
        ← Quay lại
      </NuxtLink>
    </div>
  </div>
</template>
