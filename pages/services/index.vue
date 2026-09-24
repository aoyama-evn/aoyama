<script setup lang="ts">
import type { ServiceItem } from '~/types/models';
import { ServiceType } from '~/types/enums';

/** SC-02 Danh sach dich vu. */
const api = useApi();
const { i18n } = useFormat();

const { data: services } = await useAsyncData('services', () =>
  api.get<ServiceItem[]>('/services'),
);

const filter = ref<'ALL' | ServiceType>('ALL');

const visible = computed(() =>
  (services.value ?? []).filter((s) => filter.value === 'ALL' || s.type === filter.value),
);

const TABS = [
  { value: 'ALL' as const, label: 'Tất cả' },
  { value: ServiceType.MAINTENANCE, label: 'Bảo dưỡng' },
  { value: ServiceType.REPAIR, label: 'Sửa chữa' },
];

useHead({ title: 'Dịch vụ — AOYAMA Service' });
</script>

<template>
  <div class="flex flex-col gap-5">
    <AyPageHeader
      code="SC-02"
      title="Dịch vụ"
      description="Chọn dịch vụ để xem chi tiết hạng mục kiểm tra, thời gian và giá tham khảo."
    />

    <div class="flex gap-2" role="tablist">
      <button
        v-for="tab in TABS" :key="tab.value" type="button" role="tab"
        :aria-selected="filter === tab.value"
        class="btn text-[12.5px]"
        :class="filter === tab.value ? 'btn-primary' : 'btn-secondary'"
        @click="filter = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="grid gap-2.5 md:grid-cols-2">
      <AyServiceCard
        v-for="service in visible" :key="service.id"
        :service="service" :to="`/services/${service.slug}`"
      />
    </div>

    <AyEmptyState
      v-if="visible.length === 0"
      title="Chưa có dịch vụ nào trong nhóm này"
      hint="Hãy chọn nhóm khác hoặc liên hệ cửa hàng để được tư vấn."
    >
      <AyButton to="/contact" variant="secondary" size="sm">Liên hệ cửa hàng</AyButton>
    </AyEmptyState>
  </div>
</template>
