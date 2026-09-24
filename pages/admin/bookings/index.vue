<script setup lang="ts">
import type { Booking, Page } from '~/types/models';
import { BookingStatus } from '~/types/enums';

/** SA-03 Danh sach lich hen — FR-BOOK-20. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const route = useRoute();
const { i18n, dateTime } = useFormat();

const filters = reactive({
  keyword: '',
  status: (route.query.status as string) ?? '',
  from: '',
  to: '',
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
  from: filters.from || undefined,
  to: filters.to || undefined,
}));

const { data, pending } = await useAsyncData(
  'admin-bookings',
  () => api.get<Page<Booking>>('/admin/bookings', query.value),
  { watch: [query] },
);

const hasFilters = computed(() =>
  Boolean(filters.keyword || filters.status || filters.from || filters.to),
);

function reset(): void {
  filters.keyword = '';
  filters.status = '';
  filters.from = '';
  filters.to = '';
  page.value = 1;
}

const COLUMNS = [
  { key: 'code', label: 'Mã', width: '130px' },
  { key: 'scheduledAt', label: 'Thời gian', sortable: true, width: '150px' },
  { key: 'contactName', label: 'Khách hàng' },
  { key: 'vehicle', label: 'Xe' },
  { key: 'store', label: 'Cửa hàng' },
  { key: 'status', label: 'Trạng thái', width: '150px' },
];

const STATUSES = Object.values(BookingStatus);

useHead({ title: 'Lịch hẹn — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader code="SA-03" title="Danh sách lịch hẹn">
      <template #actions>
        <AyButton to="/admin/bookings/calendar" variant="secondary" size="sm">Xem dạng lịch</AyButton>
        <AyButton to="/admin/bookings/new" size="sm">Đặt thay khách</AyButton>
      </template>
    </AyPageHeader>

    <AyFilterBar :has-active-filters="hasFilters" @reset="reset">
      <AyField label="Từ khóa" class="min-w-[200px] flex-1">
        <template #default="{ id }">
          <input :id="id" v-model="filters.keyword" class="ay-input" type="search" placeholder="Mã, tên, SĐT, biển số">
        </template>
      </AyField>
      <AyField label="Trạng thái">
        <template #default="{ id }">
          <select :id="id" v-model="filters.status" class="ay-input">
            <option value="">Tất cả</option>
            <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
          </select>
        </template>
      </AyField>
      <AyField label="Từ ngày">
        <template #default="{ id }">
          <input :id="id" v-model="filters.from" class="ay-input" type="date">
        </template>
      </AyField>
      <AyField label="Đến ngày">
        <template #default="{ id }">
          <input :id="id" v-model="filters.to" class="ay-input" type="date">
        </template>
      </AyField>
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
        {{ dateTime(row.scheduledAt as string) }}
      </template>
      <template #cell-contactName="{ row }">
        <span class="font-semibold">{{ row.contactName }}</span>
        <span class="block text-[12px] ay-muted">{{ row.contactPhone }}</span>
      </template>
      <template #cell-vehicle="{ row }">
        {{ (row.vehicle as Booking['vehicle'])?.plateNumber ?? '—' }}
      </template>
      <template #cell-store="{ row }">
        {{ i18n((row.store as Booking['store'])?.name ?? null) }}
      </template>
      <template #cell-status="{ row }">
        <AyStatusTag :status="row.status as string" />
      </template>
    </AyDataTable>
  </div>
</template>
