<script setup lang="ts">
import type { ServiceItem } from '~/types/models';
import { ServiceType } from '~/types/enums';

/**
 * SC-02 Danh sach dich vu (khach) va SC-02a (thanh vien).
 * Ban thiet ke: o tim kiem, hang the loc, roi cac nhom dich vu — moi nhom mot
 * dong tieu de chu nho viet hoa va cac dong dang vien thuoc.
 */
const api = useApi();
const route = useRoute();
const booking = useBookingStore();
const { t } = useI18n();
const { i18n, money } = useFormat();

/**
 * SC-12 cho "+ Them hang muc khac" quay ve day, nen man hinh co them che do
 * chon: moi dong thanh mot o danh dau va co thanh xac nhan o duoi.
 */
const picking = computed(() => route.query.pick === '1');

onMounted(() => {
  if (picking.value) booking.restore();
});

const { data: services } = await useAsyncData('services', () => api.get<ServiceItem[]>('/services'));

const keyword = ref('');
const filter = ref<'ALL' | ServiceType>('ALL');

const TABS = computed(() => [
  { value: 'ALL' as const, label: t('sc02.tabAll') },
  { value: ServiceType.MAINTENANCE, label: t('sc02.tabMaintenance') },
  { value: ServiceType.REPAIR, label: t('sc02.tabRepair') },
  { value: ServiceType.INSPECTION, label: t('sc02.tabInspection') },
]);

/** Tieu de nhom lay theo loai dich vu. */
const GROUP_LABELS = computed<Record<string, string>>(() => ({
  [ServiceType.MAINTENANCE]: t('sc02.groupMaintenance'),
  [ServiceType.REPAIR]: t('sc02.groupRepair'),
  [ServiceType.INSPECTION]: t('sc02.groupInspection'),
  [ServiceType.PACKAGE]: t('sc02.groupPackage'),
}));

const visible = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return (services.value ?? []).filter((service) => {
    if (filter.value !== 'ALL' && service.type !== filter.value) return false;
    if (!kw) return true;
    return Object.values(service.name).some((text) => (text ?? '').toLowerCase().includes(kw));
  });
});

/** Gom theo loai, giu dung thu tu cua GROUP_LABELS. */
const groups = computed(() =>
  Object.keys(GROUP_LABELS.value)
    .map((type) => ({
      type,
      label: GROUP_LABELS.value[type],
      items: visible.value.filter((service) => service.type === type),
    }))
    .filter((group) => group.items.length > 0),
);

function subtitle(service: ServiceItem): string {
  const en = service.name.en ?? '';
  const duration = service.quoteOnly
    ? t('sc02.quoteAtStore')
    : t('common.minutes', { n: service.durationMinutes });
  return [en, duration].filter(Boolean).join(' · ');
}

function priceLabel(service: ServiceItem): string {
  return service.quoteOnly ? t('common.quoteOnly') : `~ ${money(service.basePrice)}`;
}

useHead({ title: () => `${t('nav.services')} — AOYAMA Service` });
</script>

<template>
  <div class="flex flex-col gap-3.5 pb-4">
    <div class="flex flex-col gap-2.5">
      <input
        v-model="keyword"
        class="input"
        type="search"
        :placeholder="$t('sc02.searchPlaceholder')"
        :aria-label="$t('sc02.searchLabel')"
      />
      <div class="flex flex-wrap gap-[7px]" role="tablist">
        <button
          v-for="tab in TABS"
          :key="tab.value"
          type="button"
          role="tab"
          :aria-selected="filter === tab.value"
          class="btn px-3.5 text-[12px]"
          :class="filter === tab.value ? 'btn-primary' : 'btn-secondary'"
          style="min-height: 38px"
          @click="filter = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <section v-for="group in groups" :key="group.type" class="flex flex-col gap-2.5">
      <p
        class="text-[10px] uppercase"
        style="letter-spacing: 0.09em; color: var(--color-neutral-600)"
      >
        {{ group.label }}
      </p>

      <template v-for="service in group.items" :key="service.id">
        <label
          v-if="picking"
          class="ay-row cursor-pointer"
          :style="
            booking.selectedServiceIds.includes(service.id)
              ? 'background: var(--color-accent-200)'
              : undefined
          "
        >
          <input
            type="checkbox"
            class="h-4 w-4 flex-none"
            style="accent-color: var(--color-accent)"
            :checked="booking.selectedServiceIds.includes(service.id)"
            @change="booking.toggleService(service)"
          />
          <span class="min-w-0 flex-1">
            <span class="block text-[14px] font-semibold">{{ i18n(service.name) }}</span>
            <span class="text-muted block truncate text-[11.5px]">{{ subtitle(service) }}</span>
          </span>
          <span class="whitespace-nowrap font-heading text-[13.5px]">{{ priceLabel(service) }}</span>
        </label>

        <NuxtLink v-else :to="`/services/${service.slug}`" class="ay-row">
          <AyServiceIcon :icon-key="service.iconKey" />
          <span class="min-w-0 flex-1">
            <span class="block text-[14px] font-semibold">{{ i18n(service.name) }}</span>
            <span class="text-muted block truncate text-[11.5px]">{{ subtitle(service) }}</span>
          </span>
          <span class="whitespace-nowrap font-heading text-[13.5px]">{{ priceLabel(service) }}</span>
        </NuxtLink>
      </template>
    </section>

    <AyEmptyState
      v-if="groups.length === 0"
      :title="$t('sc02.emptyTitle')"
      :hint="$t('sc02.emptyHint')"
    >
      <AyButton to="/contact" variant="secondary" size="sm">{{ $t('sc02.contactStore') }}</AyButton>
    </AyEmptyState>

    <NuxtLink
      v-if="picking"
      to="/booking/step1"
      class="btn btn-primary btn-block"
      style="min-height: 48px; font-size: 15px; margin: 0"
    >
      {{ $t('sc02.pickDone', { n: booking.selectedServiceIds.length }) }}
    </NuxtLink>

    <NuxtLink
      :to="picking ? '/booking/step1' : '/'"
      class="btn btn-ghost self-start px-1 text-[13px]"
    >
      {{ $t('common.back') }}
    </NuxtLink>
  </div>
</template>
