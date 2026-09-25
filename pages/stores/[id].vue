<script setup lang="ts">
import type { Store } from '~/types/models';

/** SC-06 Chi tiet cua hang — FR-STO-02. */
const route = useRoute();
const api = useApi();
const { t } = useI18n();
const { i18n, clock } = useFormat();

const id = route.params.id as string;
const { data: store } = await useAsyncData(`store-${id}`, () => api.get<Store>(`/stores/${id}`));

if (!store.value) {
  throw createError({ statusCode: 404, statusMessage: t('sc06.notFound') });
}

useHead({ title: () => `${i18n(store.value?.name ?? null)} — AOYAMA Service` });

const WEEKDAYS = computed(() => [0, 1, 2, 3, 4, 5, 6].map((d) => t(`weekday.${d}`)));

const hours = computed(() =>
  [...(store.value?.businessHours ?? [])].sort((a, b) => a.weekday - b.weekday),
);

const upcomingHolidays = computed(() => {
  const today = new Date().toISOString().slice(0, 10);
  return (store.value?.holidays ?? []).filter((h) => h.date >= today).slice(0, 5);
});
</script>

<template>
  <div v-if="store" class="flex flex-col gap-5">
    <AyPageHeader code="SC-06" :title="i18n(store.name)" back-to="/stores">
      <template #actions>
        <AyButton :to="`/booking/step1?storeId=${store.id}`">{{ $t('sc06.bookHere') }}</AyButton>
      </template>
    </AyPageHeader>

    <div class="grid gap-4 lg:grid-cols-3">
      <section class="card lg:col-span-2">
        <h2 class="mb-2 font-heading text-[16px]">{{ $t('sc06.info') }}</h2>
        <dl class="flex flex-col gap-2 text-[14px]">
          <div class="flex gap-3"><dt class="w-28 flex-none text-muted">{{ $t('sc06.address') }}</dt><dd>{{ i18n(store.address) }}</dd></div>
          <div class="flex gap-3"><dt class="w-28 flex-none text-muted">{{ $t('sc06.phone') }}</dt><dd><a :href="`tel:${store.phone}`" class="hover:underline">{{ store.phone }}</a></dd></div>
          <div v-if="store.email" class="flex gap-3"><dt class="w-28 flex-none text-muted">{{ $t('sc06.email') }}</dt><dd>{{ store.email }}</dd></div>
          <div class="flex gap-3"><dt class="w-28 flex-none text-muted">{{ $t('sc06.capacity') }}</dt><dd>{{ $t('sc06.capacityValue', { n: store.defaultCapacity }) }}</dd></div>
        </dl>
        <p v-if="i18n(store.description)" class="mt-3 text-[13.5px] text-muted">{{ i18n(store.description) }}</p>
      </section>

      <section class="card">
        <h2 class="mb-2 font-heading text-[16px]">{{ $t('sc06.hours') }}</h2>
        <dl class="flex flex-col gap-1 text-[13.5px]">
          <div v-for="hour in hours" :key="hour.id" class="flex justify-between">
            <dt :class="hour.isClosed ? 'text-muted' : ''">{{ WEEKDAYS[hour.weekday] }}</dt>
            <dd :class="hour.isClosed ? 'text-danger' : ''">
              {{ hour.isClosed ? $t('sc06.closed') : `${clock(hour.openTime)}–${clock(hour.closeTime)}` }}
            </dd>
          </div>
        </dl>

        <template v-if="upcomingHolidays.length">
          <h3 class="mb-1 mt-4 text-[13px] font-semibold">{{ $t('sc06.holidays') }}</h3>
          <ul class="flex flex-col gap-0.5 text-[13px] text-muted">
            <li v-for="holiday in upcomingHolidays" :key="holiday.id">
              {{ holiday.date }}<template v-if="holiday.reason"> · {{ holiday.reason }}</template>
            </li>
          </ul>
        </template>
      </section>
    </div>
  </div>
</template>
