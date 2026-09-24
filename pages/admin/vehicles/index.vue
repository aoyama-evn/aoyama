<script setup lang="ts">
import type { Page, Vehicle } from '~/types/models';

/** SA-19 Danh sach phuong tien — FR-VEH-08, FR-VEH-09. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const { number } = useFormat();

const keyword = ref('');
const page = ref(1);

const query = computed(() => ({ page: page.value, limit: 20, keyword: keyword.value || undefined }));
const { data, pending } = await useAsyncData(
  'admin-vehicles',
  () => api.get<Page<Vehicle>>('/admin/vehicles', query.value),
  { watch: [query] },
);

const COLUMNS = [
  { key: 'plateNumber', label: 'Biển số', width: '160px' },
  { key: 'maker', label: 'Hãng / dòng' },
  { key: 'engineCc', label: 'Dung tích', align: 'center' as const, width: '110px' },
  { key: 'currentOdometer', label: 'Số km', align: 'right' as const, width: '120px' },
  { key: 'customer', label: 'Chủ xe' },
];

useHead({ title: 'Phương tiện — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader code="SA-19" title="Phương tiện">
      <template #actions>
        <AyButton to="/admin/vehicles/new/edit" size="sm">Thêm xe</AyButton>
      </template>
    </AyPageHeader>

    <AyFilterBar :has-active-filters="Boolean(keyword)" @reset="keyword = ''">
      <AyField label="Tìm kiếm" class="min-w-[240px] flex-1">
        <template #default="{ id }">
          <input :id="id" v-model="keyword" class="ay-input" type="search" placeholder="Biển số, hãng, dòng xe, tên hoặc SĐT chủ xe">
        </template>
      </AyField>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      empty-title="Không tìm thấy phương tiện nào"
      @update:page="page = $event"
      @row-click="navigateTo(`/admin/vehicles/${$event.id}`)"
    >
      <template #cell-plateNumber="{ row }">
        <span class="font-heading">{{ row.plateNumber }}</span>
      </template>
      <template #cell-maker="{ row }">{{ row.maker }} {{ row.model }}</template>
      <template #cell-engineCc="{ row }">{{ row.engineCc ? `${row.engineCc}cc` : '—' }}</template>
      <template #cell-currentOdometer="{ row }">{{ number(row.currentOdometer as number) }}</template>
      <template #cell-customer="{ row }">
        {{ (row.customer as Vehicle['customer'])?.name ?? '—' }}
      </template>
    </AyDataTable>
  </div>
</template>
