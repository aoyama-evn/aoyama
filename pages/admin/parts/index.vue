<script setup lang="ts">
import type { Page, Part } from '~/types/models';

/** SA-25 Danh sach phu tung — FR-PRT-08, FR-PRT-14. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { i18n, money } = useFormat();

const filters = reactive({ keyword: '', category: '' });
const page = ref(1);

const { data: categories } = await useAsyncData('part-categories', () =>
  api.get<string[]>('/admin/parts/categories'),
);

const query = computed(() => ({
  page: page.value,
  limit: 20,
  keyword: filters.keyword || undefined,
  category: filters.category || undefined,
}));

const { data, pending, refresh } = await useAsyncData(
  'admin-parts',
  () => api.get<Page<Part>>('/admin/parts', query.value),
  { watch: [query] },
);

const deactivateTarget = ref<Part | null>(null);

async function deactivate(): Promise<void> {
  if (!deactivateTarget.value) return;
  try {
    await api.del(`/admin/parts/${deactivateTarget.value.id}`);
    ui.success(t('sa25.retired'));
    deactivateTarget.value = null;
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

const COLUMNS = [
  { key: 'code', label: t('sa03.colCode'), width: '160px' },
  { key: 'name', label: t('sa25.colName') },
  { key: 'maker', label: t('sa25.colMaker'), width: '130px' },
  { key: 'category', label: t('sa25.colCategory'), width: '120px' },
  { key: 'sellPrice', label: t('sa25.colSell'), align: 'right' as const, width: '120px' },
  { key: 'createdSource', label: t('sa25.colSource'), width: '110px' },
  { key: 'actions', label: '', width: '110px' },
];

setScreenTitle(() => t('sa25.catalog'));
useHead({ title: () => `${t('sa25.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AdminCatalogTabs />
    <AyPageHeader code="SA-25" :title="$t('sa25.catalog')">
      <template #actions>
        <AyButton to="/admin/inventory" variant="secondary" size="sm">{{ $t('sa25.stockCta') }}</AyButton>
        <AyButton to="/admin/parts/new/edit" size="sm">{{ $t('sa25.addCta') }}</AyButton>
      </template>
    </AyPageHeader>

    <AyFilterBar
      :has-active-filters="Boolean(filters.keyword || filters.category)"
      @reset="filters.keyword = ''; filters.category = ''"
    >
      <AyField :label="$t('common.keyword')" class="min-w-[220px] flex-1">
        <template #default="{ id }">
          <input :id="id" v-model="filters.keyword" class="input" type="search" :placeholder="$t('sa25.searchPlaceholder')">
        </template>
      </AyField>
      <AyField :label="$t('sa25.colCategory')">
        <template #default="{ id }">
          <select :id="id" v-model="filters.category" class="input">
            <option value="">{{ $t('common.all') }}</option>
            <option v-for="category in categories ?? []" :key="category" :value="category">{{ category }}</option>
          </select>
        </template>
      </AyField>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      :empty-title="$t('sa25.empty')"
      @update:page="page = $event"
    >
      <template #cell-code="{ row }"><span class="font-mono text-[12.5px]">{{ row.code }}</span></template>
      <template #cell-name="{ row }">
        <NuxtLink :to="`/admin/parts/${row.id}/edit`" class="font-semibold hover:underline">
          {{ i18n((row as unknown as Part).name) }}
        </NuxtLink>
        <span v-if="!row.isActive" class="tag ml-2 bg-neutral-200 text-neutral-600">{{ $t('sa25.retiredTag') }}</span>
      </template>
      <template #cell-maker="{ row }">{{ row.maker ?? '—' }}</template>
      <template #cell-category="{ row }">{{ row.category ?? '—' }}</template>
      <template #cell-sellPrice="{ row }">{{ money(row.sellPrice as number) }}</template>
      <template #cell-createdSource="{ row }">
        <span v-if="row.createdSource === 'AI_IMAGE'" class="tag bg-olive-100 text-olive-800">AI</span>
        <span v-else class="text-[12.5px] text-muted">{{ $t('sa25.manual') }}</span>
      </template>
      <template #cell-actions="{ row }">
        <button
          v-if="row.isActive" type="button" class="text-[12.5px] text-danger underline"
          @click.stop="deactivateTarget = row as unknown as Part"
        >
          {{ $t('sa25.retire') }}
        </button>
      </template>
    </AyDataTable>

    <AyConfirmDialog
      :open="Boolean(deactivateTarget)"
      :title="$t('sa25.askRetire')"
      :message="$t('sa25.askRetireBody')"
      :confirm-label="$t('sa25.retire')"
      danger
      @confirm="deactivate"
      @cancel="deactivateTarget = null"
    />
  </div>
</template>
