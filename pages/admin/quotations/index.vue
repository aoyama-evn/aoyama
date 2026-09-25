<script setup lang="ts">
import type { Page, Quotation } from '~/types/models';
import { QuotationStatus } from '~/types/enums';

/** SA-13 Danh sach bao gia — FR-QUO-10, FR-QUO-12. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const route = useRoute();
const { money, dateTime } = useFormat();

const filters = reactive({ keyword: '', status: (route.query.status as string) ?? '' });
const page = ref(1);

const query = computed(() => ({
  page: page.value,
  limit: 20,
  storeId: ui.activeStoreId ?? undefined,
  keyword: filters.keyword || undefined,
  status: filters.status || undefined,
}));

const { data, pending } = await useAsyncData(
  'admin-quotations',
  () => api.get<Page<Quotation>>('/admin/quotations', query.value),
  { watch: [query] },
);

function reset(): void {
  filters.keyword = '';
  filters.status = '';
  page.value = 1;
}

const COLUMNS = [
  { key: 'code', label: 'Mã báo giá', width: '170px' },
  { key: 'createdAt', label: 'Ngày lập', width: '150px' },
  { key: 'customer', label: 'Khách hàng' },
  { key: 'vehicle', label: 'Xe' },
  { key: 'version', label: 'Bản', align: 'center' as const, width: '70px' },
  { key: 'status', label: 'Trạng thái', width: '150px' },
  { key: 'totalAmount', label: 'Tổng tiền', align: 'right' as const, width: '120px' },
];

useHead({ title: 'Báo giá — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-[15px]">
    <AdminStoreBar />

    <AyPageHeader code="SA-13" title="Danh sách báo giá" />

    <AyFilterBar :has-active-filters="Boolean(filters.keyword || filters.status)" @reset="reset">
      <AyField label="Từ khóa" class="min-w-[200px] flex-1">
        <template #default="{ id }">
          <input :id="id" v-model="filters.keyword" class="input" type="search" placeholder="Mã, tên khách, biển số">
        </template>
      </AyField>
      <AyField label="Trạng thái">
        <template #default="{ id }">
          <select :id="id" v-model="filters.status" class="input">
            <option value="">Tất cả</option>
            <option v-for="s in Object.values(QuotationStatus)" :key="s" :value="s">{{ s }}</option>
          </select>
        </template>
      </AyField>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      empty-title="Chưa có báo giá nào"
      empty-hint="Báo giá được lập từ màn hình phiếu dịch vụ."
      @update:page="page = $event"
      @row-click="navigateTo(`/admin/quotations/${$event.id}`)"
    >
      <template #cell-code="{ row }">
        <span class="font-mono text-[12.5px]">{{ row.code }}</span>
      </template>
      <template #cell-createdAt="{ row }">{{ dateTime(row.createdAt as string) }}</template>
      <template #cell-customer="{ row }">
        {{ (row.customer as Quotation['customer'])?.name ?? '—' }}
      </template>
      <template #cell-vehicle="{ row }">
        {{ (row.workOrder as Quotation['workOrder'])?.vehicle?.plateNumber ?? '—' }}
      </template>
      <template #cell-status="{ row }"><AyStatusTag :status="row.status as string" /></template>
      <template #cell-totalAmount="{ row }">{{ money(row.totalAmount as number) }}</template>
    </AyDataTable>
  </div>
</template>
