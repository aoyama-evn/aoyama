<script setup lang="ts">
import type { NotificationLog } from '~/types/models';

/**
 * SC-33 Thong bao cua toi.
 *
 * Cua hang van nhan tin SMS nhu cu; day la ban sao doc duoc ngay trong ung
 * dung, de khach khong phai lui tim giua ca hop tin nhan dien thoai. Mo
 * trang la danh dau da doc het — khong bat bam tung cai, vi doc luot qua
 * danh sach cung la doc roi.
 */
definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
const api = useApi();
const { dateTime } = useFormat();

const { data: items, pending } = await useAsyncData('thong-bao-cua-toi', () =>
  api.get<NotificationLog[]>('/account/notifications'),
);

onMounted(async () => {
  try {
    await api.put('/account/notifications/read-all', {});
  } catch {
    // Khong danh dau duoc thi chi la con so tren chuong chua giam — bo qua.
  }
});

/**
 * Than tin nhan mo dau bang "【AOYAMA】" va ten khach. Trong ung dung thi
 * khach biet minh la ai va dang o dau roi, nen cat di cho do chat.
 */
function body(log: NotificationLog): string {
  return log.body.replace(/^【[^】]*】\s*/, '').trim();
}

useHead({ title: () => t('sc33.title') });
</script>

<template>
  <div class="flex flex-col gap-3.5 pb-4 pt-2">
    <div>
      <h3 class="mb-1.5">{{ $t('sc33.title') }}</h3>
      <p class="text-muted text-[12.5px]">{{ $t('sc33.lead') }}</p>
    </div>

    <AyLoading v-if="pending" :label="$t('common.loading')" />

    <AyEmptyState v-else-if="(items ?? []).length === 0" :title="$t('sc33.empty')" />

    <ul v-else class="flex flex-col gap-2.5">
      <li
        v-for="log in items ?? []"
        :key="log.id"
        class="card gap-1.5"
        :style="log.readAt ? '' : 'border-left: 3px solid var(--color-accent)'"
      >
        <div class="flex items-baseline justify-between gap-2.5">
          <span class="font-heading text-[13.5px]">{{ $t(`notifEvent.${log.event}`) }}</span>
          <span class="text-muted whitespace-nowrap text-[11.5px]">{{ dateTime(log.createdAt) }}</span>
        </div>
        <p class="whitespace-pre-line text-[13px] leading-[1.55]">{{ body(log) }}</p>
      </li>
    </ul>

    <NuxtLink to="/account/bookings" class="btn btn-ghost self-center text-[13px]">
      {{ $t('nav.myBookings') }} →
    </NuxtLink>
  </div>
</template>
