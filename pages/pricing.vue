<script setup lang="ts">
import type { ServiceItem } from '~/types/models';

/** SC-04 Bang gia tham khao — FR-PUB-04, FR-SVC-06. */
const api = useApi();
const { t } = useI18n();
const { i18n, money } = useFormat();

const { data: services } = await useAsyncData('pricing', () => api.get<ServiceItem[]>('/services'));

const grouped = computed(() => {
  const list = services.value ?? [];
  return [
    { label: t('serviceType.MAINTENANCE'), items: list.filter((s) => s.type === 'MAINTENANCE') },
    { label: t('serviceType.REPAIR'), items: list.filter((s) => s.type === 'REPAIR') },
  ].filter((g) => g.items.length > 0);
});

useHead({ title: () => `${t('sc04.title')} — AOYAMA Service` });
</script>

<template>
  <div class="flex flex-col gap-5">
    <AyPageHeader
      code="SC-04" :title="$t('sc04.title')"
      :description="$t('sc04.lead')"
    />

    <section v-for="group in grouped" :key="group.label">
      <h2 class="mb-2 font-heading text-[17px]">{{ group.label }}</h2>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th scope="col">{{ $t('sc04.colService') }}</th>
              <th scope="col" class="hidden sm:table-cell">{{ $t('sc04.colDetail') }}</th>
              <th scope="col" class="text-center">{{ $t('sc04.colTime') }}</th>
              <th scope="col" class="text-right">{{ $t('sc04.colPrice') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="service in group.items" :key="service.id">
              <td>
                <NuxtLink :to="`/services/${service.slug}`" class="font-semibold hover:underline">
                  {{ i18n(service.name) }}
                </NuxtLink>
              </td>
              <td class="hidden text-[13px] text-muted sm:table-cell">
                {{ i18n(service.shortDescription) }}
              </td>
              <td class="text-center whitespace-nowrap">
                {{ $t('common.minutesFull', { n: service.durationMinutes }) }}
              </td>
              <td class="text-right font-heading whitespace-nowrap">
                {{ service.quoteOnly ? $t('common.quotePrivate') : `~ ${money(service.basePrice)}` }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <p class="text-[12.5px] text-muted">
      {{ $t('sc04.footnote') }}
    </p>

    <AyButton to="/booking/step1" class="self-start">{{ $t('sc21.bookNow') }}</AyButton>
  </div>
</template>
