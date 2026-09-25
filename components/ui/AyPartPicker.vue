<script setup lang="ts">
import type { Inventory, Part } from '~/types/models';

/**
 * CP-20 Bo chon phu tung — SA-11, SA-12, SA-29.
 * Hien ton kho cua dung cua hang dang thao tac, de ky thuat vien khong chon
 * phu tung ma kho khong con.
 */
const props = defineProps<{ storeId?: string | null }>();
const emit = defineEmits<{ (e: 'select', part: Part, available: number): void }>();

const api = useApi();
const { i18n, money } = useFormat();

const keyword = ref('');
const results = ref<Part[]>([]);
const stockByPart = ref<Record<string, number>>({});
const loading = ref(false);

const debounced = useDebounceFn(search, 300);
watch(keyword, () => debounced());

async function search(): Promise<void> {
  if (keyword.value.trim().length < 2) {
    results.value = [];
    return;
  }
  loading.value = true;
  try {
    const page = await api.get<{ items: Part[] }>('/admin/parts', {
      keyword: keyword.value.trim(),
      isActive: true,
      limit: 20,
    });
    results.value = page.items;
    await loadStock(page.items.map((p) => p.id));
  } finally {
    loading.value = false;
  }
}

async function loadStock(partIds: string[]): Promise<void> {
  if (!props.storeId || partIds.length === 0) return;
  const page = await api.get<{ items: Inventory[] }>('/admin/inventory', {
    storeId: props.storeId,
    limit: 100,
  });
  const map: Record<string, number> = {};
  for (const row of page.items) map[row.partId] = row.quantity;
  stockByPart.value = map;
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <AyField :label="$t('part.search')" :hint="$t('part.searchHint')">
      <template #default="{ id }">
        <input :id="id" v-model="keyword" class="input" type="search" :placeholder="$t('part.searchPlaceholder')">
      </template>
    </AyField>

    <p v-if="loading" class="text-[13px] text-muted">{{ $t('part.searching') }}</p>

    <ul v-else-if="results.length" class="flex max-h-72 flex-col gap-1 overflow-y-auto">
      <li v-for="part in results" :key="part.id">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-accent-100"
          style="min-height: 48px"
          @click="emit('select', part, stockByPart[part.id] ?? 0)"
        >
          <span class="flex-1">
            <span class="block text-[14px] font-semibold">{{ i18n(part.name) }}</span>
            <span class="block text-[12px] text-muted">{{ part.code }} · {{ part.maker ?? '—' }}</span>
          </span>
          <span class="text-right">
            <span class="block font-heading text-[13.5px]">{{ money(part.sellPrice) }}</span>
            <span
              class="block text-[11.5px]"
              :class="(stockByPart[part.id] ?? 0) > 0 ? 'text-muted' : 'text-danger'"
            >
              {{ $t('part.stock', { n: stockByPart[part.id] ?? 0 }) }}
            </span>
          </span>
        </button>
      </li>
    </ul>

    <p v-else-if="keyword.trim().length >= 2" class="text-[13px] text-muted">
      {{ $t('part.noResult') }}
    </p>
  </div>
</template>
