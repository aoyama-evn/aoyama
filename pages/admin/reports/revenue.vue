<script setup lang="ts">
import type { RevenueReport } from '~/types/models';

/** SA-37 Bao cao doanh thu — FR-RPT-06, FR-RPT-08..10. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { money, date: fmtDate } = useFormat();

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: fmtDate(from, 'yyyy-MM-dd'), to: fmtDate(to, 'yyyy-MM-dd') };
}

const range = reactive(defaultRange());
const storeId = computed(() => ui.activeStoreId ?? undefined);

const { data, pending } = await useAsyncData(
  'report-revenue',
  () => api.get<RevenueReport>('/admin/reports/revenue', { ...range, storeId: storeId.value }),
  { watch: [range, storeId] },
);

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  CARD_AT_STORE: 'Thẻ tại quầy',
  BANK_TRANSFER: 'Chuyển khoản',
  OTHER: 'Khác',
};

const maxDay = computed(() => Math.max(1, ...(data.value?.byDay ?? []).map((d) => d.amount)));
const splitTotal = computed(() => (data.value?.split.labor ?? 0) + (data.value?.split.parts ?? 0));

useHead({ title: 'Báo cáo doanh thu — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-[15px]">
    <AdminStoreBar />

    <AyPageHeader code="SA-37" title="Báo cáo doanh thu" back-to="/admin/reports">
      <template #actions>
        <AyExportButtons report="revenue" :from="range.from" :to="range.to" :store-id="storeId" />
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
    </AyFilterBar>

    <AyLoading v-if="pending" />

    <template v-else-if="data">
      <div class="grid gap-3 sm:grid-cols-3">
        <AyStatCard label="Tổng doanh thu" :value="money(data.total)" />
        <AyStatCard
          label="Tiền công"
          :value="money(data.split.labor)"
          :hint="splitTotal > 0 ? `${Math.round((data.split.labor / splitTotal) * 100)}% tổng` : undefined"
        />
        <AyStatCard
          label="Tiền phụ tùng"
          :value="money(data.split.parts)"
          :hint="splitTotal > 0 ? `${Math.round((data.split.parts / splitTotal) * 100)}% tổng` : undefined"
        />
      </div>

      <section class="card">
        <h2 class="mb-3 font-heading text-[16px]">Doanh thu theo ngày</h2>
        <div class="flex h-44 items-end gap-1 overflow-x-auto">
          <div
            v-for="day in data.byDay" :key="day.date"
            class="flex min-w-[28px] flex-1 flex-col items-center gap-1"
          >
            <div
              class="w-full rounded-t bg-olive-500"
              :style="{ height: `${(day.amount / maxDay) * 100}%` }"
              :title="`${day.date}: ${money(day.amount)} · ${day.workOrders} phiếu`"
            />
            <span class="text-[9.5px] text-muted">{{ day.date.slice(5) }}</span>
          </div>
        </div>
        <AyEmptyState v-if="data.byDay.length === 0" title="Chưa có khoản thu nào trong khoảng này" />
      </section>

      <div class="grid gap-4 lg:grid-cols-2">
        <section class="card">
          <h2 class="mb-3 font-heading text-[16px]">Theo hình thức thanh toán</h2>
          <ul class="flex flex-col gap-2">
            <li v-for="row in data.byMethod" :key="row.method" class="flex items-center gap-3">
              <span class="w-32 text-[13.5px]">{{ METHOD_LABELS[row.method] ?? row.method }}</span>
              <div class="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
                <div
                  class="h-full rounded-full bg-accent"
                  :style="{ width: `${(row.amount / Math.max(1, data.total)) * 100}%` }"
                />
              </div>
              <span class="w-28 text-right font-heading text-[14px]">{{ money(row.amount) }}</span>
            </li>
          </ul>
          <AyEmptyState v-if="data.byMethod.length === 0" title="Chưa có dữ liệu" />
        </section>

        <section class="card">
          <h2 class="mb-3 font-heading text-[16px]">Chi tiết theo ngày</h2>
          <div class="max-h-72 overflow-y-auto">
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">Ngày</th>
                  <th scope="col" class="text-center">Số phiếu</th>
                  <th scope="col" class="text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="day in data.byDay" :key="day.date">
                  <td>{{ day.date }}</td>
                  <td class="text-center">{{ day.workOrders }}</td>
                  <td class="text-right font-heading">{{ money(day.amount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
