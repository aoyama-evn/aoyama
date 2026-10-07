<script setup lang="ts" generic="T extends object">
import type { PageMeta } from '~/types/models';

/**
 * CP-06 Bang du lieu — sap xep, phan trang, chon nhieu dong.
 * Bang luon nam trong khung cuon ngang rieng de than trang khong bi day rong
 * tren dien thoai.
 */
const props = withDefaults(
  defineProps<{
    columns: { key: string; label: string; sortable?: boolean; align?: 'left' | 'right' | 'center'; width?: string }[];
    rows: T[];
    meta?: PageMeta | null;
    rowKey?: string;
    loading?: boolean;
    selectable?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    emptyTitle?: string;
    emptyHint?: string;
  }>(),
  { rowKey: 'id', sortOrder: 'DESC' },
);

const emit = defineEmits<{
  (e: 'update:page', page: number): void;
  (e: 'update:sort', payload: { sortBy: string; sortOrder: 'ASC' | 'DESC' }): void;
  (e: 'update:selected', ids: string[]): void;
  (e: 'row-click', row: T): void;
}>();

const { t } = useI18n();

const selected = ref<string[]>([]);

const allSelected = computed(
  () => props.rows.length > 0 && selected.value.length === props.rows.length,
);

function cell(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

function keyOf(row: T): string {
  return String(cell(row, props.rowKey));
}

function toggleAll(): void {
  selected.value = allSelected.value ? [] : props.rows.map(keyOf);
  emit('update:selected', selected.value);
}

function toggleOne(row: T): void {
  const id = keyOf(row);
  selected.value = selected.value.includes(id)
    ? selected.value.filter((x) => x !== id)
    : [...selected.value, id];
  emit('update:selected', selected.value);
}

function sort(key: string): void {
  const nextOrder = props.sortBy === key && props.sortOrder === 'DESC' ? 'ASC' : 'DESC';
  emit('update:sort', { sortBy: key, sortOrder: nextOrder });
}

const pageNumbers = computed(() => {
  const meta = props.meta;
  if (!meta) return [];
  const total = meta.totalPages;
  const current = meta.page;
  // Hien toi da 5 so trang quanh trang hien tai.
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const end = Math.min(total, start + 4);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

// Doi bo du lieu thi bo lua chon cu, tranh thao tac hang loat nham dong.
watch(
  () => props.rows,
  () => {
    selected.value = [];
    emit('update:selected', []);
  },
);
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th v-if="selectable" scope="col" class="w-10">
              <input
                type="checkbox"
                :checked="allSelected"
                :aria-label="allSelected ? $t('table.deselectAll') : $t('table.selectAll')"
                class="h-4 w-4 accent-[var(--color-accent)]"
                @change="toggleAll"
              >
            </th>
            <th
              v-for="col in columns"
              :key="col.key"
              scope="col"
              :style="col.width ? { width: col.width } : undefined"
              :class="col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''"
            >
              <button
                v-if="col.sortable"
                type="button"
                class="inline-flex items-center gap-1 hover:text-accent-700"
                @click="sort(col.key)"
              >
                {{ col.label }}
                <span v-if="sortBy === col.key" aria-hidden="true">
                  {{ sortOrder === 'ASC' ? '▲' : '▼' }}
                </span>
              </button>
              <template v-else>{{ col.label }}</template>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length + (selectable ? 1 : 0)" class="py-10 text-center text-muted">
              {{ $t('table.loading') }}
            </td>
          </tr>

          <tr v-else-if="rows.length === 0">
            <td :colspan="columns.length + (selectable ? 1 : 0)" class="p-0">
              <AyEmptyState :title="emptyTitle ?? t('common.noData')" :hint="emptyHint">
                <slot name="empty-action" />
              </AyEmptyState>
            </td>
          </tr>

          <tr
            v-for="row in rows"
            v-else
            :key="keyOf(row)"
            class="cursor-pointer"
            @click="emit('row-click', row)"
          >
            <td v-if="selectable" @click.stop>
              <input
                type="checkbox"
                :checked="selected.includes(keyOf(row))"
                :aria-label="$t('table.selectRow', { key: keyOf(row) })"
                class="h-4 w-4 accent-[var(--color-accent)]"
                @change="toggleOne(row)"
              >
            </td>
            <td
              v-for="col in columns"
              :key="col.key"
              :class="col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''"
            >
              <!--
                Man goi da cung cap o nay thi de man goi quyet, ke ca khi
                no khong ve gi. Dung noi dung du phong cua <slot> thi Vue
                coi mot o rong (v-if sai) la "chua co gi" va do dau gach
                vao — cot hanh dong khong co nut nao lai hien ra "—".
              -->
              <slot
                v-if="$slots[`cell-${col.key}`]"
                :name="`cell-${col.key}`"
                :row="row"
                :value="cell(row, col.key)"
              />
              <template v-else>{{ cell(row, col.key) ?? '—' }}</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="meta && meta.totalPages > 1"
      class="flex flex-wrap items-center justify-between gap-3 text-[13px]"
    >
      <p class="text-muted">
        {{ (meta.page - 1) * meta.limit + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }}
        / {{ meta.total.toLocaleString('ja-JP') }}
      </p>

      <nav class="flex items-center gap-1" :aria-label="$t('table.pagination')">
        <button
          type="button"
          class="btn btn-secondary text-[12.5px]"
          :disabled="!meta.hasPrev"
          @click="emit('update:page', meta.page - 1)"
        >
          {{ $t('common.prev') }}
        </button>
        <button
          v-for="p in pageNumbers"
          :key="p"
          type="button"
          class="btn text-[12.5px] min-w-[38px]"
          :class="p === meta.page ? 'btn-primary' : 'btn-secondary'"
          :aria-current="p === meta.page ? 'page' : undefined"
          @click="emit('update:page', p)"
        >
          {{ p }}
        </button>
        <button
          type="button"
          class="btn btn-secondary text-[12.5px]"
          :disabled="!meta.hasNext"
          @click="emit('update:page', meta.page + 1)"
        >
          {{ $t('common.nextPage') }}
        </button>
      </nav>
    </div>
  </div>
</template>
