<script setup lang="ts">
import type { Booking } from '~/types/models';

/**
 * The lich hen cua khach — SC-01a va SC-21.
 * Ban thiet ke: than the bam duoc de xem tien do, chan the la hang nut tron
 * 38px. Lich con hieu luc thi cho doi lich va huy; lich da dong thi cho dat lai.
 */
const props = withDefaults(
  defineProps<{
    booking: Booking;
    /** SC-01a chi hien mot the, co them dong dan sang danh sach day du. */
    kicker?: string;
    showActions?: boolean;
  }>(),
  { showActions: true },
);

const { i18n, slotRange } = useFormat();

/** BR-04, BR-05 — chi lich chua dien ra va chua tiep nhan moi doi hoac huy duoc. */
const ACTIVE: string[] = ['PENDING', 'CONFIRMED'];
const CLOSED: string[] = ['CANCELLED', 'DONE', 'NO_SHOW'];

const active = computed(() => ACTIVE.includes(props.booking.status));
const closed = computed(() => CLOSED.includes(props.booking.status));

const serviceNames = computed(() =>
  (props.booking.services ?? []).map((line) => line.serviceName).join(', '),
);
</script>

<template>
  <div style="background: var(--color-surface); border-radius: 24px; overflow: hidden">
    <NuxtLink
      :to="`/bookings/${booking.code}/progress`"
      class="flex w-full flex-col gap-[7px] p-3.5 text-left"
    >
      <span class="flex items-center justify-between gap-2.5">
        <span v-if="kicker" class="card-kicker">{{ kicker }}</span>
        <span v-else class="font-heading text-[14px]">{{ booking.code }}</span>
        <AyStatusTag :status="booking.status" />
      </span>
      <span class="text-[13.5px] font-semibold">{{ slotRange(booking) }}</span>
      <span class="text-muted text-[11.5px]">
        {{ i18n(booking.store?.name ?? null) }}
        <template v-if="serviceNames"> · {{ serviceNames }}</template>
      </span>
      <span v-if="booking.vehicle" class="text-muted text-[11.5px]">
        {{ booking.vehicle.maker }} {{ booking.vehicle.model }} · {{ booking.vehicle.plateNumber }}
      </span>
    </NuxtLink>

    <div
      v-if="showActions || $slots.actions"
      class="flex justify-end gap-2 px-3.5 pb-3 pt-2.5"
      style="border-top: 1px solid var(--color-divider)"
    >
      <slot name="actions">
        <template v-if="active">
          <NuxtLink
            :to="`/bookings/${booking.code}/reschedule`"
            class="ay-round-btn"
            :aria-label="$t('card.reschedule', { code: booking.code })"
            :title="$t('card.reschedule', { code: booking.code })"
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
            >
              <rect x="3.5" y="5" width="17" height="16" rx="3" />
              <path d="M8 3v4M16 3v4M3.5 10h17" />
            </svg>
          </NuxtLink>
          <NuxtLink
            :to="`/bookings/${booking.code}/cancel`"
            class="ay-round-btn"
            :aria-label="$t('card.cancel', { code: booking.code })"
            :title="$t('card.cancel', { code: booking.code })"
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.75" stroke-linecap="round" aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </NuxtLink>
        </template>

        <NuxtLink
          v-else-if="closed"
          :to="`/bookings/${booking.code}/rebook`"
          class="ay-round-btn ay-round-btn-accent"
          :aria-label="$t('card.rebook', { code: booking.code })"
          :title="$t('card.rebook', { code: booking.code })"
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
          >
            <path d="M20 12a8 8 0 1 1-2.6-5.9" />
            <path d="M20 4v4h-4" />
          </svg>
        </NuxtLink>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.ay-round-btn {
  display: inline-grid;
  min-width: 38px;
  min-height: 38px;
  place-items: center;
  border-radius: 999px;
  background: var(--color-neutral-200);
  color: var(--color-neutral-800);
  padding: 8px;
}
.ay-round-btn:hover {
  background: var(--color-neutral-300);
  text-decoration: none;
}
.ay-round-btn-accent {
  background: var(--color-accent-200);
  color: var(--color-accent-800);
}
.ay-round-btn-accent:hover {
  background: var(--color-accent-300);
}
</style>
