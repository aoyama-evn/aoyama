<script setup lang="ts">
import type { Page, Part } from '~/types/models';

/** SA-25 Danh sach phu tung — FR-PRT-08, FR-PRT-14. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
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
    ui.success('Đã ngừng dùng phụ tùng');
    deactivateTarget.value = null;
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

const COLUMNS = [
  { key: 'code', label: 'Mã', width: '160px' },
  { key: 'name', label: 'Tên phụ tùng' },
  { key: 'maker', label: 'Hãng', width: '130px' },
  { key: 'category', label: 'Nhóm', width: '120px' },
  { key: 'sellPrice', label: 'Giá bán', align: 'right' as const, width: '120px' },
  { key: 'createdSource', label: 'Nguồn', width: '110px' },
  { key: 'actions', label: '', width: '110px' },
];

useHead({ title: 'Phụ tùng — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader code="SA-25" title="Danh mục phụ tùng">
      <template #actions>
        <AyButton to="/admin/parts/ai-import" variant="secondary" size="sm">Nhập bằng AI</AyButton>
        <AyButton to="/admin/inventory" variant="secondary" size="sm">Tồn kho</AyButton>
        <AyButton to="/admin/parts/new/edit" size="sm">Thêm phụ tùng</AyButton>
      </template>
    </AyPageHeader>

    <AyFilterBar
      :has-active-filters="Boolean(filters.keyword || filters.category)"
      @reset="filters.keyword = ''; filters.category = ''"
    >
      <AyField label="Từ khóa" class="min-w-[220px] flex-1">
        <template #default="{ id }">
          <input :id="id" v-model="filters.keyword" class="input" type="search" placeholder="Mã, tên hoặc mã hãng">
        </template>
      </AyField>
      <AyField label="Nhóm">
        <template #default="{ id }">
          <select :id="id" v-model="filters.category" class="input">
            <option value="">Tất cả</option>
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
      empty-title="Chưa có phụ tùng nào"
      @update:page="page = $event"
    >
      <template #cell-code="{ row }"><span class="font-mono text-[12.5px]">{{ row.code }}</span></template>
      <template #cell-name="{ row }">
        <NuxtLink :to="`/admin/parts/${row.id}/edit`" class="font-semibold hover:underline">
          {{ i18n((row as unknown as Part).name) }}
        </NuxtLink>
        <span v-if="!row.isActive" class="tag ml-2 bg-neutral-200 text-neutral-600">ngừng dùng</span>
      </template>
      <template #cell-maker="{ row }">{{ row.maker ?? '—' }}</template>
      <template #cell-category="{ row }">{{ row.category ?? '—' }}</template>
      <template #cell-sellPrice="{ row }">{{ money(row.sellPrice as number) }}</template>
      <template #cell-createdSource="{ row }">
        <span v-if="row.createdSource === 'AI_IMAGE'" class="tag bg-olive-100 text-olive-800">AI</span>
        <span v-else class="text-[12.5px] text-muted">Thủ công</span>
      </template>
      <template #cell-actions="{ row }">
        <button
          v-if="row.isActive" type="button" class="text-[12.5px] text-danger underline"
          @click.stop="deactivateTarget = row as unknown as Part"
        >
          Ngừng dùng
        </button>
      </template>
    </AyDataTable>

    <AyConfirmDialog
      :open="Boolean(deactivateTarget)"
      title="Ngừng dùng phụ tùng"
      message="Phụ tùng không còn hiện khi chọn cho phiếu mới. Phiếu và báo giá cũ vẫn giữ nguyên."
      confirm-label="Ngừng dùng"
      danger
      @confirm="deactivate"
      @cancel="deactivateTarget = null"
    />
  </div>
</template>
