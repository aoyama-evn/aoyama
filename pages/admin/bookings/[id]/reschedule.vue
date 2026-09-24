<script setup lang="ts">
import type { ApiError, Booking, DayAvailability } from '~/types/models';

/** SA-05 (thao tac doi lich) — FR-BOOK-24. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { dateTime } = useFormat();

const id = route.params.id as string;
const { data: booking } = await useAsyncData(`admin-resched-${id}`, () =>
  api.get<Booking>(`/admin/bookings/${id}`),
);

const days = ref<DayAvailability[]>([]);
const slot = ref<{ date: string; startTime: string } | null>(null);
const reason = ref('');
const loading = ref(true);
const submitting = ref(false);
const error = ref<ApiError | null>(null);

onMounted(async () => {
  if (!booking.value) return;
  try {
    days.value = await api.get<DayAvailability[]>('/bookings/availability', {
      storeId: booking.value.storeId,
      from: new Date().toISOString().slice(0, 10),
      days: 28,
    });
  } finally {
    loading.value = false;
  }
});

async function submit(): Promise<void> {
  if (!slot.value) return;
  submitting.value = true;
  error.value = null;
  try {
    await api.put(`/admin/bookings/${id}/reschedule`, {
      date: slot.value.date,
      startTime: slot.value.startTime,
      reason: reason.value || undefined,
    });
    ui.success('Đã đổi lịch hẹn', 'Khách đã nhận SMS về thời gian mới.');
    await navigateTo(`/admin/bookings/${id}`);
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    submitting.value = false;
  }
}

useHead({ title: 'Đổi lịch hẹn — AOYAMA Admin' });
</script>

<template>
  <div v-if="booking" class="mx-auto flex max-w-3xl flex-col gap-4">
    <AyPageHeader
      code="SA-05" title="Đổi lịch hẹn" :back-to="`/admin/bookings/${id}`"
      :description="`${booking.code} · hiện tại ${dateTime(booking.scheduledAt)}`"
    />

    <AySlotPicker v-model="slot" :days="days" :loading="loading" />

    <AyField label="Lý do đổi lịch" hint="Ghi vào nhật ký thay đổi của lịch hẹn">
      <template #default="{ id: fieldId }">
        <input :id="fieldId" v-model="reason" class="ay-input" type="text">
      </template>
    </AyField>

    <AyErrorNote :error="error" />

    <div class="flex gap-2">
      <AyButton :disabled="!slot" :loading="submitting" @click="submit">Xác nhận đổi lịch</AyButton>
      <AyButton :to="`/admin/bookings/${id}`" variant="secondary">Hủy</AyButton>
    </div>
  </div>
</template>
