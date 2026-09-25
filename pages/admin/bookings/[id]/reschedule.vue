<script setup lang="ts">
import type { ApiError, Booking, DayAvailability } from '~/types/models';

/** SA-05 (thao tac doi lich) — FR-BOOK-24. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
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
    ui.success(t('sa05r.done'), t('sa05r.doneSub'));
    await navigateTo(`/admin/bookings/${id}`);
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    submitting.value = false;
  }
}

setScreenTitle(() => t('sa05r.title'));
useHead({ title: () => `${t('sa05r.title')} — AOYAMA Admin` });
</script>

<template>
  <div v-if="booking" class="admin-form">
    <AyPageHeader
      code="SA-05" :title="$t('sa05r.title')" :back-to="`/admin/bookings/${id}`"
      :description="$t('sa05r.current', { code: booking.code, at: dateTime(booking.scheduledAt) })"
    />

    <AySlotPicker v-model="slot" :days="days" :loading="loading" />

    <AyField :label="$t('sa05r.reason')" :hint="$t('sa05r.reasonHint')">
      <template #default="{ id: fieldId }">
        <input :id="fieldId" v-model="reason" class="input" type="text">
      </template>
    </AyField>

    <AyErrorNote :error="error" />

    <div class="admin-actions">
      <AyButton :to="`/admin/bookings/${id}`" variant="secondary">{{ $t('common.cancel') }}</AyButton>
      <AyButton :disabled="!slot" :loading="submitting" @click="submit">{{ $t('sa05r.submit') }}</AyButton>
    </div>
  </div>
</template>
