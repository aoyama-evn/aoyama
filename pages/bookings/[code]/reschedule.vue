<script setup lang="ts">
import type { ApiError, Booking, DayAvailability } from '~/types/models';

/** SC-23 Doi lich hen — FR-BOOK-14, BR-05, BR-06. */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { dateTime } = useFormat();

const code = route.params.code as string;
const { data: booking } = await useAsyncData(`resched-${code}`, () =>
  api.get<Booking>(`/bookings/${code}`),
);

const days = ref<DayAvailability[]>([]);
const slot = ref<{ date: string; startTime: string } | null>(null);
const loading = ref(true);
const submitting = ref(false);
const error = ref<ApiError | null>(null);

onMounted(async () => {
  if (!booking.value) return;
  try {
    days.value = await api.get<DayAvailability[]>('/bookings/availability', {
      storeId: booking.value.storeId,
      from: new Date().toISOString().slice(0, 10),
      days: 21,
    });
  } finally {
    loading.value = false;
  }
});

async function submit(): Promise<void> {
  if (!booking.value || !slot.value) return;
  submitting.value = true;
  error.value = null;
  try {
    await api.put(`/bookings/${booking.value.id}/reschedule`, {
      date: slot.value.date,
      startTime: slot.value.startTime,
    });
    ui.success('Đã đổi lịch hẹn', 'Chúng tôi đã gửi SMS xác nhận thời gian mới.');
    await navigateTo(`/bookings/${code}`);
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    submitting.value = false;
  }
}

useHead({ title: `Đổi lịch hẹn ${code}` });
</script>

<template>
  <div v-if="booking" class="mx-auto flex max-w-3xl flex-col gap-5">
    <AyPageHeader
      code="SC-23" title="Đổi lịch hẹn" :back-to="`/bookings/${code}`"
      :description="`Lịch hiện tại: ${dateTime(booking.scheduledAt)}`"
    />

    <AySlotPicker v-model="slot" :days="days" :loading="loading" />

    <AyErrorNote :error="error" />

    <div class="sticky bottom-0 -mx-4 border-t border-divider bg-surface px-4 py-3 ay-safe-bottom">
      <div class="flex items-center gap-3">
        <p class="flex-1 text-[13px] text-muted">
          <template v-if="slot">Thời gian mới: {{ slot.date }} · {{ slot.startTime }}</template>
          <template v-else>Chọn khung giờ mới để tiếp tục</template>
        </p>
        <AyButton :disabled="!slot" :loading="submitting" @click="submit">Xác nhận đổi lịch</AyButton>
      </div>
    </div>
  </div>
</template>
