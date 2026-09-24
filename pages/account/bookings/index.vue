<script setup lang="ts">
import type { Booking, Page } from '~/types/models';

/** SC-21 Lich hen cua toi — FR-BOOK-16. */
definePageMeta({ middleware: 'auth' });

const api = useApi();
const { i18n, dateTime } = useFormat();

const tab = ref<'UPCOMING' | 'PAST'>('UPCOMING');
const page = ref(1);

const { data, pending, refresh } = await useAsyncData(
  'my-bookings',
  () => api.get<Page<Booking>>('/account/bookings', { page: page.value, limit: 10 }),
  { watch: [page] },
);

const UPCOMING = ['PENDING', 'CONFIRMED', 'RECEIVED'];

const visible = computed(() => {
  const items = data.value?.items ?? [];
  return tab.value === 'UPCOMING'
    ? items.filter((b) => UPCOMING.includes(b.status))
    : items.filter((b) => !UPCOMING.includes(b.status));
});

useHead({ title: 'Lịch hẹn của tôi' });
</script>

<template>
  <div class="flex flex-col gap-5">
    <AyPageHeader code="SC-21" title="Lịch hẹn của tôi">
      <template #actions>
        <AyButton to="/booking/step1" size="sm">Đặt lịch mới</AyButton>
      </template>
    </AyPageHeader>

    <AccountNav />

    <div class="flex gap-2" role="tablist">
      <button
        type="button" role="tab" :aria-selected="tab === 'UPCOMING'"
        class="btn text-[12.5px]" :class="tab === 'UPCOMING' ? 'btn-primary' : 'btn-secondary'"
        @click="tab = 'UPCOMING'"
      >
        Sắp tới
      </button>
      <button
        type="button" role="tab" :aria-selected="tab === 'PAST'"
        class="btn text-[12.5px]" :class="tab === 'PAST' ? 'btn-primary' : 'btn-secondary'"
        @click="tab = 'PAST'"
      >
        Đã qua
      </button>
    </div>

    <AyLoading v-if="pending" />

    <AyEmptyState
      v-else-if="visible.length === 0"
      :title="tab === 'UPCOMING' ? 'Bạn chưa có lịch hẹn nào sắp tới' : 'Chưa có lịch hẹn đã qua'"
      hint="Đặt lịch trực tuyến chỉ mất khoảng một phút."
    >
      <AyButton to="/booking/step1" size="sm">Đặt lịch ngay</AyButton>
    </AyEmptyState>

    <ul v-else class="flex flex-col gap-2.5">
      <li v-for="booking in visible" :key="booking.id">
        <NuxtLink :to="`/bookings/${booking.code}`" class="card flex flex-wrap items-center gap-3 transition-colors hover:bg-accent-100">
          <div class="min-w-0 flex-1">
            <p class="font-heading text-[16px]">{{ dateTime(booking.scheduledAt) }}</p>
            <p class="truncate text-[13px] text-muted">
              {{ i18n(booking.store?.name ?? null) }}
              · {{ (booking.services ?? []).map((s) => s.serviceName).join(', ') || 'Chưa có dịch vụ' }}
            </p>
            <p class="mt-0.5 font-mono text-[12px] text-muted">{{ booking.code }}</p>
          </div>
          <AyStatusTag :status="booking.status" />
        </NuxtLink>
      </li>
    </ul>

    <div v-if="data?.meta && data.meta.totalPages > 1" class="flex justify-center gap-2">
      <AyButton variant="secondary" size="sm" :disabled="!data.meta.hasPrev" @click="page -= 1">Trước</AyButton>
      <span class="self-center text-[13px] text-muted">{{ data.meta.page }} / {{ data.meta.totalPages }}</span>
      <AyButton variant="secondary" size="sm" :disabled="!data.meta.hasNext" @click="page += 1">Sau</AyButton>
    </div>
  </div>
</template>
