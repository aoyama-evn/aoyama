<script setup lang="ts">
import type { CustomerProfile, Page } from '~/types/models';

/** SA-15 Danh sach khach hang — FR-CUS-01, FR-CUS-02. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const { date, maskedPhone } = useFormat();

const keyword = ref('');
const page = ref(1);

const query = computed(() => ({ page: page.value, limit: 20, keyword: keyword.value || undefined }));
const { data, pending } = await useAsyncData(
  'admin-customers',
  () => api.get<Page<CustomerProfile>>('/admin/customers', query.value),
  { watch: [query] },
);

const COLUMNS = [
  { key: 'name', label: 'Tên khách hàng' },
  { key: 'phone', label: 'Điện thoại', width: '160px' },
  { key: 'email', label: 'Email' },
  { key: 'isGuest', label: 'Loại', width: '120px' },
  { key: 'createdAt', label: 'Ngày tạo', width: '130px' },
];

useHead({ title: 'Khách hàng — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader code="SA-15" title="Khách hàng">
      <template #actions>
        <AyButton to="/admin/customers/merge" variant="secondary" size="sm">Gộp hồ sơ trùng</AyButton>
        <AyButton to="/admin/customers/new/edit" size="sm">Thêm khách hàng</AyButton>
      </template>
    </AyPageHeader>

    <AyFilterBar :has-active-filters="Boolean(keyword)" @reset="keyword = ''">
      <AyField label="Tìm kiếm" class="min-w-[240px] flex-1">
        <template #default="{ id }">
          <input :id="id" v-model="keyword" class="ay-input" type="search" placeholder="Tên, số điện thoại hoặc email">
        </template>
      </AyField>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      empty-title="Không tìm thấy khách hàng nào"
      @update:page="page = $event"
      @row-click="navigateTo(`/admin/customers/${$event.id}`)"
    >
      <template #cell-name="{ row }">
        <span class="font-semibold">{{ row.name }}</span>
      </template>
      <template #cell-phone="{ row }">{{ row.phone }}</template>
      <template #cell-email="{ row }">{{ row.email ?? '—' }}</template>
      <template #cell-isGuest="{ row }">
        <span class="ay-tag" :class="row.isGuest ? 'bg-neutral-200 text-neutral-700' : 'bg-success-bg text-success'">
          {{ row.isGuest ? 'Khách vãng lai' : 'Đã đăng ký' }}
        </span>
      </template>
      <template #cell-createdAt="{ row }">{{ date(row.createdAt as string) }}</template>
    </AyDataTable>
  </div>
</template>
