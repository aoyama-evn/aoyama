<script setup lang="ts">
import type { Booking, Page } from '~/types/models';

/**
 * SA-03 Danh sach lich hen — FR-BOOK-20.
 * Ban thiet ke: hang chon cua hang o tren cung, nut hanh dong can phai, roi the
 * loc mau trang va bang trong the rieng. Bang loc dat san (?status, ?range)
 * hien thanh dai "Dang loc: …" de nguoi dung biet vi sao danh sach ngan lai.
 */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const route = useRoute();
const { t } = useI18n();
const { i18n, dayLabel, clock } = useFormat();

setScreenTitle(() => t('sa03.title'));

const today = new Date().toISOString().slice(0, 10);

const filters = reactive({
  keyword: '',
  status: (route.query.status as string) ?? '',
  serviceType: '',
  from: route.query.range === 'today' ? today : '',
  to: route.query.range === 'today' ? today : '',
});
const page = ref(1);
const sortOrder = ref<'ASC' | 'DESC'>('DESC');

const query = computed(() => ({
  page: page.value,
  limit: 20,
  sortOrder: sortOrder.value,
  storeId: ui.activeStoreId ?? undefined,
  keyword: filters.keyword || undefined,
  status: filters.status || undefined,
  serviceType: filters.serviceType || undefined,
  from: filters.from || undefined,
  to: filters.to || undefined,
}));

const { data, pending } = await useAsyncData(
  'admin-bookings',
  () => api.get<Page<Booking>>('/admin/bookings', query.value),
  { watch: [query] },
);

const hasFilters = computed(() =>
  Boolean(filters.keyword || filters.status || filters.serviceType || filters.from || filters.to),
);

const STATUS_KEYS = ['PENDING', 'CONFIRMED', 'RECEIVED', 'DONE', 'CANCELLED', 'NO_SHOW'];

/** Dai "Dang loc" chi hien khi bo loc den tu duong dan, khong phai tu nguoi go. */
const activeLabel = computed(() => {
  if (filters.status) {
    return t('sa03.filtering', { what: t(`status.${filters.status}`) });
  }
  if (filters.from && filters.from === filters.to) {
    return t('sa03.filtering', { what: dayLabel(filters.from) });
  }
  return undefined;
});

const activeHint = computed(() =>
  data.value ? t('sa03.countHint', { n: data.value.meta.total }) : undefined,
);

const STATUS_OPTIONS = computed(() => [
  { value: '', label: t('common.all') },
  ...STATUS_KEYS.map((value) => ({ value, label: t(`status.${value}`) })),
]);

function reset(): void {
  filters.keyword = '';
  filters.status = '';
  filters.serviceType = '';
  filters.from = '';
  filters.to = '';
  page.value = 1;
}

const COLUMNS = computed(() => [
  { key: 'code', label: t('sa03.colCode'), width: '130px' },
  { key: 'scheduledAt', label: t('sa03.colWhen'), sortable: true, width: '170px' },
  { key: 'contactName', label: t('sa03.colCustomer') },
  { key: 'vehicle', label: t('sa03.colVehicle') },
  { key: 'store', label: t('sa03.colStore') },
  { key: 'status', label: t('sa02.colStatus'), width: '150px' },
]);

const SERVICE_TYPES = computed(() => [
  { value: '', label: t('common.all') },
  { value: 'MAINTENANCE', label: t('serviceType.MAINTENANCE') },
  { value: 'REPAIR', label: t('serviceType.REPAIR') },
  { value: 'BOTH', label: t('serviceType.BOTH') },
]);

useHead({ title: () => `${t('sa03.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-[15px]">
    <AdminStoreBar />

    <div class="flex justify-end gap-2">
      <NuxtLink
        to="/admin/bookings/calendar"
        class="btn btn-secondary text-[13px]"
        style="min-height: 44px"
      >
        {{ $t('sa03.calendarCta') }}
      </NuxtLink>
      <NuxtLink to="/admin/bookings/new" class="btn btn-primary text-[13px]" style="min-height: 44px">
        {{ $t('sa03.newCta') }}
      </NuxtLink>
    </div>

    <AyFilterBar
      :has-active-filters="hasFilters"
      :active-label="activeLabel"
      :active-hint="activeHint"
      @reset="reset"
    >
      <AyField :label="$t('common.search')" class="min-w-[210px] max-w-[300px] flex-1">
        <template #default="{ id }">
          <input
            :id="id"
            v-model="filters.keyword"
            class="input"
            type="search"
            :placeholder="$t('sa03.searchPlaceholder')"
          />
        </template>
      </AyField>
      <AyField :label="$t('sa03.fromDate')" class="min-w-[150px]">
        <template #default="{ id }">
          <input :id="id" v-model="filters.from" class="input" type="date" />
        </template>
      </AyField>
      <AyField :label="$t('sa03.toDate')" class="min-w-[150px]">
        <template #default="{ id }">
          <input :id="id" v-model="filters.to" class="input" type="date" />
        </template>
      </AyField>
      <AyField :label="$t('sa03.serviceKind')" class="min-w-[160px]">
        <template #default="{ id }">
          <select :id="id" v-model="filters.serviceType" class="input">
            <option v-for="item in SERVICE_TYPES" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
        </template>
      </AyField>

      <template #chips>
        <AyChipFilter v-model="filters.status" :label="$t('sa02.colStatus')" :options="STATUS_OPTIONS" />
      </template>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      sort-by="scheduledAt"
      :sort-order="sortOrder"
      :empty-title="$t('sa03.emptyTitle')"
      :empty-hint="$t('sa03.emptyHint')"
      @update:page="page = $event"
      @update:sort="sortOrder = $event.sortOrder"
      @row-click="navigateTo(`/admin/bookings/${$event.id}`)"
    >
      <template #cell-code="{ row }">
        <span class="font-mono text-[12.5px]">{{ row.code }}</span>
      </template>
      <template #cell-scheduledAt="{ row }">
        {{ dayLabel(row.scheduledAt) }} · {{ clock(row.slotStartTime) }}
      </template>
      <template #cell-contactName="{ row }">
        <span class="font-semibold">{{ row.contactName }}</span>
        <span class="text-muted block text-[12px]">{{ row.contactPhone }}</span>
      </template>
      <template #cell-vehicle="{ row }">
        {{ row.vehicle?.plateNumber ?? '—' }}
      </template>
      <template #cell-store="{ row }">
        {{ i18n(row.store?.name ?? null) }}
      </template>
      <template #cell-status="{ row }">
        <AyStatusTag :status="row.status" />
      </template>
    </AyDataTable>
  </div>
</template>
