<script setup lang="ts">
import type { ApiError, Booking, DayAvailability, ServiceItem } from '~/types/models';

/** SC-25 Dat lai lich bao duong — FR-BOOK-17, FR-BOOK-18, BR-11. */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const api = useApi();
const booking = useBookingStore();
const { t } = useI18n();
const { dateTime } = useFormat();

const code = route.params.code as string;

/**
 * Nap kem danh muc dich vu: lich hen chi luu ma dich vu va ten da chup lai luc
 * dat, khong co gia. Phai doi chieu sang danh muc moi co gia de buoc xac nhan
 * cong ra dung tien.
 */
const { data } = await useAsyncData(`rebook-${code}`, async () => {
  const [previous, services] = await Promise.all([
    api.get<Booking>(`/bookings/${code}`),
    api.get<ServiceItem[]>('/services'),
  ]);
  return { previous, services };
});

const previous = computed(() => data.value?.previous ?? null);

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

  // Doi chieu ma dich vu cua lan truoc sang danh muc dang ban. Truoc day cho
  // selectedServices bang rong nen buoc xac nhan khong liet ke duoc hang muc
  // nao va tong tien ra 0.
  const wanted = (previous.value.services ?? [])
    .map((line) => line.serviceId)
    .filter((id): id is string => Boolean(id));
  const picked = (data.value?.services ?? []).filter((item) => wanted.includes(item.id));

  // Dich vu cu co the da ngung ban; khong con cai nao thi khong dat lai duoc.
  if (picked.length === 0) {
    error.value = { statusCode: 400, code: 'NO_SERVICE', message: t('sc25.servicesGone') };
    return;
  }

  booking.reset();
  booking.storeId = previous.value.storeId;
  booking.selectedServices = picked;
  booking.selectedServiceIds = picked.map((item) => item.id);
  booking.serviceType = bookingServiceTypeOf(picked.map((item) => kindOfService(item.type)));
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

useHead({ title: () => t('sc25.title') });
</script>

<template>
  <div v-if="previous" class="mx-auto flex max-w-3xl flex-col gap-5">
    <AyPageHeader
      code="SC-25" :title="$t('sc25.title')" :back-to="`/bookings/${code}`"
      :description="$t('sc25.lead')"
    />

    <section class="card flex flex-col gap-2">
      <h2 class="font-heading text-[16px]">{{ $t('sc25.previous') }}</h2>
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
      <AyButton block :disabled="!slot" @click="continueBooking">{{ $t('sc25.continue') }}</AyButton>
    </div>
  </div>
</template>
