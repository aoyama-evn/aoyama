<script setup lang="ts">
import type { CustomerProfile, Page } from '~/types/models';

/** SA-15 Danh sach khach hang — FR-CUS-01, FR-CUS-02. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const { t } = useI18n();
const { date, maskedPhone } = useFormat();

const keyword = ref('');
const page = ref(1);

const query = computed(() => ({ page: page.value, limit: 20, keyword: keyword.value || undefined }));
const { data, pending } = await useAsyncData(
  'admin-customers',
  () => api.get<Page<CustomerProfile>>('/admin/customers', query.value),
  { watch: [query] },
);

const COLUMNS = computed(() => [
  { key: 'name', label: t('sa15.colName') },
  { key: 'phone', label: t('sa15.colPhone'), width: '160px' },
  { key: 'email', label: t('sc14.email') },
  { key: 'isGuest', label: t('sa15.colKind'), width: '120px' },
  { key: 'createdAt', label: t('sa15.colCreated'), width: '130px' },
]);

setScreenTitle(() => t('sa15.title'));
useHead({ title: () => `${t('sa15.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader code="SA-15" :title="$t('sa15.title')">
      <template #actions>
        <AyButton to="/admin/customers/merge" variant="secondary" size="sm">{{ $t('sa15.mergeCta') }}</AyButton>
        <AyButton to="/admin/customers/new/edit" size="sm">{{ $t('sa15.addCta') }}</AyButton>
      </template>
    </AyPageHeader>

    <AyFilterBar :has-active-filters="Boolean(keyword)" @reset="keyword = ''">
      <AyField :label="$t('common.search')" class="min-w-[240px] flex-1">
        <template #default="{ id }">
          <input :id="id" v-model="keyword" class="input" type="search" :placeholder="$t('sa15.searchPlaceholder')">
        </template>
      </AyField>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      :empty-title="$t('sa15.empty')"
      @update:page="page = $event"
      @row-click="navigateTo(`/admin/customers/${$event.id}`)"
    >
      <template #cell-name="{ row }">
        <span class="font-semibold">{{ row.name }}</span>
      </template>
      <template #cell-phone="{ row }">{{ row.phone }}</template>
      <template #cell-email="{ row }">{{ row.email ?? '—' }}</template>
      <template #cell-isGuest="{ row }">
        <span class="tag" :class="row.isGuest ? 'bg-neutral-200 text-neutral-700' : 'bg-success-bg text-success'">
          {{ row.isGuest ? $t('sa15.guest') : $t('sa15.registered') }}
        </span>
      </template>
      <template #cell-createdAt="{ row }">{{ date(row.createdAt as string) }}</template>
    </AyDataTable>
  </div>
</template>
