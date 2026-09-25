<script setup lang="ts">
import type { Inventory, Page, Store } from '~/types/models';

/** SA-28 Ton kho theo cua hang — FR-PRT-09, FR-PRT-12. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const route = useRoute();
const { t } = useI18n();
const { i18n, money, number } = useFormat();

const filters = reactive({
  keyword: '',
  lowStockOnly: route.query.lowStockOnly === 'true',
});
const page = ref(1);

const { data: stores } = await useAsyncData('inv-stores', () => api.get<Store[]>('/admin/stores'));

const query = computed(() => ({
  page: page.value,
  limit: 25,
  storeId: ui.activeStoreId ?? undefined,
  keyword: filters.keyword || undefined,
  lowStockOnly: filters.lowStockOnly || undefined,
}));

const { data, pending, refresh } = await useAsyncData(
  'admin-inventory',
  () => api.get<Page<Inventory>>('/admin/inventory', query.value),
  { watch: [query] },
);

const editing = ref<Inventory | null>(null);
const minQuantity = ref(0);

function startEdit(row: Inventory): void {
  editing.value = row;
  minQuantity.value = row.minQuantity;
}

async function saveMin(): Promise<void> {
  if (!editing.value) return;
  try {
    await api.put('/admin/inventory/min-quantity', {
      storeId: editing.value.storeId,
      partId: editing.value.partId,
      minQuantity: minQuantity.value,
    });
    ui.success(t('sa28.minSaved'));
    editing.value = null;
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

const COLUMNS = [
  { key: 'part', label: t('sa28.colPart') },
  { key: 'store', label: t('sa03.colStore'), width: '180px' },
  { key: 'quantity', label: t('sa28.colQty'), align: 'right' as const, width: '90px' },
  { key: 'minQuantity', label: t('sa28.colMin'), align: 'right' as const, width: '90px' },
  { key: 'value', label: t('sa28.colValue'), align: 'right' as const, width: '130px' },
  { key: 'actions', label: '', width: '110px' },
];

setScreenTitle(() => t('sa28.title'));
useHead({ title: () => `${t('sa28.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-[15px]">
    <AdminStoreBar />

    <AyPageHeader code="SA-28" :title="$t('sa28.byStore')">
      <template #actions>
        <AyButton to="/admin/inventory/transactions" variant="secondary" size="sm">
          {{ $t('sa28.moveCta') }}
        </AyButton>
      </template>
    </AyPageHeader>

    <AyFilterBar
      :has-active-filters="Boolean(filters.keyword || filters.lowStockOnly)"
      @reset="filters.keyword = ''; filters.lowStockOnly = false"
    >
      <AyField :label="$t('common.keyword')" class="min-w-[220px] flex-1">
        <template #default="{ id }">
          <input :id="id" v-model="filters.keyword" class="input" type="search" :placeholder="$t('sa28.searchPlaceholder')">
        </template>
      </AyField>
      <label class="flex items-center gap-2 self-end pb-2.5 text-[13.5px]">
        <input v-model="filters.lowStockOnly" type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]">
        {{ $t('sa28.lowOnly') }}
      </label>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      :empty-title="$t('sa28.empty')"
      :empty-hint="$t('sa28.emptyHint')"
      @update:page="page = $event"
    >
      <template #cell-part="{ row }">
        <span class="font-semibold">{{ i18n((row as unknown as Inventory).part?.name ?? null) }}</span>
        <span class="block font-mono text-[11.5px] text-muted">{{ (row as unknown as Inventory).part?.code }}</span>
      </template>
      <template #cell-store="{ row }">
        {{ i18n((row as unknown as Inventory).store?.name ?? null) }}
      </template>
      <template #cell-quantity="{ row }">
        <span
          class="font-heading"
          :class="(row.quantity as number) <= (row.minQuantity as number) && (row.minQuantity as number) > 0 ? 'text-danger' : ''"
        >
          {{ number(row.quantity as number) }}
        </span>
      </template>
      <template #cell-minQuantity="{ row }">{{ number(row.minQuantity as number) }}</template>
      <template #cell-value="{ row }">
        {{ money(((row as unknown as Inventory).part?.costPrice ?? 0) * (row.quantity as number)) }}
      </template>
      <template #cell-actions="{ row }">
        <button type="button" class="text-[12.5px] underline" @click.stop="startEdit(row as unknown as Inventory)">
          {{ $t('sa28.setMin') }}
        </button>
      </template>
    </AyDataTable>

    <AyConfirmDialog
      :open="Boolean(editing)"
      :title="$t('sa28.askMin')"
      :message="$t('sa28.askMinBody')"
      :confirm-label="$t('common.save')"
      @confirm="saveMin"
      @cancel="editing = null"
    >
      <AyField :label="$t('sa28.minLabel')" class="mt-3">
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="minQuantity" class="input" type="number" min="0">
        </template>
      </AyField>
    </AyConfirmDialog>
  </div>
</template>
