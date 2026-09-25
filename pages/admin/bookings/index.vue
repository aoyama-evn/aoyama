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
const { i18n, dayLabel, clock } = useFormat();

setScreenTitle('Lịch hẹn');

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

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  RECEIVED: 'Đã tiếp nhận',
  DONE: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Khách không đến',
};

/** Dai "Dang loc" chi hien khi bo loc den tu duong dan, khong phai tu nguoi go. */
const activeLabel = computed(() => {
  if (filters.status) return `Đang lọc: ${STATUS_LABELS[filters.status] ?? filters.status}`;
  if (filters.from && filters.from === filters.to) return `Đang lọc: ${dayLabel(filters.from)}`;
  return undefined;
});

const activeHint = computed(() =>
  data.value ? `${data.value.meta.total} lịch hẹn` : undefined,
);

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

function reset(): void {
  filters.keyword = '';
  filters.status = '';
  filters.serviceType = '';
  filters.from = '';
  filters.to = '';
  page.value = 1;
}

const COLUMNS = [
  { key: 'code', label: 'Mã', width: '130px' },
  { key: 'scheduledAt', label: 'Thời gian', sortable: true, width: '170px' },
  { key: 'contactName', label: 'Khách hàng' },
  { key: 'vehicle', label: 'Xe' },
  { key: 'store', label: 'Cửa hàng' },
  { key: 'status', label: 'Trạng thái', width: '150px' },
];

const SERVICE_TYPES = [
  { value: '', label: 'Tất cả' },
  { value: 'MAINTENANCE', label: 'Bảo dưỡng' },
  { value: 'REPAIR', label: 'Sửa chữa' },
  { value: 'BOTH', label: 'Cả hai' },
];

useHead({ title: 'Lịch hẹn — AOYAMA Admin' });
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
        Xem dạng lịch
      </NuxtLink>
      <NuxtLink to="/admin/bookings/new" class="btn btn-primary text-[13px]" style="min-height: 44px">
        + Tạo lịch hẹn
      </NuxtLink>
    </div>

    <AyFilterBar
      :has-active-filters="hasFilters"
      :active-label="activeLabel"
      :active-hint="activeHint"
      @reset="reset"
    >
      <AyField label="Tìm kiếm" class="min-w-[210px] max-w-[300px] flex-1">
        <template #default="{ id }">
          <input
            :id="id"
            v-model="filters.keyword"
            class="input"
            type="search"
            placeholder="Tên, SĐT, mã lịch hẹn, xe, biển số"
          />
        </template>
      </AyField>
      <AyField label="Từ ngày" class="min-w-[150px]">
        <template #default="{ id }">
          <input :id="id" v-model="filters.from" class="input" type="date" />
        </template>
      </AyField>
      <AyField label="Đến ngày" class="min-w-[150px]">
        <template #default="{ id }">
          <input :id="id" v-model="filters.to" class="input" type="date" />
        </template>
      </AyField>
      <AyField label="Loại dịch vụ" class="min-w-[160px]">
        <template #default="{ id }">
          <select :id="id" v-model="filters.serviceType" class="input">
            <option v-for="item in SERVICE_TYPES" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
        </template>
      </AyField>

      <template #chips>
        <AyChipFilter v-model="filters.status" label="Trạng thái" :options="STATUS_OPTIONS" />
      </template>
    </AyFilterBar>

    <AyDataTable
      :columns="COLUMNS"
      :rows="data?.items ?? []"
      :meta="data?.meta ?? null"
      :loading="pending"
      sort-by="scheduledAt"
      :sort-order="sortOrder"
      empty-title="Không có lịch hẹn nào khớp bộ lọc"
      empty-hint="Thử mở rộng khoảng ngày hoặc xóa bộ lọc."
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
