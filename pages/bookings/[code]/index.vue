<script setup lang="ts">
import type { Booking } from '~/types/models';

/** SC-22 Chi tiet lich hen va ma QR — FR-QR-02, FR-QR-03. */
const route = useRoute();
const api = useApi();
const { t } = useI18n();
const { i18n, money, date: fmtDate, clock, number } = useFormat();

const code = route.params.code as string;

const { data: booking } = await useAsyncData(`booking-${code}`, () =>
  api.get<Booking>(`/bookings/${code}`),
);
if (!booking.value) {
  throw createError({ statusCode: 404, statusMessage: t('sc22.notFound') });
}

const { data: qr } = await useAsyncData(`booking-qr-${code}`, () =>
  api.get<{ available: boolean; token?: string; dataUrl?: string; message?: string }>(
    `/bookings/${code}/qr`,
  ),
);

const canModify = computed(() =>
  booking.value ? ['PENDING', 'CONFIRMED'].includes(booking.value.status) : false,
);
const canTrack = computed(() =>
  booking.value ? ['RECEIVED', 'DONE'].includes(booking.value.status) : false,
);

useHead({ title: () => t('sc22.title', { code }) });
</script>

<template>
  <div v-if="booking" class="flex flex-col gap-4 pb-4">
    <div class="flex items-center justify-between gap-2.5">
      <div>
        <div class="text-[11px] text-muted">{{ $t('sc16.codeLabel') }}</div>
        <div class="font-heading text-[19px]">{{ booking.code }}</div>
      </div>
      <AyStatusTag :status="booking.status" />
    </div>

    <!-- CP-17 hien ma QR -->
    <div
      v-if="qr?.available && qr.dataUrl"
      class="flex flex-col items-center gap-2.5 p-5"
      style="background: #fff; border-radius: 26px; box-shadow: var(--shadow-sm)"
    >
      <img
        :src="qr.dataUrl"
        :alt="$t('sc22.qrAlt', { code: booking.code })"
        style="width: 168px; height: 168px; border-radius: 16px"
      >
      <div class="font-heading text-[14px]" style="letter-spacing: 0.04em">{{ booking.code }}</div>
      <p class="text-center text-[11.5px] text-muted">
        {{ $t('sc16.qrHint') }}
      </p>
    </div>

    <div v-else class="card items-center gap-2 text-center">
      <p class="text-[13.5px] font-semibold">{{ $t('sc22.noQrTitle') }}</p>
      <p class="text-[12px] text-muted">
        {{ qr?.message ?? $t('sc22.noQrLead') }}
      </p>
    </div>

    <dl class="flex flex-col gap-2 text-[13.5px]">
      <div class="flex gap-2.5">
        <dt class="w-[76px] flex-none text-[12px] text-muted">{{ $t('sc15.datetime') }}</dt>
        <dd>
          {{ fmtDate(booking.scheduledAt, 'yyyy/MM/dd (EEE)') }}
          {{ clock(booking.slotStartTime) }}–{{ clock(booking.slotEndTime) }}
        </dd>
      </div>
      <div class="flex gap-2.5">
        <dt class="w-[76px] flex-none text-[12px] text-muted">{{ $t('sc16.store') }}</dt>
        <dd>{{ i18n(booking.store?.name ?? null) }} · {{ booking.store?.phone }}</dd>
      </div>
      <div class="flex gap-2.5">
        <dt class="w-[76px] flex-none text-[12px] text-muted">{{ $t('sc15.service') }}</dt>
        <dd>{{ (booking.services ?? []).map((s) => s.serviceName).join(' · ') }}</dd>
      </div>
      <div v-if="booking.vehicle" class="flex gap-2.5">
        <dt class="w-[76px] flex-none text-[12px] text-muted">{{ $t('sc22.vehicle') }}</dt>
        <dd>
          {{ booking.vehicle.maker }} {{ booking.vehicle.model }} · {{ booking.vehicle.plateNumber }}
          <template v-if="booking.vehicle.currentOdometer">
            · {{ number(booking.vehicle.currentOdometer) }} km
          </template>
        </dd>
      </div>
      <div v-if="booking.symptomDescription" class="flex gap-2.5">
        <dt class="w-[76px] flex-none text-[12px] text-muted">{{ $t('sc22.symptom') }}</dt>
        <dd>“{{ booking.symptomDescription }}”</dd>
      </div>
      <div class="flex gap-2.5">
        <dt class="w-[76px] flex-none text-[12px] text-muted">{{ $t('sc22.subtotal') }}</dt>
        <dd class="font-heading">
          {{ money((booking.services ?? []).reduce((s, l) => s + l.estimatedPrice, 0)) }}
        </dd>
      </div>
    </dl>

    <div
      v-if="canModify"
      class="flex flex-wrap gap-2 pt-3"
      style="border-top: 1px solid var(--color-divider)"
    >
      <NuxtLink
        :to="`/bookings/${booking.code}/reschedule`"
        class="btn btn-secondary flex-1 text-[13px]"
        style="min-height: 44px"
      >
        {{ $t('sc22.reschedule') }}
      </NuxtLink>
      <NuxtLink
        :to="`/bookings/${booking.code}/cancel`"
        class="btn btn-secondary flex-1 text-[13px]"
        style="min-height: 44px"
      >
        {{ $t('sc22.cancel') }}
      </NuxtLink>
    </div>

    <NuxtLink v-if="canTrack" :to="`/bookings/${booking.code}/progress`" class="btn btn-primary btn-cta">
      {{ $t('sc22.track') }}
    </NuxtLink>

    <NuxtLink
      v-if="booking.status === 'DONE'"
      :to="`/bookings/${booking.code}/rebook`"
      class="btn btn-secondary btn-block"
      style="min-height: 44px"
    >
      {{ $t('sc22.rebook') }}
    </NuxtLink>
  </div>
</template>
