<script setup lang="ts">
import type { PartsReport } from '~/types/models';

/** SA-38 Bao cao phu tung va ton kho — FR-RPT-07, FR-PRT-12. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { i18n, money, number, date: fmtDate } = useFormat();

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: fmtDate(from, 'yyyy-MM-dd'), to: fmtDate(to, 'yyyy-MM-dd') };
}

const range = reactive(defaultRange());
const storeId = computed(() => ui.activeStoreId ?? undefined);

const { data, pending } = await useAsyncData(
  'report-parts',
  () => api.get<PartsReport>('/admin/reports/parts', { ...range, storeId: storeId.value }),
  { watch: [range, storeId] },
);

const maxQuantity = computed(() =>
  Math.max(1, ...(data.value?.topUsed ?? []).map((r) => r.quantity)),
);

useHead({ title: 'Báo cáo phụ tùng — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader code="SA-38" title="Báo cáo phụ tùng &amp; tồn kho" back-to="/admin/reports">
      <template #actions>
        <AyExportButtons report="parts" :from="range.from" :to="range.to" :store-id="storeId" />
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
      <section class="card">
        <h2 class="mb-3 font-heading text-[16px]">Phụ tùng dùng nhiều nhất</h2>

        <AyEmptyState
          v-if="data.topUsed.length === 0"
          title="Chưa có phụ tùng nào được sử dụng trong khoảng này"
        />

        <ul v-else class="flex flex-col gap-2">
          <li
            v-for="row in data.topUsed" :key="row.partCode ?? row.partName"
            class="flex items-center gap-3"
          >
            <span class="w-52 truncate text-[13.5px]">
              {{ row.partName }}
              <span class="block font-mono text-[11px] text-muted">{{ row.partCode }}</span>
            </span>
            <div class="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
              <div
                class="h-full rounded-full bg-accent"
                :style="{ width: `${(row.quantity / maxQuantity) * 100}%` }"
              />
            </div>
            <span class="w-16 text-right font-heading text-[14px]">{{ number(row.quantity) }}</span>
            <span class="w-28 text-right text-[13px] text-muted">{{ money(row.amount) }}</span>
          </li>
        </ul>
      </section>

      <section class="card">
        <h2 class="mb-3 font-heading text-[16px]">
          Phụ tùng sắp hết ({{ data.lowStock.length }})
        </h2>

        <AyEmptyState v-if="data.lowStock.length === 0" title="Tồn kho đang ở mức an toàn" />

        <div v-else class="table-wrap !shadow-none">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Phụ tùng</th>
                <th scope="col">Cửa hàng</th>
                <th scope="col" class="text-right">Tồn</th>
                <th scope="col" class="text-right">Ngưỡng</th>
                <th scope="col" class="w-24" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in data.lowStock" :key="row.id">
                <td>
                  {{ i18n(row.part?.name ?? null) }}
                  <span class="block font-mono text-[11px] text-muted">{{ row.part?.code }}</span>
                </td>
                <td>{{ i18n(row.store?.name ?? null) }}</td>
                <td class="text-right font-heading text-danger">{{ number(row.quantity) }}</td>
                <td class="text-right">{{ number(row.minQuantity) }}</td>
                <td>
                  <NuxtLink to="/admin/inventory/transactions" class="text-[12.5px] underline">
                    Nhập kho
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
