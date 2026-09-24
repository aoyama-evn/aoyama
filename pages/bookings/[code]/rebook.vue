<script setup lang="ts">
import type { ApiError, Booking, DayAvailability } from '~/types/models';

/** SC-25 Dat lai lich bao duong — FR-BOOK-17, FR-BOOK-18, BR-11. */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const api = useApi();
const booking = useBookingStore();
const { dateTime } = useFormat();

const code = route.params.code as string;
const { data: previous } = await useAsyncData(`rebook-${code}`, () =>
  api.get<Booking>(`/bookings/${code}`),
);

const days = ref<DayAvailability[]>([]);
const slot = ref<{ date: string; startTime: string } | null>(null);
const loading = ref(true);
const error = ref<ApiError | null>(null);

onMounted(async () => {
  if (!previous.value) return;
  try {
    days.value = await api.get<DayAvailability[]>('/bookings/availability', {
      storeId: previous.value.storeId,
      from: new Date().toISOString().slice(0, 10),
      days: 21,
    });
  } finally {
    loading.value = false;
  }
});

/**
 * Sao chep lai lua chon cu vao luong dat lich thong thuong, roi dua nguoi dung
 * thang toi buoc xac nhan — khach dat lai thi khong phai chon lai tu dau.
 */
async function continueBooking(): Promise<void> {
  if (!previous.value || !slot.value) return;
  error.value = null;

  booking.reset();
  booking.storeId = previous.value.storeId;
  booking.serviceType = previous.value.serviceType;
  booking.selectedServiceIds = (previous.value.services ?? [])
    .map((s) => s.serviceId)
    .filter((id): id is string => Boolean(id));
  booking.selectedServices = [];
  booking.slot = slot.value;
  booking.contactName = previous.value.contactName;
  booking.contactPhone = previous.value.contactPhone;
  booking.contactEmail = previous.value.contactEmail ?? '';
  if (previous.value.vehicle) {
    booking.vehicle = {
      vehicleId: previous.value.vehicle.id,
      plateNumber: previous.value.vehicle.plateNumber,
      maker: previous.value.vehicle.maker,
      model: previous.value.vehicle.model,
      engineCc: previous.value.vehicle.engineCc,
      odometer: previous.value.vehicle.currentOdometer,
    };
  }
  booking.persist();
  await navigateTo('/booking/confirm');
}

useHead({ title: 'Đặt lại lịch bảo dưỡng' });
</script>

<template>
  <div v-if="previous" class="mx-auto flex max-w-3xl flex-col gap-5">
    <AyPageHeader
      code="SC-25" title="Đặt lại lịch bảo dưỡng" :back-to="`/bookings/${code}`"
      description="Giữ nguyên cửa hàng, dịch vụ và thông tin xe của lần trước — bạn chỉ cần chọn thời gian mới."
    />

    <section class="card flex flex-col gap-2">
      <h2 class="font-heading text-[16px]">Lần trước</h2>
      <p class="text-[13.5px] text-muted">{{ dateTime(previous.scheduledAt) }}</p>
      <ul class="flex flex-wrap gap-1.5">
        <li v-for="line in previous.services ?? []" :key="line.id" class="tag bg-neutral-200 text-neutral-700">
          {{ line.serviceName }}
        </li>
      </ul>
    </section>

    <AySlotPicker v-model="slot" :days="days" :loading="loading" />

    <AyErrorNote :error="error" />

    <div class="sticky bottom-0 -mx-4 border-t border-divider bg-surface px-4 py-3 ay-safe-bottom">
      <AyButton block :disabled="!slot" @click="continueBooking">Tiếp tục xác nhận →</AyButton>
    </div>
  </div>
</template>
