<script setup lang="ts">
import type { Page, ServiceItem } from '~/types/models';
import { ServiceType } from '~/types/enums';

/** SA-22 Danh sach dich vu — FR-SVC-01, FR-SVC-09, FR-SVC-10. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { i18n, money } = useFormat();

const filters = reactive({ keyword: '', type: '' });
const page = ref(1);

const query = computed(() => ({
  page: page.value,
  limit: 20,
  keyword: filters.keyword || undefined,
  type: filters.type || undefined,
}));

const { data, pending, refresh } = await useAsyncData(
  'admin-services',
  () => api.get<Page<ServiceItem>>('/admin/services', query.value),
  { watch: [query] },
);

const deactivateTarget = ref<ServiceItem | null>(null);

async function deactivate(): Promise<void> {
  if (!deactivateTarget.value) return;
  try {
    await api.del(`/admin/services/${deactivateTarget.value.id}`);
    ui.success(t('sa22.retired'), t('sa22.retiredSub'));
    deactivateTarget.value = null;
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

const COLUMNS = computed(() => [
  { key: 'code', label: t('sa03.colCode'), width: '170px' },
  { key: 'name', label: t('sa22.colName') },
  { key: 'type', label: t('sa22.colType'), width: '110px' },
  { key: 'durationMinutes', label: t('sa22.colDuration'), align: 'center' as const, width: '110px' },
  { key: 'basePrice', label: t('sa22.colBase'), align: 'right' as const, width: '130px' },
  { key: 'isActive', label: t('sa02.colStatus'), width: '120px' },
  { key: 'actions', label: '', width: '90px' },
]);

setScreenTitle(() => t('sa22.catalog'));
useHead({ title: () => `${t('sa22.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader code="SA-22" :title="$t('sa22.catalog')">
      <template #actions>
        <AyButton to="/admin/pricing" variant="secondary" size="sm">{{ $t('sa22.priceCta') }}</AyButton>
        <AyButton to="/admin/services/new/edit" size="sm">{{ $t('sa22.addCta') }}</AyButton>
      </template>
    </AyPageHeader>

    <AyFilterBar
      :has-active-filters="Boolean(filters.keyword || filters.type)"
      @reset="filters.keyword = ''; filters.type = ''"
    >
      <AyField :label="$t('common.keyword')" class="min-w-[220px] flex-1">
        <template #default="{ id }">
          <input :id="id" v-model="filters.keyword" class="input" type="search" :placeholder="$t('sa22.searchPlaceholder')">
        </template>
      </AyField>
      <AyField :label="$t('sa22.colType')">
        <template #default="{ id }">
          <select :id="id" v-model="filters.type" class="input">
            <option value="">{{ $t('common.all') }}</option>
            <option :value="ServiceType.MAINTENANCE">{{ $t('serviceType.MAINTENANCE') }}</option>
            <option :value="ServiceType.REPAIR">{{ $t('serviceType.REPAIR') }}</option>
          </select>
        </template>
      </AyField>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      :empty-title="$t('sa22.empty')"
      @update:page="page = $event"
    >
      <template #cell-code="{ row }">
        <span class="font-mono text-[12.5px]">{{ row.code }}</span>
      </template>
      <template #cell-name="{ row }">
        <NuxtLink :to="`/admin/services/${row.id}/edit`" class="font-semibold hover:underline">
          {{ i18n((row as unknown as ServiceItem).name) }}
        </NuxtLink>
      </template>
      <template #cell-type="{ row }">
        {{ $t(`serviceType.${row.type}`) }}
      </template>
      <template #cell-durationMinutes="{ row }">
        {{ $t('common.minutesFull', { n: row.durationMinutes }) }}
      </template>
      <template #cell-basePrice="{ row }">
        {{
          (row as unknown as ServiceItem).quoteOnly
            ? $t('common.quotePrivate')
            : money(row.basePrice as number)
        }}
      </template>
      <template #cell-isActive="{ row }">
        <span class="tag" :class="row.isActive ? 'bg-success-bg text-success' : 'bg-neutral-200 text-neutral-600'">
          {{ row.isActive ? $t('sa22.onSale') : $t('sa22.offSale') }}
        </span>
      </template>
      <template #cell-actions="{ row }">
        <button
          v-if="row.isActive" type="button" class="text-[12.5px] text-danger underline"
          @click.stop="deactivateTarget = row as unknown as ServiceItem"
        >
          {{ $t('sa22.retire') }}
        </button>
      </template>
    </AyDataTable>

    <AyConfirmDialog
      :open="Boolean(deactivateTarget)"
      :title="$t('sa22.askRetire')"
      :message="$t('sa22.askRetireBody')"
      :confirm-label="$t('sa22.retire')"
      danger
      @confirm="deactivate"
      @cancel="deactivateTarget = null"
    />
  </div>
</template>
