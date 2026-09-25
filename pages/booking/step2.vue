<script setup lang="ts">
import type { DayAvailability, Store } from '~/types/models';

/**
 * SC-13 Dat lich buoc 2 (khach) va SC-13a (thanh vien) —
 * FR-BOOK-04, FR-BOOK-05, BR-07, BR-08.
 *
 * Ban thiet ke dat viec chon cua hang o buoc nay, ngay tren lich thang, vi
 * khung gio trong phu thuoc cua hang. Nut tiep theo nam trong dong noi dung
 * chu khong ghim duoi man hinh.
 */
const api = useApi();
const booking = useBookingStore();
const { i18n, date: fmtDate } = useFormat();

const days = ref<DayAvailability[]>([]);
const loading = ref(true);
/** Nap ca thang de lich thang co du du lieu tung ngay. */
const rangeFrom = ref(fmtDate(new Date(), 'yyyy-MM-dd'));

const { data: stores } = await useAsyncData('booking-stores', () => api.get<Store[]>('/stores'));

async function load(): Promise<void> {
  if (!booking.storeId) {
    days.value = [];
    loading.value = false;
    return;
  }
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
  if (booking.selectedServiceIds.length === 0) {
    await navigateTo('/booking/step1');
    return;
  }
  if (!booking.storeId && (stores.value ?? []).length === 1) {
    booking.storeId = stores.value![0].id;
  }
  await load();
});

watch(rangeFrom, load);
watch(
  () => booking.storeId,
  () => {
    // Doi cua hang thi khung gio da chon khong con dung nua.
    booking.slot = null;
    booking.persist();
    void load();
  },
);
watch(() => booking.slot, () => booking.persist(), { deep: true });

function pickStore(store: Store): void {
  booking.storeId = store.id;
  booking.store = store;
}

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
  <div class="flex flex-col gap-[15px] pb-4">
    <BookingSteps :current="2" />

    <!-- Nhac lai lua chon o buoc 1 -->
    <div class="card gap-1" style="background: var(--color-neutral-100)">
      <div class="card-kicker">Bước 1 đã chọn</div>
      <div class="text-[13px]">
        {{ booking.selectedServices.map((s) => i18n(s.name)).join(' · ') || 'Chưa chọn dịch vụ' }}
      </div>
    </div>

    <section class="flex flex-col gap-2.5">
      <h5>Chọn cửa hàng</h5>
      <label
        v-for="store in stores ?? []"
        :key="store.id"
        class="radio gap-[11px] px-3.5 py-3"
        style="border-radius: 20px"
        :style="
          booking.storeId === store.id
            ? 'background: var(--color-surface)'
            : 'background: var(--color-neutral-100)'
        "
      >
        <input
          type="radio"
          name="store"
          :checked="booking.storeId === store.id"
          @change="pickStore(store)"
        />
        <span class="dot" />
        <span class="min-w-0 flex-1">
          <span
            class="block text-[14px]"
            :class="booking.storeId === store.id ? 'font-semibold' : ''"
          >
            {{ i18n(store.name) }}
          </span>
          <span class="text-muted block truncate text-[11.5px]">{{ i18n(store.address) }}</span>
        </span>
      </label>
    </section>

    <AySlotPicker
      v-model="booking.slot"
      :days="days"
      :loading="loading"
      @need-range="rangeFrom = $event"
    />

    <div
      class="flex justify-between pt-3 text-[12.5px]"
      style="border-top: 1px solid var(--color-divider)"
    >
      <span class="text-muted">Dự kiến hoàn thành</span>
      <strong v-if="estimatedEnd">≈ {{ estimatedEnd }} ({{ booking.estimatedMinutes }} phút)</strong>
      <strong v-else>—</strong>
    </div>

    <NuxtLink
      to="/booking/step3"
      class="btn btn-primary btn-block"
      style="min-height: 48px; font-size: 15px; margin: 0"
      :class="booking.step2Complete ? '' : 'pointer-events-none opacity-50'"
      :aria-disabled="!booking.step2Complete"
    >
      Tiếp theo →
    </NuxtLink>

    <NuxtLink to="/booking/step1" class="btn btn-ghost self-center text-[13px]">
      ← Quay lại
    </NuxtLink>
  </div>
</template>
