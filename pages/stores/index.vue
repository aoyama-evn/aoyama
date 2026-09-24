<script setup lang="ts">
import type { Store } from '~/types/models';

/** SC-05 Danh sach cua hang. */
const api = useApi();
const { i18n } = useFormat();

const { data: stores } = await useAsyncData('stores', () => api.get<Store[]>('/stores'));

useHead({ title: 'Cửa hàng — AOYAMA Service' });
</script>

<template>
  <div class="flex flex-col gap-5">
    <AyPageHeader code="SC-05" title="Cửa hàng" description="Chọn cửa hàng gần bạn để xem giờ làm việc và đặt lịch." />

    <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <article v-for="store in stores ?? []" :key="store.id" class="ay-card flex flex-col gap-2">
        <h2 class="font-heading text-[16px]">{{ i18n(store.name) }}</h2>
        <p class="text-[13px] ay-muted">{{ i18n(store.address) }}</p>
        <p class="text-[13.5px]">
          <a :href="`tel:${store.phone}`" class="hover:underline">{{ store.phone }}</a>
        </p>
        <div class="mt-auto flex gap-2 pt-2">
          <AyButton :to="`/stores/${store.id}`" variant="secondary" size="sm">Chi tiết</AyButton>
          <AyButton :to="`/booking/step1?storeId=${store.id}`" size="sm">Đặt lịch</AyButton>
        </div>
      </article>
    </div>

    <AyEmptyState v-if="(stores ?? []).length === 0" title="Chưa có cửa hàng nào" />
  </div>
</template>
