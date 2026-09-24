<script setup lang="ts">
import type { Booking, DashboardStats, Inventory, Page } from '~/types/models';

/** SA-02 Bang dieu khien — FR-RPT-11. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { i18n, money, dateTime, number } = useFormat();

const storeId = computed(() => ui.activeStoreId ?? undefined);

const { data, pending, refresh } = await useAsyncData(
  'admin-dashboard',
  async () => {
    const [stats, pendingBookings, todayBookings, lowStock] = await Promise.all([
      api.get<DashboardStats>('/admin/reports/dashboard', { storeId: storeId.value }),
      api.get<Page<Booking>>('/admin/bookings', {
        status: 'PENDING',
        storeId: storeId.value,
        limit: 5,
        sortOrder: 'ASC',
      }),
      api.get<Page<Booking>>('/admin/bookings', {
        storeId: storeId.value,
        from: new Date().toISOString().slice(0, 10),
        to: new Date().toISOString().slice(0, 10),
        limit: 10,
        sortOrder: 'ASC',
      }),
      api.get<Inventory[]>('/admin/inventory/low-stock', { storeId: storeId.value }),
    ]);
    return { stats, pendingBookings, todayBookings, lowStock };
  },
  { watch: [storeId] },
);

useHead({ title: 'Bảng điều khiển — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-5">
    <AyPageHeader code="SA-02" title="Bảng điều khiển" :description="`Số liệu ngày ${data?.stats.date ?? ''}`">
      <template #actions>
        <AyButton variant="secondary" size="sm" @click="refresh()">Làm mới</AyButton>
        <AyButton to="/admin/scan" size="sm">Quét mã QR</AyButton>
      </template>
    </AyPageHeader>

    <AyLoading v-if="pending" />

    <template v-else-if="data">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AyStatCard
          label="Lịch hẹn hôm nay" :value="data.stats.todayBookings"
          to="/admin/bookings/calendar"
        />
        <AyStatCard
          label="Chờ xác nhận" :value="data.stats.pendingBookings"
          :tone="data.stats.pendingBookings > 0 ? 'warning' : 'default'"
          hint="Cần xác nhận để sinh mã QR"
          to="/admin/bookings?status=PENDING"
        />
        <AyStatCard
          label="Phiếu đang mở" :value="data.stats.openWorkOrders" to="/admin/work-orders"
        />
        <AyStatCard
          label="Chờ khách duyệt báo giá" :value="data.stats.awaitingQuotation"
          to="/admin/quotations?status=SENT"
        />
        <AyStatCard label="Doanh thu hôm nay" :value="money(data.stats.todayRevenue)" to="/admin/reports/revenue" />
        <AyStatCard
          label="Phiếu chưa thu đủ" :value="data.stats.unpaidWorkOrders"
          :tone="data.stats.unpaidWorkOrders > 0 ? 'danger' : 'default'"
          to="/admin/work-orders?paymentStatus=UNPAID"
        />
        <AyStatCard
          label="Phụ tùng sắp hết" :value="data.stats.lowStockCount"
          :tone="data.stats.lowStockCount > 0 ? 'warning' : 'default'"
          to="/admin/inventory?lowStockOnly=true"
        />
        <AyStatCard label="Xem báo cáo" value="→" hint="Tổng hợp, doanh thu, phụ tùng" to="/admin/reports" />
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <section class="ay-card">
          <div class="mb-3 flex items-baseline justify-between">
            <h2 class="font-heading text-[16px]">Chờ xác nhận</h2>
            <NuxtLink to="/admin/bookings?status=PENDING" class="ay-btn ay-btn-ghost ay-btn-sm">Xem tất cả →</NuxtLink>
          </div>

          <AyEmptyState
            v-if="data.pendingBookings.items.length === 0"
            title="Không có lịch hẹn nào chờ xác nhận"
            hint="Mọi yêu cầu đặt lịch đều đã được xử lý."
          />

          <ul v-else class="flex flex-col gap-1.5">
            <li v-for="booking in data.pendingBookings.items" :key="booking.id">
              <NuxtLink :to="`/admin/bookings/${booking.id}`" class="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-accent-100">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-[14px] font-semibold">{{ booking.contactName }}</p>
                  <p class="truncate text-[12px] ay-muted">
                    {{ dateTime(booking.scheduledAt) }} · {{ i18n(booking.store?.name ?? null) }}
                  </p>
                </div>
                <span class="font-mono text-[11.5px] ay-muted">{{ booking.code }}</span>
              </NuxtLink>
            </li>
          </ul>
        </section>

        <section class="ay-card">
          <div class="mb-3 flex items-baseline justify-between">
            <h2 class="font-heading text-[16px]">Lịch hôm nay</h2>
            <NuxtLink to="/admin/bookings/calendar" class="ay-btn ay-btn-ghost ay-btn-sm">Xem lịch →</NuxtLink>
          </div>

          <AyEmptyState
            v-if="data.todayBookings.items.length === 0"
            title="Hôm nay chưa có lịch hẹn nào"
          />

          <ul v-else class="flex flex-col gap-1.5">
            <li v-for="booking in data.todayBookings.items" :key="booking.id">
              <NuxtLink :to="`/admin/bookings/${booking.id}`" class="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-accent-100">
                <span class="font-heading text-[14px] tabular-nums">{{ booking.slotStartTime.slice(0, 5) }}</span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-[14px]">{{ booking.contactName }}</p>
                  <p class="truncate text-[12px] ay-muted">
                    {{ booking.vehicle?.plateNumber ?? 'Chưa khai báo xe' }}
                  </p>
                </div>
                <AyStatusTag :status="booking.status" />
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>

      <section v-if="data.lowStock.length" class="ay-card">
        <div class="mb-3 flex items-baseline justify-between">
          <h2 class="font-heading text-[16px]">Phụ tùng sắp hết</h2>
          <NuxtLink to="/admin/inventory?lowStockOnly=true" class="ay-btn ay-btn-ghost ay-btn-sm">Quản lý kho →</NuxtLink>
        </div>
        <ul class="flex flex-wrap gap-2">
          <li
            v-for="row in data.lowStock.slice(0, 12)" :key="row.id"
            class="ay-tag bg-warning-bg text-warning"
          >
            {{ i18n(row.part?.name ?? null) }} · còn {{ number(row.quantity) }}
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
