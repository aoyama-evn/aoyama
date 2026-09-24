<script setup lang="ts">
import type { DayAvailability } from '~/types/models';

/** SC-13 Dat lich buoc 2 — chon ngay va khung gio. FR-BOOK-04, FR-BOOK-05, BR-07, BR-08. */
const api = useApi();
const booking = useBookingStore();
const { date: fmtDate } = useFormat();

const days = ref<DayAvailability[]>([]);
const loading = ref(true);
const weekOffset = ref(0);
const DAYS_PER_PAGE = 14;

const fromDate = computed(() => {
  const base = new Date();
  base.setDate(base.getDate() + weekOffset.value * DAYS_PER_PAGE);
  return fmtDate(base, 'yyyy-MM-dd');
});

async function load(): Promise<void> {
  if (!booking.storeId) return;
  loading.value = true;
  try {
    days.value = await api.get<DayAvailability[]>('/bookings/availability', {
      storeId: booking.storeId,
      from: fromDate.value,
      days: DAYS_PER_PAGE,
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  booking.restore();
  // Vao thang buoc 2 ma chua chon dich vu thi quay ve buoc 1.
  if (!booking.step1Complete) {
    await navigateTo('/booking/step1');
    return;
  }
  await load();
});

watch(weekOffset, load);
watch(() => booking.slot, () => booking.persist(), { deep: true });

useHead({ title: 'Đặt lịch — Bước 2' });
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-5">
    <AyPageHeader
      code="SC-13" title="Đặt lịch — Bước 2" back-to="/booking/step1"
      description="Chọn ngày và khung giờ còn chỗ. Số chỗ hiển thị là số xe cửa hàng còn nhận được trong khung giờ đó."
    />
    <BookingSteps :current="2" />

    <div class="flex items-center justify-between gap-2">
      <AyButton variant="secondary" size="sm" :disabled="weekOffset === 0" @click="weekOffset -= 1">
        ← 2 tuần trước
      </AyButton>
      <p class="text-[13px] ay-muted">Từ {{ fmtDate(fromDate) }}</p>
      <AyButton variant="secondary" size="sm" @click="weekOffset += 1">2 tuần sau →</AyButton>
    </div>

    <AySlotPicker v-model="booking.slot" :days="days" :loading="loading" />

    <div class="sticky bottom-0 -mx-4 border-t border-divider bg-surface px-4 py-3 ay-safe-bottom">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex-1">
          <p class="text-[12.5px] ay-muted">Khung giờ đã chọn</p>
          <p class="font-heading text-[17px]">
            <template v-if="booking.slot">
              {{ fmtDate(booking.slot.date, 'yyyy/MM/dd') }} · {{ booking.slot.startTime }}
            </template>
            <template v-else>Chưa chọn</template>
          </p>
        </div>
        <AyButton to="/booking/step3" :disabled="!booking.step2Complete">Tiếp tục →</AyButton>
      </div>
    </div>
  </div>
</template>
