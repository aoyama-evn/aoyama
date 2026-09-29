<script setup lang="ts">
import type { Booking, Page } from '~/types/models';

/**
 * SC-21 Lich hen cua toi — FR-BOOK-16.
 * Ban thiet ke xep tat ca lich hen thanh mot danh sach the, moi nhat truoc,
 * khong chia tab. Nut o chan the doi theo trang thai (doi lich / huy / dat lai).
 */
definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
const api = useApi();

const page = ref(1);

const { data, pending, refresh } = await useAsyncData(
  'my-bookings',
  () => api.get<Page<Booking>>('/account/bookings', { page: page.value, limit: 10 }),
  { watch: [page] },
);

/** Lich dang cho khach xac nhan huy; null la popup dong. */
const cancelling = ref<Booking | null>(null);

async function onCancelled(): Promise<void> {
  cancelling.value = null;
  await refresh();
}

useHead({ title: () => t('sc21.title') });
</script>

<template>
  <div class="flex flex-col gap-3 pb-4 pt-1">
    <h4>{{ $t('sc21.title') }}</h4>

    <AyLoading v-if="pending" />

    <AyEmptyState
      v-else-if="(data?.items ?? []).length === 0"
      :title="$t('sc21.emptyTitle')"
      :hint="$t('sc21.emptyHint')"
    >
      <NuxtLink to="/booking/step1" class="btn btn-primary text-[12.5px]">{{ $t('sc21.bookNow') }}</NuxtLink>
    </AyEmptyState>

    <AyBookingCard
      v-for="booking in data?.items ?? []"
      :key="booking.id"
      :booking="booking"
      @cancel="cancelling = $event"
    />

    <AyCancelBookingDialog
      :open="cancelling !== null"
      :booking="cancelling"
      @cancelled="onCancelled"
      @close="cancelling = null"
    />

    <div v-if="data?.meta && data.meta.totalPages > 1" class="flex justify-center gap-2 pt-1">
      <button
        type="button"
        class="btn btn-secondary text-[12.5px]"
        :disabled="!data.meta.hasPrev"
        @click="page -= 1"
      >
        {{ $t('common.prev') }}
      </button>
      <span class="text-muted self-center text-[13px]">
        {{ data.meta.page }} / {{ data.meta.totalPages }}
      </span>
      <button
        type="button"
        class="btn btn-secondary text-[12.5px]"
        :disabled="!data.meta.hasNext"
        @click="page += 1"
      >
        {{ $t('common.nextPage') }}
      </button>
    </div>

    <NuxtLink to="/" class="btn btn-ghost self-center text-[13px]">{{ $t('common.backHome') }}</NuxtLink>
  </div>
</template>
