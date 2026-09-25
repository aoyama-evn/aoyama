<script setup lang="ts">
import type { Booking, Page } from '~/types/models';

/**
 * SC-21 Lich hen cua toi — FR-BOOK-16.
 * Ban thiet ke xep tat ca lich hen thanh mot danh sach the, moi nhat truoc,
 * khong chia tab. Nut o chan the doi theo trang thai (doi lich / huy / dat lai).
 */
definePageMeta({ middleware: 'auth' });

const api = useApi();

const page = ref(1);

const { data, pending } = await useAsyncData(
  'my-bookings',
  () => api.get<Page<Booking>>('/account/bookings', { page: page.value, limit: 10 }),
  { watch: [page] },
);

useHead({ title: 'Lịch hẹn của tôi' });
</script>

<template>
  <div class="flex flex-col gap-3 pb-4 pt-1">
    <h4>Lịch hẹn của tôi</h4>

    <AyLoading v-if="pending" />

    <AyEmptyState
      v-else-if="(data?.items ?? []).length === 0"
      title="Bạn chưa có lịch hẹn nào"
      hint="Đặt lịch trực tuyến chỉ mất khoảng một phút."
    >
      <NuxtLink to="/booking/step1" class="btn btn-primary text-[12.5px]">Đặt lịch ngay</NuxtLink>
    </AyEmptyState>

    <AyBookingCard
      v-for="booking in data?.items ?? []"
      :key="booking.id"
      :booking="booking"
    />

    <div v-if="data?.meta && data.meta.totalPages > 1" class="flex justify-center gap-2 pt-1">
      <button
        type="button"
        class="btn btn-secondary text-[12.5px]"
        :disabled="!data.meta.hasPrev"
        @click="page -= 1"
      >
        Trước
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
        Sau
      </button>
    </div>

    <NuxtLink to="/" class="btn btn-ghost self-center text-[13px]">Trở về trang chủ</NuxtLink>
  </div>
</template>
