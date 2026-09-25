<script setup lang="ts">
import type { Page, Vehicle } from '~/types/models';

/** SA-19 Danh sach phuong tien — FR-VEH-08, FR-VEH-09. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const { t } = useI18n();
const { number } = useFormat();

const keyword = ref('');
const page = ref(1);

const query = computed(() => ({ page: page.value, limit: 20, keyword: keyword.value || undefined }));
const { data, pending } = await useAsyncData(
  'admin-vehicles',
  () => api.get<Page<Vehicle>>('/admin/vehicles', query.value),
  { watch: [query] },
);

const COLUMNS = computed(() => [
  { key: 'plateNumber', label: t('sa16.colPlate'), width: '160px' },
  { key: 'maker', label: t('sa19.colMakerModel') },
  { key: 'engineCc', label: t('sa19.colCc'), align: 'center' as const, width: '110px' },
  { key: 'currentOdometer', label: t('sa16.colOdometer'), align: 'right' as const, width: '120px' },
  { key: 'customer', label: t('sa19.colOwner') },
]);

setScreenTitle(() => t('sa19.title'));
useHead({ title: () => `${t('sa19.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader code="SA-19" :title="$t('sa19.title')">
      <template #actions>
        <AyButton to="/admin/vehicles/new/edit" size="sm">{{ $t('sa19.addCta') }}</AyButton>
      </template>
    </AyPageHeader>

    <AyFilterBar :has-active-filters="Boolean(keyword)" @reset="keyword = ''">
      <AyField :label="$t('common.search')" class="min-w-[240px] flex-1">
        <template #default="{ id }">
          <input :id="id" v-model="keyword" class="input" type="search" :placeholder="$t('sa19.searchPlaceholder')">
        </template>
      </AyField>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      :empty-title="$t('sa19.empty')"
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
