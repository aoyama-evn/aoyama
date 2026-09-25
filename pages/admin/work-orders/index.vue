<script setup lang="ts">
import type { Page, WorkOrder } from '~/types/models';
import { PaymentStatus, WorkOrderStatus } from '~/types/enums';

/** SA-09 Danh sach phieu dich vu — FR-WO-07, FR-PAY-07. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const route = useRoute();
const { t } = useI18n();
const { money, dateTime } = useFormat();

const filters = reactive({
  keyword: '',
  status: (route.query.status as string) ?? '',
  paymentStatus: (route.query.paymentStatus as string) ?? '',
});
const page = ref(1);

const query = computed(() => ({
  page: page.value,
  limit: 20,
  storeId: ui.activeStoreId ?? undefined,
  keyword: filters.keyword || undefined,
  status: filters.status || undefined,
  paymentStatus: filters.paymentStatus || undefined,
}));

const { data, pending } = await useAsyncData(
  'admin-work-orders',
  () => api.get<Page<WorkOrder>>('/admin/work-orders', query.value),
  { watch: [query] },
);

const hasFilters = computed(() => Boolean(filters.keyword || filters.status || filters.paymentStatus));

function reset(): void {
  filters.keyword = '';
  filters.status = '';
  filters.paymentStatus = '';
  page.value = 1;
}

const COLUMNS = computed(() => [
  { key: 'code', label: t('sa09.colCode'), width: '160px' },
  { key: 'createdAt', label: t('sa09.colIntake'), width: '150px' },
  { key: 'customer', label: t('sa03.colCustomer') },
  { key: 'vehicle', label: t('sa03.colVehicle') },
  { key: 'status', label: t('sa02.colStatus'), width: '150px' },
  { key: 'paymentStatus', label: t('sa09.colPayment'), width: '160px' },
  { key: 'totalAmount', label: t('sa09.colTotal'), align: 'right' as const, width: '120px' },
]);

setScreenTitle(() => t('sa09.title'));
useHead({ title: () => `${t('sa09.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-[15px]">
    <AdminStoreBar />

    <AyPageHeader code="SA-09" :title="$t('sa09.title')">
      <template #actions>
        <AyButton to="/admin/scan" variant="secondary" size="sm">{{ $t('sa09.scanCta') }}</AyButton>
      </template>
    </AyPageHeader>

    <AyFilterBar :has-active-filters="hasFilters" @reset="reset">
      <AyField :label="$t('common.keyword')" class="min-w-[200px] flex-1">
        <template #default="{ id }">
          <input :id="id" v-model="filters.keyword" class="input" type="search" placeholder="Mã phiếu, tên khách, biển số">
        </template>
      </AyField>
      <AyField :label="$t('sa02.colStatus')">
        <template #default="{ id }">
          <select :id="id" v-model="filters.status" class="input">
            <option value="">{{ $t('common.all') }}</option>
            <option v-for="s in Object.values(WorkOrderStatus)" :key="s" :value="s">
              {{ $t(`status.${s}`) }}
            </option>
          </select>
        </template>
      </AyField>
      <AyField :label="$t('sa09.colPayment')">
        <template #default="{ id }">
          <select :id="id" v-model="filters.paymentStatus" class="input">
            <option value="">{{ $t('common.all') }}</option>
            <option v-for="s in Object.values(PaymentStatus)" :key="s" :value="s">
              {{ $t(`status.${s}`) }}
            </option>
          </select>
        </template>
      </AyField>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      :empty-title="$t('sa09.empty')"
      @update:page="page = $event"
      @row-click="navigateTo(`/admin/work-orders/${$event.id}`)"
    >
      <template #cell-code="{ row }">
        <span class="font-mono text-[12.5px]">{{ row.code }}</span>
      </template>
      <template #cell-createdAt="{ row }">{{ dateTime(row.createdAt as string) }}</template>
      <template #cell-customer="{ row }">
        {{ (row.customer as WorkOrder['customer'])?.name ?? '—' }}
      </template>
      <template #cell-vehicle="{ row }">
        {{ (row.vehicle as WorkOrder['vehicle'])?.plateNumber ?? '—' }}
      </template>
      <template #cell-status="{ row }"><AyStatusTag :status="row.status as string" /></template>
      <template #cell-paymentStatus="{ row }"><AyStatusTag :status="row.paymentStatus as string" /></template>
      <template #cell-totalAmount="{ row }">{{ money(row.totalAmount as number) }}</template>
    </AyDataTable>
  </div>
</template>
