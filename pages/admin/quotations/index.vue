<script setup lang="ts">
import type { Page, Quotation } from '~/types/models';
import { QuotationStatus } from '~/types/enums';

/** SA-13 Danh sach bao gia — FR-QUO-10, FR-QUO-12. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const route = useRoute();
const { t } = useI18n();
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

const COLUMNS = computed(() => [
  { key: 'code', label: t('sa13.colCode'), width: '170px' },
  { key: 'createdAt', label: t('sa13.colDate'), width: '150px' },
  { key: 'customer', label: t('sa03.colCustomer') },
  { key: 'vehicle', label: t('sa03.colVehicle') },
  { key: 'version', label: t('sa13.colVersion'), align: 'center' as const, width: '70px' },
  { key: 'status', label: t('sa02.colStatus'), width: '150px' },
  { key: 'totalAmount', label: t('sa09.colTotal'), align: 'right' as const, width: '120px' },
]);

setScreenTitle(() => t('sa13.title'));
useHead({ title: () => `${t('sa13.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-[15px]">
    <AdminStoreBar />

    <AyPageHeader code="SA-13" :title="$t('sa13.listTitle')" />

    <AyFilterBar :has-active-filters="Boolean(filters.keyword || filters.status)" @reset="reset">
      <AyField :label="$t('common.keyword')" class="min-w-[200px] flex-1">
        <template #default="{ id }">
          <input :id="id" v-model="filters.keyword" class="input" type="search" :placeholder="$t('sa13.searchPlaceholder')">
        </template>
      </AyField>
      <AyField :label="$t('sa02.colStatus')">
        <template #default="{ id }">
          <select :id="id" v-model="filters.status" class="input">
            <option value="">{{ $t('common.all') }}</option>
            <option v-for="s in Object.values(QuotationStatus)" :key="s" :value="s">
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
      :empty-title="$t('sa13.empty')"
      :empty-hint="$t('sa13.emptyHint')"
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
