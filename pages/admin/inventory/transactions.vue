<script setup lang="ts">
import type { InventoryTransaction, Page, Part, Store } from '~/types/models';
import { InventoryTxType } from '~/types/enums';

/** SA-29 Nhap, xuat, dieu chinh kho — FR-PRT-11, FR-PRT-13, BR-42. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { i18n, money, dateTime, number } = useFormat();

const { data: stores } = await useAsyncData('tx-stores', () => api.get<Store[]>('/admin/stores'));

const filters = reactive({ storeId: ui.activeStoreId ?? '', type: '' });
const page = ref(1);

const query = computed(() => ({
  page: page.value,
  limit: 25,
  storeId: filters.storeId || undefined,
  type: filters.type || undefined,
}));

const { data, pending, refresh } = await useAsyncData(
  'admin-inventory-tx',
  () => api.get<Page<InventoryTransaction>>('/admin/inventory/transactions', query.value),
  { watch: [query] },
);

// ---- Bieu mau ghi bien dong ----
const form = reactive({
  storeId: ui.activeStoreId ?? '',
  partId: '',
  partLabel: '',
  type: InventoryTxType.IN as string,
  quantity: 1,
  unitCost: null as number | null,
  reason: '',
});
const saving = ref(false);

function pickPart(part: Part): void {
  form.partId = part.id;
  form.partLabel = `${part.code} · ${i18n(part.name)}`;
  if (form.type === InventoryTxType.IN && form.unitCost === null) form.unitCost = part.costPrice;
}

const isAdjust = computed(() => form.type === InventoryTxType.ADJUST);

async function submit(): Promise<void> {
  if (!form.storeId || !form.partId) {
    ui.warning('Chọn cửa hàng và phụ tùng trước');
    return;
  }
  saving.value = true;
  try {
    await api.post('/admin/inventory/transactions', {
      storeId: form.storeId,
      partId: form.partId,
      type: form.type,
      quantity: form.quantity,
      unitCost: form.unitCost ?? undefined,
      reason: form.reason || undefined,
    });
    ui.success('Đã ghi biến động kho');
    form.partId = '';
    form.partLabel = '';
    form.quantity = 1;
    form.reason = '';
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    saving.value = false;
  }
}

const TYPE_LABELS: Record<string, string> = {
  IN: 'Nhập kho',
  OUT: 'Xuất kho',
  ADJUST: 'Điều chỉnh',
  RETURN: 'Hoàn kho',
};

const COLUMNS = [
  { key: 'createdAt', label: 'Thời điểm', width: '150px' },
  { key: 'part', label: 'Phụ tùng' },
  { key: 'store', label: 'Cửa hàng', width: '170px' },
  { key: 'type', label: 'Loại', width: '110px' },
  { key: 'quantityChange', label: 'Thay đổi', align: 'right' as const, width: '100px' },
  { key: 'quantityAfter', label: 'Tồn sau', align: 'right' as const, width: '100px' },
  { key: 'reason', label: 'Lý do' },
];

useHead({ title: 'Nhập / xuất kho — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader
      code="SA-29" title="Nhập / xuất / điều chỉnh kho" back-to="/admin/inventory"
      description="Mọi thay đổi tồn kho đều để lại một dòng ở đây. Xuất kho cho phiếu dịch vụ được ghi tự động khi phiếu hoàn tất."
    />

    <section class="card grid gap-3 lg:grid-cols-4">
      <h2 class="font-heading text-[16px] lg:col-span-4">Ghi biến động mới</h2>

      <AyField label="Cửa hàng" required>
        <template #default="{ id }">
          <select :id="id" v-model="form.storeId" class="input">
            <option value="">— Chọn —</option>
            <option v-for="store in stores ?? []" :key="store.id" :value="store.id">
              {{ i18n(store.name) }}
            </option>
          </select>
        </template>
      </AyField>

      <AyField label="Loại" required>
        <template #default="{ id }">
          <select :id="id" v-model="form.type" class="input">
            <option v-for="(label, value) in TYPE_LABELS" :key="value" :value="value">{{ label }}</option>
          </select>
        </template>
      </AyField>

      <AyField
        :label="isAdjust ? 'Chênh lệch (có thể âm)' : 'Số lượng'"
        required
        :hint="isAdjust ? 'Nhập số âm để giảm tồn sau kiểm kê' : undefined"
      >
        <template #default="{ id }">
          <input :id="id" v-model.number="form.quantity" class="input" type="number" :min="isAdjust ? undefined : 1">
        </template>
      </AyField>

      <AyField v-if="form.type === 'IN'" label="Đơn giá nhập">
        <template #default="{ id }">
          <input :id="id" v-model.number="form.unitCost" class="input" type="number" min="0">
        </template>
      </AyField>

      <div class="lg:col-span-2">
        <AyPartPicker :store-id="form.storeId || null" @select="pickPart" />
        <p v-if="form.partLabel" class="mt-1 text-[13px]">
          Đã chọn: <strong>{{ form.partLabel }}</strong>
        </p>
      </div>

      <AyField label="Lý do" class="lg:col-span-2">
        <template #default="{ id }">
          <input :id="id" v-model="form.reason" class="input" type="text" placeholder="Nhập hàng từ nhà cung cấp, kiểm kê cuối tháng…">
        </template>
      </AyField>

      <div class="lg:col-span-4">
        <AyButton :loading="saving" :disabled="!form.storeId || !form.partId" @click="submit">
          Ghi biến động
        </AyButton>
      </div>
    </section>

    <AyFilterBar
      :has-active-filters="Boolean(filters.storeId || filters.type)"
      @reset="filters.storeId = ''; filters.type = ''"
    >
      <AyField label="Cửa hàng">
        <template #default="{ id }">
          <select :id="id" v-model="filters.storeId" class="input">
            <option value="">Tất cả</option>
            <option v-for="store in stores ?? []" :key="store.id" :value="store.id">
              {{ i18n(store.name) }}
            </option>
          </select>
        </template>
      </AyField>
      <AyField label="Loại">
        <template #default="{ id }">
          <select :id="id" v-model="filters.type" class="input">
            <option value="">Tất cả</option>
            <option v-for="(label, value) in TYPE_LABELS" :key="value" :value="value">{{ label }}</option>
          </select>
        </template>
      </AyField>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      empty-title="Chưa có biến động kho nào"
      @update:page="page = $event"
    >
      <template #cell-createdAt="{ row }">{{ dateTime(row.createdAt as string) }}</template>
      <template #cell-part="{ row }">
        {{ i18n((row as unknown as InventoryTransaction).part?.name ?? null) }}
        <span class="block font-mono text-[11.5px] text-muted">
          {{ (row as unknown as InventoryTransaction).part?.code }}
        </span>
      </template>
      <template #cell-store="{ row }">
        {{ i18n((row as unknown as InventoryTransaction).store?.name ?? null) }}
      </template>
      <template #cell-type="{ row }">{{ TYPE_LABELS[row.type as string] }}</template>
      <template #cell-quantityChange="{ row }">
        <span :class="(row.quantityChange as number) >= 0 ? 'text-success' : 'text-danger'">
          {{ (row.quantityChange as number) > 0 ? '+' : '' }}{{ number(row.quantityChange as number) }}
        </span>
      </template>
      <template #cell-quantityAfter="{ row }">{{ number(row.quantityAfter as number) }}</template>
      <template #cell-reason="{ row }">
        <span class="text-[13px] text-muted">{{ row.reason ?? '—' }}</span>
      </template>
    </AyDataTable>
  </div>
</template>
