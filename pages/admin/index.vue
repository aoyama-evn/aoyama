<script setup lang="ts">
import type { Booking, DashboardStats, Inventory, Page } from '~/types/models';

/** SA-02 Bang dieu khien — FR-RPT-11. Bo cuc theo ban thiet ke man hinh. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();
const { i18n, money, time, number } = useFormat();

const storeId = computed(() => ui.activeStoreId ?? undefined);
const today = new Date().toISOString().slice(0, 10);

const { data, pending } = await useAsyncData(
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
        from: today,
        to: today,
        limit: 8,
        sortOrder: 'ASC',
      }),
      api.get<Inventory[]>('/admin/inventory/low-stock', { storeId: storeId.value }),
    ]);
    return { stats, pendingBookings, todayBookings, lowStock };
  },
  { watch: [storeId] },
);

const SERVICE_TYPE: Record<string, string> = {
  MAINTENANCE: 'Bảo dưỡng',
  REPAIR: 'Sửa chữa',
  BOTH: 'Cả hai',
};

useHead({ title: 'Bảng điều khiển — AOYAMA Admin' });
</script>

<template>
  <AyLoading v-if="pending" />

  <div v-else-if="data" class="flex flex-col gap-[18px]">
    <!-- CP-22 the chi so -->
    <div class="grid gap-[13px]" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))">
      <AyStatCard
        label="Lịch hẹn hôm nay"
        :value="data.stats.todayBookings"
        hint="theo cửa hàng đang chọn"
        to="/admin/bookings/calendar"
      />
      <AyStatCard
        label="Xe đang ở xưởng"
        :value="data.stats.openWorkOrders"
        :hint="`${data.stats.awaitingQuotation} chờ báo giá`"
        to="/admin/work-orders"
      />
      <AyStatCard
        label="Chờ thanh toán"
        :value="data.stats.unpaidWorkOrders"
        :hint="money(data.stats.todayRevenue) + ' đã thu hôm nay'"
        to="/admin/work-orders?paymentStatus=UNPAID"
      />
      <AyStatCard
        label="Cảnh báo tồn kho"
        :value="data.stats.lowStockCount"
        hint="mặt hàng dưới ngưỡng"
        :tone="data.stats.lowStockCount > 0 ? 'warning' : 'default'"
        to="/admin/inventory?lowStockOnly=true"
      />
    </div>

    <div class="grid gap-3.5" style="grid-template-columns: repeat(auto-fit, minmax(330px, 1fr))">
      <!-- Lich hen hom nay -->
      <section class="card gap-2.5" style="background: #fff">
        <div class="flex items-baseline justify-between">
          <h5>Lịch hẹn hôm nay</h5>
          <NuxtLink to="/admin/bookings" class="btn btn-ghost text-[12px]">Xem tất cả →</NuxtLink>
        </div>

        <AyEmptyState
          v-if="data.todayBookings.items.length === 0"
          title="Hôm nay chưa có lịch hẹn nào"
        />

        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr><th>Giờ</th><th>Khách</th><th>Dịch vụ</th><th>Trạng thái</th></tr>
            </thead>
            <tbody>
              <tr
                v-for="booking in data.todayBookings.items"
                :key="booking.id"
                data-clickable
                class="cursor-pointer"
                @click="navigateTo(`/admin/bookings/${booking.id}`)"
              >
                <td class="whitespace-nowrap tabular-nums">{{ booking.slotStartTime.slice(0, 5) }}</td>
                <td>{{ booking.contactName }}</td>
                <td>{{ SERVICE_TYPE[booking.serviceType] }}</td>
                <td><AyStatusTag :status="booking.status" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Cho xac nhan -->
      <section class="card gap-2.5" style="background: #fff">
        <div class="flex items-baseline justify-between">
          <h5>Chờ xác nhận</h5>
          <NuxtLink to="/admin/bookings?status=PENDING" class="btn btn-ghost text-[12px]">
            Xem tất cả →
          </NuxtLink>
        </div>

        <AyEmptyState
          v-if="data.pendingBookings.items.length === 0"
          title="Không có lịch hẹn nào chờ xác nhận"
          hint="Mọi yêu cầu đặt lịch đều đã được xử lý."
        />

        <ul v-else class="flex flex-col">
          <li
            v-for="booking in data.pendingBookings.items"
            :key="booking.id"
            class="flex items-center gap-3 py-2"
            style="border-bottom: 1px solid var(--color-divider)"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-[13.5px] font-semibold">{{ booking.contactName }}</p>
              <p class="truncate text-[11.5px] text-muted">
                {{ time(booking.scheduledAt) }} · {{ i18n(booking.store?.name ?? null) }}
              </p>
            </div>
            <NuxtLink
              :to="`/admin/bookings/${booking.id}`"
              class="btn btn-secondary text-[11.5px]"
              style="min-height: 32px"
            >
              Xác nhận
            </NuxtLink>
          </li>
        </ul>
      </section>
    </div>

    <!-- Canh bao ton kho -->
    <section v-if="data.lowStock.length" class="card gap-2.5" style="background: #fff">
      <div class="flex items-baseline justify-between">
        <h5>Phụ tùng sắp hết</h5>
        <NuxtLink to="/admin/inventory?lowStockOnly=true" class="btn btn-ghost text-[12px]">
          Quản lý kho →
        </NuxtLink>
      </div>
      <ul class="flex flex-wrap gap-2">
        <li v-for="row in data.lowStock.slice(0, 12)" :key="row.id" class="tag tag-accent">
          {{ i18n(row.part?.name ?? null) }} · còn {{ number(row.quantity) }}
        </li>
      </ul>
    </section>
  </div>
</template>
