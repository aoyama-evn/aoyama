<script setup lang="ts">
import type { Store } from '~/types/models';

/** SC-05 Danh sach cua hang. */
const api = useApi();
const { t } = useI18n();
const { i18n } = useFormat();

const { data: stores } = await useAsyncData('stores', () => api.get<Store[]>('/stores'));

useHead({ title: () => `${t('sc05.title')} — AOYAMA Service` });
</script>

<template>
  <div class="flex flex-col gap-5">
    <AyPageHeader
      code="SC-05"
      :title="$t('sc05.title')"
      :description="$t('sc05.lead')"
    />

    <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <article v-for="store in stores ?? []" :key="store.id" class="card flex flex-col gap-2">
        <h2 class="font-heading text-[16px]">{{ i18n(store.name) }}</h2>
        <p class="text-[13px] text-muted">{{ i18n(store.address) }}</p>
        <p class="text-[13.5px]">
          <a :href="`tel:${store.phone}`" class="hover:underline">{{ store.phone }}</a>
        </p>
        <div class="mt-auto flex gap-2 pt-2">
          <AyButton :to="`/stores/${store.id}`" variant="secondary" size="sm">{{ $t('sc05.detail') }}</AyButton>
          <AyButton :to="`/booking/step1?storeId=${store.id}`" size="sm">{{ $t('sc05.book') }}</AyButton>
        </div>
      </article>
    </div>

    <AyEmptyState v-if="(stores ?? []).length === 0" :title="$t('sc05.empty')" />
  </div>
</template>
