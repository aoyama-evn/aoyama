<script setup lang="ts">
import type { ApiError, Booking } from '~/types/models';

/** SC-24 Huy lich hen — FR-BOOK-13, BR-04, BR-06. */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { dateTime } = useFormat();

const code = route.params.code as string;
const { data: booking } = await useAsyncData(`cancel-${code}`, () =>
  api.get<Booking>(`/bookings/${code}`),
);

const reason = ref('');
const submitting = ref(false);
const error = ref<ApiError | null>(null);
const confirmOpen = ref(false);

async function cancel(): Promise<void> {
  if (!booking.value) return;
  submitting.value = true;
  error.value = null;
  try {
    await api.put(`/bookings/${booking.value.id}/cancel`, { reason: reason.value || undefined });
    ui.success(t('sc24.done'));
    await navigateTo('/account/bookings');
  } catch (err) {
    error.value = normalizeError(err);
    confirmOpen.value = false;
  } finally {
    submitting.value = false;
  }
}

useHead({ title: () => t('sc24.headTitle', { code }) });
</script>

<template>
  <div v-if="booking" class="mx-auto flex max-w-md flex-col gap-5">
    <AyPageHeader code="SC-24" :title="$t('sc24.title')" :back-to="`/bookings/${code}`" />

    <section class="card flex flex-col gap-2">
      <i18n-t keypath="sc24.lead" tag="p" class="text-[14px]">
        <template #code><strong>{{ booking.code }}</strong></template>
        <template #date><strong>{{ dateTime(booking.scheduledAt) }}</strong></template>
      </i18n-t>
      <p class="text-[12.5px] text-muted">
        {{ $t('sc24.cutoff') }}
      </p>
    </section>

    <section class="card flex flex-col gap-3">
      <AyField :label="$t('sc24.reasonLabel')" :hint="$t('sc24.reasonHint')">
        <template #default="{ id }">
          <input
            :id="id"
            v-model="reason"
            class="input"
            type="text"
            maxlength="200"
            :placeholder="$t('sc24.reasonPlaceholder')"
          >
        </template>
      </AyField>

      <AyErrorNote :error="error" />

      <div class="flex gap-2">
        <AyButton :to="`/bookings/${code}`" variant="secondary" class="flex-1">{{ $t('sc24.keep') }}</AyButton>
        <AyButton variant="danger" class="flex-1" @click="confirmOpen = true">{{ $t('sc24.title') }}</AyButton>
      </div>
    </section>

    <AyConfirmDialog
      :open="confirmOpen"
      :title="$t('sc24.confirmTitle')"
      :message="$t('sc24.confirmBody')"
      :confirm-label="$t('sc24.title')"
      :cancel-label="$t('common.back')"
      danger
      :loading="submitting"
      @confirm="cancel"
      @cancel="confirmOpen = false"
    />
  </div>
</template>
