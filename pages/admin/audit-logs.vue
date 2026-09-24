<script setup lang="ts">
import type { AuditLog, Page } from '~/types/models';

/** SA-44 Nhat ky thao tac — FR-SYS-03..06. */
definePageMeta({ layout: 'admin', middleware: ['admin', 'admin-only'] });

const api = useApi();
const { dateTime } = useFormat();

const filters = reactive({ entity: '', action: '', from: '', to: '' });
const page = ref(1);

const query = computed(() => ({
  page: page.value,
  limit: 30,
  entity: filters.entity || undefined,
  action: filters.action || undefined,
  from: filters.from || undefined,
  to: filters.to || undefined,
}));

const { data, pending } = await useAsyncData(
  'admin-audit',
  () => api.get<Page<AuditLog>>('/admin/system/audit-logs', query.value),
  { watch: [query] },
);

const detail = ref<AuditLog | null>(null);

const ENTITIES = [
  'Booking',
  'WorkOrder',
  'Quotation',
  'Payment',
  'Customer',
  'Vehicle',
  'Service',
  'Part',
  'Store',
  'AdminUser',
  'SystemSetting',
];

function reset(): void {
  Object.assign(filters, { entity: '', action: '', from: '', to: '' });
  page.value = 1;
}

const COLUMNS = [
  { key: 'createdAt', label: 'Thời điểm', width: '150px' },
  { key: 'actorName', label: 'Người thực hiện', width: '170px' },
  { key: 'action', label: 'Hành động', width: '180px' },
  { key: 'entity', label: 'Đối tượng', width: '150px' },
  { key: 'changes', label: 'Thay đổi' },
  { key: 'ipAddress', label: 'IP', width: '130px' },
];

useHead({ title: 'Nhật ký thao tác — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader
      code="SA-44" title="Nhật ký thao tác"
      description="Bản ghi chỉ ghi thêm, không sửa và không xóa được từ giao diện."
    />

    <AyFilterBar
      :has-active-filters="Boolean(filters.entity || filters.action || filters.from)"
      @reset="reset"
    >
      <AyField label="Đối tượng">
        <template #default="{ id }">
          <select :id="id" v-model="filters.entity" class="ay-input">
            <option value="">Tất cả</option>
            <option v-for="entity in ENTITIES" :key="entity" :value="entity">{{ entity }}</option>
          </select>
        </template>
      </AyField>
      <AyField label="Hành động">
        <template #default="{ id }">
          <input :id="id" v-model="filters.action" class="ay-input" type="search" placeholder="CREATE, UPDATE, CONFIRM…">
        </template>
      </AyField>
      <AyField label="Từ ngày">
        <template #default="{ id }">
          <input :id="id" v-model="filters.from" class="ay-input" type="date">
        </template>
      </AyField>
      <AyField label="Đến ngày">
        <template #default="{ id }">
          <input :id="id" v-model="filters.to" class="ay-input" type="date">
        </template>
      </AyField>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      empty-title="Chưa có thao tác nào được ghi nhận"
      @update:page="page = $event"
      @row-click="detail = $event as unknown as AuditLog"
    >
      <template #cell-createdAt="{ row }">{{ dateTime(row.createdAt as string) }}</template>
      <template #cell-actorName="{ row }">
        {{ row.actorName ?? '—' }}
        <span class="block text-[11.5px] ay-muted">{{ row.actorType }}</span>
      </template>
      <template #cell-action="{ row }">
        <span class="font-mono text-[12.5px]">{{ row.action }}</span>
      </template>
      <template #cell-entity="{ row }">{{ row.entity }}</template>
      <template #cell-changes="{ row }">
        <span class="line-clamp-1 font-mono text-[11.5px] ay-muted">
          {{ row.changes ? JSON.stringify(row.changes) : '—' }}
        </span>
      </template>
      <template #cell-ipAddress="{ row }">
        <span class="font-mono text-[11.5px]">{{ row.ipAddress ?? '—' }}</span>
      </template>
    </AyDataTable>

    <AyConfirmDialog
      :open="Boolean(detail)"
      title="Chi tiết thao tác"
      confirm-label="Đóng"
      cancel-label="Đóng"
      @confirm="detail = null"
      @cancel="detail = null"
    >
      <dl v-if="detail" class="mt-3 flex flex-col gap-2 text-left text-[13.5px]">
        <div class="flex justify-between">
          <dt class="ay-muted">Thời điểm</dt><dd>{{ dateTime(detail.createdAt) }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="ay-muted">Người thực hiện</dt><dd>{{ detail.actorName ?? detail.actorType }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="ay-muted">Hành động</dt><dd class="font-mono">{{ detail.action }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="ay-muted">Đối tượng</dt><dd>{{ detail.entity }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="ay-muted">Mã đối tượng</dt>
          <dd class="font-mono text-[11.5px]">{{ detail.entityId ?? '—' }}</dd>
        </div>
        <div v-if="detail.changes">
          <dt class="ay-muted">Thay đổi</dt>
          <dd>
            <pre class="overflow-x-auto rounded-xl bg-neutral-100 p-2 font-mono text-[11.5px]">{{ JSON.stringify(detail.changes, null, 2) }}</pre>
          </dd>
        </div>
      </dl>
    </AyConfirmDialog>
  </div>
</template>
