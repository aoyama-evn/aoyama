<script setup lang="ts">
import type { InventoryTransaction, Page, Part, Store } from '~/types/models';
import { InventoryTxType } from '~/types/enums';

/** SA-29 Nhap, xuat, dieu chinh kho — FR-PRT-11, FR-PRT-13, BR-42. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
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

/** Cac loai bien dong kho; nhan lay tu tep ngon ngu. */
const TX_TYPES = Object.values(InventoryTxType);

async function submit(): Promise<void> {
  if (!form.storeId || !form.partId) {
    ui.warning(t('sa29.needPart'));
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
    ui.success(t('sa29.recorded'));
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

const COLUMNS = [
  { key: 'createdAt', label: t('sa29.colWhen'), width: '150px' },
  { key: 'part', label: t('sa28.colPart') },
  { key: 'store', label: t('sa03.colStore'), width: '170px' },
  { key: 'type', label: t('sa29.type'), width: '110px' },
  { key: 'quantityChange', label: t('sa29.colChange'), align: 'right' as const, width: '100px' },
  { key: 'quantityAfter', label: t('sa29.colAfter'), align: 'right' as const, width: '100px' },
  { key: 'reason', label: t('sa29.reason') },
];

setScreenTitle(() => t('sa29.headTitle'));
useHead({ title: () => `${t('sa29.headTitle')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-[15px]">
    <AdminStoreBar />

    <AyPageHeader
      code="SA-29" :title="$t('sa29.title')" back-to="/admin/inventory"
      :description="$t('sa29.lead')"
    />

    <section class="card grid gap-3 lg:grid-cols-4">
      <h2 class="font-heading text-[16px] lg:col-span-4">{{ $t('sa29.newEntry') }}</h2>

      <AyField :label="$t('sa03.colStore')" required>
        <template #default="{ id }">
          <select :id="id" v-model="form.storeId" class="input">
            <option value="">{{ $t('sa29.pickOne') }}</option>
            <option v-for="store in stores ?? []" :key="store.id" :value="store.id">
              {{ i18n(store.name) }}
            </option>
          </select>
        </template>
      </AyField>

      <AyField :label="$t('sa29.type')" required>
        <template #default="{ id }">
          <select :id="id" v-model="form.type" class="input">
            <option v-for="value in TX_TYPES" :key="value" :value="value">
              {{ $t(`stockType.${value}`) }}
            </option>
          </select>
        </template>
      </AyField>

      <AyField
        :label="isAdjust ? $t('sa29.delta') : $t('sa29.qty')"
        required
        :hint="isAdjust ? $t('sa29.deltaHint') : undefined"
      >
        <template #default="{ id }">
          <input :id="id" v-model.number="form.quantity" class="input" type="number" :min="isAdjust ? undefined : 1">
        </template>
      </AyField>

      <AyField v-if="form.type === 'IN'" :label="$t('sa29.unitCost')">
        <template #default="{ id }">
          <input :id="id" v-model.number="form.unitCost" class="input" type="number" min="0">
        </template>
      </AyField>

      <div class="lg:col-span-2">
        <AyPartPicker :store-id="form.storeId || null" @select="pickPart" />
        <p v-if="form.partLabel" class="mt-1 text-[13px]">
          {{ $t('sa29.picked') }} <strong>{{ form.partLabel }}</strong>
        </p>
      </div>

      <AyField :label="$t('sa29.reason')" class="lg:col-span-2">
        <template #default="{ id }">
          <input :id="id" v-model="form.reason" class="input" type="text" :placeholder="$t('sa29.reasonPlaceholder')">
        </template>
      </AyField>

      <div class="lg:col-span-4">
        <AyButton :loading="saving" :disabled="!form.storeId || !form.partId" @click="submit">
          {{ $t('sa29.record') }}
        </AyButton>
      </div>
    </section>

    <AyFilterBar
      :has-active-filters="Boolean(filters.storeId || filters.type)"
      @reset="filters.storeId = ''; filters.type = ''"
    >
      <AyField :label="$t('sa03.colStore')">
        <template #default="{ id }">
          <select :id="id" v-model="filters.storeId" class="input">
            <option value="">{{ $t('common.all') }}</option>
            <option v-for="store in stores ?? []" :key="store.id" :value="store.id">
              {{ i18n(store.name) }}
            </option>
          </select>
        </template>
      </AyField>
      <AyField :label="$t('sa29.type')">
        <template #default="{ id }">
          <select :id="id" v-model="filters.type" class="input">
            <option value="">{{ $t('common.all') }}</option>
            <option v-for="value in TX_TYPES" :key="value" :value="value">
              {{ $t(`stockType.${value}`) }}
            </option>
          </select>
        </template>
      </AyField>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      :empty-title="$t('sa29.empty')"
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
      <template #cell-type="{ row }">{{ $t(`stockType.${row.type}`) }}</template>
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
