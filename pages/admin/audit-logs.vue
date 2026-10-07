<script setup lang="ts">
import type { AuditLog, Page } from '~/types/models';

/** SA-44 Nhat ky thao tac — FR-SYS-03..06. */
definePageMeta({ layout: 'admin', middleware: ['admin', 'admin-only'] });

const api = useApi();
const { t } = useI18n();
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

const COLUMNS = computed(() => [
  { key: 'createdAt', label: t('sa29.colWhen'), width: '150px' },
  { key: 'actorName', label: t('sa44.colActor'), width: '170px' },
  { key: 'action', label: t('sa44.action'), width: '180px' },
  { key: 'entity', label: t('sa44.entity'), width: '150px' },
  { key: 'changes', label: t('sa44.colChanges') },
  { key: 'ipAddress', label: 'IP', width: '130px' },
]);

setScreenTitle(() => t('sa44.title'));
useHead({ title: () => `${t('sa44.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader
      code="SA-44" :title="$t('sa44.title')"
      :description="$t('sa44.lead')"
    />

    <AyFilterBar
      :has-active-filters="Boolean(filters.entity || filters.action || filters.from)"
      @reset="reset"
    >
      <AyField :label="$t('sa44.entity')">
        <template #default="{ id }">
          <select :id="id" v-model="filters.entity" class="input">
            <option value="">{{ $t('common.all') }}</option>
            <option v-for="entity in ENTITIES" :key="entity" :value="entity">{{ entity }}</option>
          </select>
        </template>
      </AyField>
      <AyField :label="$t('sa44.action')">
        <template #default="{ id }">
          <input :id="id" v-model="filters.action" class="input" type="search" :placeholder="$t('sa44.actionPlaceholder')">
        </template>
      </AyField>
      <AyField :label="$t('sa03.fromDate')">
        <template #default="{ id }">
          <AyDateField :id="id" v-model="filters.from" />
        </template>
      </AyField>
      <AyField :label="$t('sa03.toDate')">
        <template #default="{ id }">
          <AyDateField :id="id" v-model="filters.to" />
        </template>
      </AyField>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      :empty-title="$t('sa44.empty')"
      @update:page="page = $event"
      @row-click="detail = $event as unknown as AuditLog"
    >
      <template #cell-createdAt="{ row }">{{ dateTime(row.createdAt as string) }}</template>
      <template #cell-actorName="{ row }">
        {{ row.actorName ?? '—' }}
        <span class="block text-[11.5px] text-muted">{{ row.actorType }}</span>
      </template>
      <template #cell-action="{ row }">
        <span class="font-mono text-[12.5px]">{{ row.action }}</span>
      </template>
      <template #cell-entity="{ row }">{{ row.entity }}</template>
      <template #cell-changes="{ row }">
        <span class="line-clamp-1 font-mono text-[11.5px] text-muted">
          {{ row.changes ? JSON.stringify(row.changes) : '—' }}
        </span>
      </template>
      <template #cell-ipAddress="{ row }">
        <span class="font-mono text-[11.5px]">{{ row.ipAddress ?? '—' }}</span>
      </template>
    </AyDataTable>

    <!-- Hop nay chi de xem, khong co gi de chon bo: mot nut Dong la du. -->
    <AyConfirmDialog
      :open="Boolean(detail)"
      :title="$t('sa44.detail')"
      :confirm-label="$t('common.close')"
      hide-cancel
      @confirm="detail = null"
      @cancel="detail = null"
    >
      <dl v-if="detail" class="mt-3 flex flex-col gap-2 text-left text-[13.5px]">
        <div class="flex justify-between">
          <dt class="text-muted">{{ $t('sa29.colWhen') }}</dt><dd>{{ dateTime(detail.createdAt) }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-muted">{{ $t('sa44.colActor') }}</dt><dd>{{ detail.actorName ?? detail.actorType }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-muted">{{ $t('sa44.action') }}</dt><dd class="font-mono">{{ detail.action }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-muted">{{ $t('sa44.entity') }}</dt><dd>{{ detail.entity }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-muted">{{ $t('sa44.entityId') }}</dt>
          <dd class="font-mono text-[11.5px]">{{ detail.entityId ?? '—' }}</dd>
        </div>
        <div v-if="detail.changes">
          <dt class="text-muted">{{ $t('sa44.colChanges') }}</dt>
          <dd>
            <pre class="overflow-x-auto rounded-xl bg-neutral-100 p-2 font-mono text-[11.5px]">{{ JSON.stringify(detail.changes, null, 2) }}</pre>
          </dd>
        </div>
      </dl>
    </AyConfirmDialog>
  </div>
</template>
