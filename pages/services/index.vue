<script setup lang="ts">
import type { ServiceItem } from '~/types/models';
import { ServiceType } from '~/types/enums';

/**
 * SC-02 Danh sach dich vu (khach) va SC-02a (thanh vien).
 * Ban thiet ke: o tim kiem, hang the loc, roi cac nhom dich vu — moi nhom mot
 * dong tieu de chu nho viet hoa va cac dong dang vien thuoc.
 */
const api = useApi();
const { i18n, money } = useFormat();

const { data: services } = await useAsyncData('services', () => api.get<ServiceItem[]>('/services'));

const keyword = ref('');
const filter = ref<'ALL' | ServiceType>('ALL');

const TABS = [
  { value: 'ALL' as const, label: 'Tất cả' },
  { value: ServiceType.MAINTENANCE, label: 'Bảo dưỡng' },
  { value: ServiceType.REPAIR, label: 'Sửa chữa' },
  { value: ServiceType.INSPECTION, label: 'Kiểm tra' },
];

/** Tieu de nhom lay theo loai dich vu, dung song ngu nhu ban thiet ke. */
const GROUP_LABELS: Record<string, string> = {
  [ServiceType.MAINTENANCE]: 'Bảo dưỡng · Maintenance',
  [ServiceType.REPAIR]: 'Sửa chữa · Repair',
  [ServiceType.INSPECTION]: 'Kiểm tra · Inspection',
  [ServiceType.PACKAGE]: 'Gói dịch vụ · Packages',
};

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
  Object.keys(GROUP_LABELS)
    .map((type) => ({
      type,
      label: GROUP_LABELS[type],
      items: visible.value.filter((service) => service.type === type),
    }))
    .filter((group) => group.items.length > 0),
);

function subtitle(service: ServiceItem): string {
  const en = service.name.en ?? '';
  const duration = service.quoteOnly ? 'khảo sát tại cửa hàng' : `${service.durationMinutes} mins`;
  return [en, duration].filter(Boolean).join(' · ');
}

function priceLabel(service: ServiceItem): string {
  return service.quoteOnly ? 'báo giá' : `~ ${money(service.basePrice)}`;
}

useHead({ title: 'Dịch vụ — AOYAMA Service' });
</script>

<template>
  <div class="flex flex-col gap-3.5 pb-4">
    <div class="flex flex-col gap-2.5">
      <input
        v-model="keyword"
        class="input"
        type="search"
        placeholder="Tìm dịch vụ… · Search services"
        aria-label="Tìm dịch vụ"
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

      <NuxtLink
        v-for="service in group.items"
        :key="service.id"
        :to="`/services/${service.slug}`"
        class="ay-row"
      >
        <AyServiceIcon :icon-key="service.iconKey" />
        <span class="min-w-0 flex-1">
          <span class="block text-[14px] font-semibold">{{ i18n(service.name) }}</span>
          <span class="text-muted block truncate text-[11.5px]">{{ subtitle(service) }}</span>
        </span>
        <span class="whitespace-nowrap font-heading text-[13.5px]">{{ priceLabel(service) }}</span>
      </NuxtLink>
    </section>

    <AyEmptyState
      v-if="groups.length === 0"
      title="Không tìm thấy dịch vụ nào"
      hint="Hãy thử từ khóa khác hoặc bỏ bớt bộ lọc."
    >
      <AyButton to="/contact" variant="secondary" size="sm">Liên hệ cửa hàng</AyButton>
    </AyEmptyState>

    <NuxtLink to="/" class="btn btn-ghost self-start px-1 text-[13px]">← Quay lại</NuxtLink>
  </div>
</template>
