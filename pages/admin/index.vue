<script setup lang="ts">
import type { Booking, DashboardStats, Inventory, Page } from '~/types/models';

/**
 * SA-02 Bang dieu khien — FR-RPT-11.
 * Ban thiet ke: day the chon cua hang va ngay hom nay, ba the chi so, roi hai
 * cot "Lich hen hom nay" va "Can xu ly", cuoi cung la bieu do doanh thu 7 ngay.
 */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { i18n, money, clock, dayLabel } = useFormat();

setScreenTitle(() => t('adm.nav.dashboard'));

const storeId = computed(() => ui.activeStoreId ?? undefined);
const today = new Date().toISOString().slice(0, 10);
const weekAgo = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);

const { data, pending } = await useAsyncData(
  'admin-dashboard',
  async () => {
    const [stats, todayBookings, lowStock, revenue] = await Promise.all([
      api.get<DashboardStats>('/admin/reports/dashboard', { storeId: storeId.value }),
      api.get<Page<Booking>>('/admin/bookings', {
        storeId: storeId.value,
        from: today,
        to: today,
        limit: 8,
        sortOrder: 'ASC',
      }),
      api.get<Inventory[]>('/admin/inventory/low-stock', { storeId: storeId.value }),
      api.get<{ byDay: { date: string; amount: string }[] }>('/admin/reports/revenue', {
        from: weekAgo,
        to: today,
        storeId: storeId.value,
      }),
    ]);
    return { stats, todayBookings, lowStock, revenue };
  },
  { watch: [storeId] },
);

/** Bay ngay gan nhat, ke ca ngay khong co doanh thu. */
const revenueSeries = computed(() => {
  const byDate = new Map(
    (data.value?.revenue.byDay ?? []).map((row) => [row.date.slice(0, 10), Number(row.amount)]),
  );
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(Date.now() - (6 - index) * 86_400_000);
    const key = day.toISOString().slice(0, 10);
    return { label: `${day.getMonth() + 1}/${day.getDate()}`, value: byDate.get(key) ?? 0 };
  });
});

useHead({ title: () => `${t('adm.nav.dashboard')} — AOYAMA Admin` });
</script>

<template>
  <AyLoading v-if="pending" />

  <div v-else-if="data" class="flex flex-col gap-[18px]">
    <AdminStoreBar variant="chips">
      <template #end>
        <span class="text-muted ml-auto text-[12px]">
          {{ $t('sa02.today', { date: dayLabel(today) }) }}
        </span>
      </template>
    </AdminStoreBar>

    <!-- CP-22 the chi so -->
    <div class="grid gap-[13px]" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))">
      <AyStatCard
        :label="$t('sa02.todayBookings')"
        :value="data.stats.todayBookings"
        :hint="$t('sa02.byStore')"
        to="/admin/bookings?range=today"
      />
      <AyStatCard
        :label="$t('sa02.inShop')"
        :value="data.stats.openWorkOrders"
        :hint="$t('sa02.awaitingQuote', { n: data.stats.awaitingQuotation })"
        to="/admin/work-orders"
      />
      <AyStatCard
        :label="$t('sa02.unpaid')"
        :value="data.stats.unpaidWorkOrders"
        :hint="$t('sa02.collectedToday', { amount: money(data.stats.todayRevenue) })"
        to="/admin/work-orders?paymentStatus=UNPAID"
      />
    </div>

    <div class="grid gap-3.5" style="grid-template-columns: repeat(auto-fit, minmax(330px, 1fr))">
      <!-- Lich hen hom nay -->
      <section class="card gap-2.5" style="background: #fff">
        <div class="flex items-baseline justify-between">
          <h5>{{ $t('sa02.todayBookings') }}</h5>
          <NuxtLink to="/admin/bookings" class="btn btn-ghost text-[12px]">{{ $t('sa02.viewAll') }}</NuxtLink>
        </div>

        <AyEmptyState
          v-if="data.todayBookings.items.length === 0"
          :title="$t('sa02.noBookings')"
        />

        <div v-else class="overflow-x-auto">
          <table class="table" style="min-width: 270px">
            <thead>
              <tr>
                <th>{{ $t('sa02.colTime') }}</th>
                <th>{{ $t('sa02.colCustomer') }}</th>
                <th>{{ $t('sa02.colService') }}</th>
                <th>{{ $t('sa02.colStatus') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="booking in data.todayBookings.items"
                :key="booking.id"
                data-clickable
                @click="navigateTo(`/admin/bookings/${booking.id}`)"
              >
                <td class="whitespace-nowrap tabular-nums">{{ clock(booking.slotStartTime) }}</td>
                <td>{{ booking.contactName }}</td>
                <td>{{ $t(`serviceType.${booking.serviceType}`) }}</td>
                <td><AyStatusTag :status="booking.status" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Can xu ly -->
      <section class="card gap-[11px]" style="background: #fff">
        <h5>{{ $t('sa02.todo') }}</h5>

        <NuxtLink to="/admin/bookings?status=PENDING" class="ay-todo">
          <span>{{ $t('sa02.todoPending') }}</span>
          <span>{{ data.stats.pendingBookings }} →</span>
        </NuxtLink>

        <NuxtLink to="/admin/quotations?status=SENT" class="ay-todo">
          <span>{{ $t('sa02.todoQuoting') }}</span>
          <span>{{ data.stats.awaitingQuotation }} →</span>
        </NuxtLink>

        <NuxtLink
          v-if="data.stats.lowStockCount > 0"
          to="/admin/inventory?lowStockOnly=true"
          class="ay-todo"
        >
          <span>{{ $t('sa02.todoLowStock') }}</span>
          <span>{{ data.stats.lowStockCount }} →</span>
        </NuxtLink>
      </section>
    </div>

    <!-- Doanh thu 7 ngay -->
    <section class="card gap-3" style="background: #fff">
      <h5>{{ $t('sa02.revenue7') }}</h5>
      <AyBarChart :data="revenueSeries" :aria-label="$t('sa02.revenueChart')" />
    </section>
  </div>
</template>

<style scoped>
.ay-todo {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-radius: 999px;
  background: var(--color-surface);
  padding: 10px 16px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text);
}
.ay-todo:hover {
  background: var(--color-accent-200);
  text-decoration: none;
}
</style>
