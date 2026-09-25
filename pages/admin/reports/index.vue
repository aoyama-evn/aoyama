<script setup lang="ts">
import type { SummaryReport } from '~/types/models';

/** SA-36 Bao cao tong hop — FR-RPT-01..06, FR-RPT-12. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { money, date: fmtDate } = useFormat();

/** Mac dinh xem 30 ngay gan nhat. */
function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: fmtDate(from, 'yyyy-MM-dd'), to: fmtDate(to, 'yyyy-MM-dd') };
}

const range = reactive(defaultRange());
const storeId = computed(() => ui.activeStoreId ?? undefined);

const { data, pending } = await useAsyncData(
  'report-summary',
  () => api.get<SummaryReport>('/admin/reports', { ...range, storeId: storeId.value }),
  { watch: [range, storeId] },
);

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  RECEIVED: 'Đã tiếp nhận',
  DONE: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Không đến',
};

/** Bieu do cot don gian bang CSS — du cho muc do chi tiet cua man hinh nay. */
const maxDay = computed(() =>
  Math.max(1, ...(data.value?.bookings.byDay ?? []).map((d) => d.count)),
);

useHead({ title: 'Báo cáo tổng hợp — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-[15px]">
    <AdminStoreBar />

    <AyPageHeader code="SA-36" title="Báo cáo tổng hợp">
      <template #actions>
        <AyExportButtons report="summary" :from="range.from" :to="range.to" :store-id="storeId" />
      </template>
    </AyPageHeader>

    <AyFilterBar>
      <AyField label="Từ ngày">
        <template #default="{ id }">
          <input :id="id" v-model="range.from" class="input" type="date">
        </template>
      </AyField>
      <AyField label="Đến ngày">
        <template #default="{ id }">
          <input :id="id" v-model="range.to" class="input" type="date">
        </template>
      </AyField>
      <div class="ml-auto flex gap-2">
        <AyButton to="/admin/reports/revenue" variant="secondary" size="sm">Doanh thu</AyButton>
        <AyButton to="/admin/reports/parts" variant="secondary" size="sm">Phụ tùng</AyButton>
      </div>
    </AyFilterBar>

    <AyLoading v-if="pending" />

    <template v-else-if="data">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AyStatCard label="Tổng lịch hẹn" :value="data.bookings.total" />
        <AyStatCard
          label="Tỷ lệ hủy" :value="`${data.bookings.cancelRate}%`"
          :tone="data.bookings.cancelRate > 15 ? 'warning' : 'default'"
        />
        <AyStatCard
          label="Tỷ lệ khách không đến" :value="`${data.bookings.noShowRate}%`"
          :tone="data.bookings.noShowRate > 10 ? 'danger' : 'default'"
        />
        <AyStatCard label="Doanh thu kỳ này" :value="money(data.revenue)" />
      </div>

      <section class="card">
        <h2 class="mb-3 font-heading text-[16px]">Lịch hẹn theo ngày</h2>
        <div class="flex h-40 items-end gap-1 overflow-x-auto">
          <div
            v-for="day in data.bookings.byDay" :key="day.date"
            class="flex min-w-[26px] flex-1 flex-col items-center gap-1"
          >
            <span class="text-[10.5px] text-muted">{{ day.count }}</span>
            <div
              class="w-full rounded-t bg-accent-400"
              :style="{ height: `${(day.count / maxDay) * 100}%` }"
              :title="`${day.date}: ${day.count} lịch hẹn`"
            />
            <span class="text-[9.5px] text-muted">{{ day.date.slice(5) }}</span>
          </div>
        </div>
        <AyEmptyState v-if="data.bookings.byDay.length === 0" title="Chưa có lịch hẹn trong khoảng này" />
      </section>

      <div class="grid gap-4 lg:grid-cols-2">
        <section class="card">
          <h2 class="mb-3 font-heading text-[16px]">Lịch hẹn theo trạng thái</h2>
          <ul class="flex flex-col gap-2">
            <li v-for="row in data.bookings.byStatus" :key="row.status" class="flex items-center gap-3">
              <span class="w-36 text-[13.5px]">{{ STATUS_LABELS[row.status] ?? row.status }}</span>
              <div class="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
                <div
                  class="h-full rounded-full bg-accent"
                  :style="{ width: `${(row.count / Math.max(1, data.bookings.total)) * 100}%` }"
                />
              </div>
              <span class="w-12 text-right font-heading text-[14px]">{{ row.count }}</span>
            </li>
          </ul>
        </section>

        <section class="card">
          <h2 class="mb-3 font-heading text-[16px]">Phiếu dịch vụ</h2>
          <p class="mb-2 text-[13.5px]">
            Thời gian xử lý trung bình:
            <strong>
              {{ data.workOrders.averageTurnaroundHours !== null
                ? `${data.workOrders.averageTurnaroundHours} giờ`
                : 'chưa đủ dữ liệu' }}
            </strong>
          </p>
          <ul class="flex flex-col gap-1.5 text-[13.5px]">
            <li v-for="row in data.workOrders.byStatus" :key="row.status" class="flex justify-between">
              <span>{{ row.status }}</span>
              <span class="font-heading">{{ row.count }}</span>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>
