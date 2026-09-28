<script setup lang="ts">
import type { ServiceItem } from '~/types/models';

/**
 * SC-03 Chi tiet dich vu — man hinh nay khong co trong ban thiet ke, nen no
 * muon nguyen ngon ngu cua SC-02: mot cot, the nen mat the bo tron 20-22px,
 * nut chinh rong het be ngang cao 48px va duong dan quay lai o duoi cung.
 */
const route = useRoute();
const api = useApi();
const booking = useBookingStore();
const { t } = useI18n();
const { i18n, money } = useFormat();

const slug = route.params.slug as string;
const { data: service } = await useAsyncData(`service-${slug}`, () =>
  api.get<ServiceItem>(`/services/${slug}`),
);

if (!service.value) {
  throw createError({ statusCode: 404, statusMessage: t('sc03.notFound') });
}

useHead({ title: () => `${i18n(service.value?.name ?? null)} — AOYAMA Service` });

/**
 * Dong phu duoi ten: ten tieng Anh, giong dong thu hai o SC-02. Khi dang xem
 * ban tieng Anh thi bo di, khong lap lai chinh dong tieu de.
 */
const subtitle = computed(() => {
  const en = service.value?.name.en ?? '';
  return en && en !== i18n(service.value?.name ?? null) ? en : '';
});

const priceLabel = computed(() =>
  service.value?.quoteOnly ? t('common.quotePrivate') : `~ ${money(service.value?.basePrice ?? 0)}`,
);

/** Chu ky bao duong: theo thang, theo km, hoac ca hai. */
const intervalLabel = computed(() => {
  const months = service.value?.maintenanceIntervalMonths;
  const km = service.value?.maintenanceIntervalKm;
  if (!months && !km) return null;
  const parts: string[] = [];
  if (months) parts.push(t('sc03.every', { months }));
  if (km) parts.push(months ? t('sc03.orKm', { km: km.toLocaleString('ja-JP') }) : `${km.toLocaleString('ja-JP')} km`);
  return parts.join(' ');
});

/** Bam dat lich tu day thi dich vu duoc chon san o buoc 1. */
function bookThis(): void {
  if (!service.value) return;
  booking.restore();
  if (!booking.selectedServiceIds.includes(service.value.id)) {
    booking.toggleService(service.value);
  }
  navigateTo('/booking/step1');
}
</script>

<template>
  <div v-if="service" class="flex flex-col gap-3.5 pb-4">
    <!-- Ten dich vu kem bieu tuong, lay lai cach ve o dong danh sach SC-02 -->
    <div class="flex items-start gap-3">
      <span
        class="grid flex-none place-items-center"
        style="width: 42px; height: 42px; border-radius: 14px; background: var(--color-accent-200)"
        aria-hidden="true"
      >
        <AyServiceIcon :icon-key="service.iconKey" />
      </span>
      <div class="min-w-0 flex-1 leading-[1.25]">
        <h4>{{ i18n(service.name) }}</h4>
        <p v-if="subtitle" class="text-muted mt-0.5 text-[11.5px]">{{ subtitle }}</p>
      </div>
      <span class="tag tag-accent-2 flex-none">{{ $t(`serviceType.${service.type}`) }}</span>
    </div>

    <!-- Gia va cac so lieu chinh: tren dien thoai day la thu khach xem truoc -->
    <section
      class="flex flex-col gap-2.5 p-3.5"
      style="background: var(--color-surface); border-radius: 22px"
    >
      <div>
        <div class="card-kicker">{{ $t('sc03.refPrice') }}</div>
        <p class="font-heading text-[26px] leading-[1.1]">{{ priceLabel }}</p>
        <p v-if="!service.quoteOnly" class="text-muted mt-1 text-[11.5px] leading-[1.45]">
          {{ $t('sc03.priceNote') }}
        </p>
      </div>

      <dl
        class="flex flex-col gap-1.5 pt-2.5 text-[13px]"
        style="border-top: 1px solid var(--color-divider)"
      >
        <div class="flex justify-between gap-3">
          <dt class="text-muted">{{ $t('sc03.duration') }}</dt>
          <dd>{{ $t('common.minutesFull', { n: service.durationMinutes }) }}</dd>
        </div>
        <div v-if="intervalLabel" class="flex justify-between gap-3">
          <dt class="text-muted flex-none">{{ $t('sc03.interval') }}</dt>
          <dd class="text-right">{{ intervalLabel }}</dd>
        </div>
      </dl>
    </section>

    <!-- Gioi thieu -->
    <section
      v-if="i18n(service.shortDescription) || i18n(service.description)"
      class="flex flex-col gap-1.5"
    >
      <h5>{{ $t('sc03.about') }}</h5>
      <p class="text-[13.5px] leading-[1.5]">{{ i18n(service.shortDescription) }}</p>
      <p
        v-if="i18n(service.description)"
        class="text-muted whitespace-pre-line text-[12.5px] leading-[1.5]"
      >
        {{ i18n(service.description) }}
      </p>
    </section>

    <!-- Hang muc kiem tra -->
    <section v-if="service.checklistItems.length" class="flex flex-col gap-2">
      <h5>{{ $t('sc03.checklist') }}</h5>
      <ul class="flex flex-col gap-1.5">
        <li
          v-for="(item, index) in service.checklistItems"
          :key="index"
          class="flex items-start gap-2.5 px-3.5 py-2.5 text-[13px] leading-[1.4]"
          style="background: var(--color-neutral-100); border-radius: 16px"
        >
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="var(--color-accent-2-600)" stroke-width="3" stroke-linecap="round"
            stroke-linejoin="round" class="mt-0.5 flex-none" aria-hidden="true"
          >
            <path d="m5 12.5 4.5 4.5L19 7" />
          </svg>
          {{ i18n(item) }}
        </li>
      </ul>
    </section>

    <button
      type="button"
      class="btn btn-primary btn-block"
      style="min-height: 48px; font-size: 15px; margin: 0"
      @click="bookThis"
    >
      {{ $t('sc03.bookThis') }}
    </button>

    <NuxtLink to="/services" class="btn btn-ghost self-start px-1 text-[13px]">
      {{ $t('common.back') }}
    </NuxtLink>
  </div>
</template>
