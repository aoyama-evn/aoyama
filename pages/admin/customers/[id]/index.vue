<script setup lang="ts">
import type { Booking, CustomerProfile, Page, Vehicle, WorkOrder } from '~/types/models';

/**
 * SA-16 Chi tiet khach hang — FR-CUS-03, FR-CUS-05.
 * Ban thiet ke: hang ten kem nut hanh dong, bon the chi so, the thong tin ca
 * nhan, hang the chuyen muc, bang phuong tien, va o ghi chu noi bo.
 */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { date, money, number } = useFormat();

const id = route.params.id as string;

const { data } = await useAsyncData(`admin-customer-${id}`, async () => {
  const [customer, vehicles, bookings, workOrders] = await Promise.all([
    api.get<CustomerProfile>(`/admin/customers/${id}`),
    api.get<Page<Vehicle>>('/admin/vehicles', { customerId: id, limit: 50 }),
    api.get<Page<Booking>>('/admin/bookings', { keyword: id, limit: 20 }).catch(() => null),
    api
      .get<Page<WorkOrder>>('/admin/work-orders', { customerId: id, limit: 50 })
      .catch(() => null),
  ]);
  return { customer, vehicles, bookings, workOrders };
});

if (!data.value?.customer) {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy khách hàng' });
}

setScreenTitle('Chi tiết khách hàng');

const note = ref(data.value.customer.internalNote ?? '');
const tab = ref<'VEHICLES' | 'BOOKINGS' | 'WORK_ORDERS'>('VEHICLES');

const LANGUAGES: Record<string, string> = { ja: 'Tiếng Nhật', en: 'Tiếng Anh', vi: 'Tiếng Việt' };

/** Bon the chi so o dau man hinh. */
const stats = computed(() => {
  const orders = data.value?.workOrders?.items ?? [];
  const totalSpent = orders.reduce((sum, wo) => sum + wo.paidAmount, 0);
  const lastAt = orders.map((wo) => wo.completedAt ?? wo.createdAt).sort().at(-1) ?? null;
  return {
    visits: orders.length,
    totalSpent,
    lastAt,
    vehicles: data.value?.vehicles.items.length ?? 0,
  };
});

async function saveNote(): Promise<void> {
  try {
    await api.put(`/admin/customers/${id}`, { internalNote: note.value });
    ui.success('Đã lưu ghi chú');
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

useHead({ title: `${data.value.customer.name} — AOYAMA Admin` });
</script>

<template>
  <div v-if="data" class="flex flex-col gap-3.5">
    <div class="flex flex-wrap items-center gap-2.5">
      <p class="font-heading text-[21px]">{{ data.customer.name }}</p>
      <span class="tag" :class="data.customer.isGuest ? 'tag-neutral' : 'tag-accent-2'">
        {{ data.customer.isGuest ? 'Khách vãng lai' : 'Đang hoạt động' }}
      </span>
      <div class="ml-auto flex flex-wrap gap-2">
        <NuxtLink
          :to="`/admin/customers/${id}/edit`"
          class="btn btn-secondary text-[13px]"
          style="min-height: 44px"
        >
          Sửa
        </NuxtLink>
        <NuxtLink
          :to="`/admin/bookings/new?customerId=${id}`"
          class="btn btn-primary text-[13px]"
          style="min-height: 44px"
        >
          Đặt lịch cho khách này
        </NuxtLink>
      </div>
    </div>

    <div class="grid gap-3" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))">
      <div class="card elev-sm gap-0.5" style="background: #fff">
        <div class="card-kicker">Lần dùng dịch vụ</div>
        <p class="font-heading text-[30px] leading-none">{{ stats.visits }}</p>
      </div>
      <div class="card elev-sm gap-0.5" style="background: #fff">
        <div class="card-kicker">Tổng chi tiêu</div>
        <p class="font-heading text-[30px] leading-none">{{ money(stats.totalSpent) }}</p>
      </div>
      <div class="card elev-sm gap-0.5" style="background: #fff">
        <div class="card-kicker">Gần nhất</div>
        <p class="font-heading text-[22px] leading-[1.2]">
          {{ stats.lastAt ? date(stats.lastAt) : '—' }}
        </p>
      </div>
      <div class="card elev-sm gap-0.5" style="background: #fff">
        <div class="card-kicker">Số xe</div>
        <p class="font-heading text-[30px] leading-none">{{ stats.vehicles }}</p>
      </div>
    </div>

    <section class="card gap-1.5" style="background: #fff">
      <div class="card-kicker">Thông tin cá nhân</div>
      <dl
        class="grid gap-2 text-[13px]"
        style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))"
      >
        <div>
          <dt class="text-muted block text-[11.5px]">Điện thoại</dt>
          <dd>{{ data.customer.phone }}</dd>
        </div>
        <div>
          <dt class="text-muted block text-[11.5px]">Email</dt>
          <dd>{{ data.customer.email ?? '—' }}</dd>
        </div>
        <div>
          <dt class="text-muted block text-[11.5px]">Địa chỉ</dt>
          <dd>{{ data.customer.address ?? '—' }}</dd>
        </div>
        <div>
          <dt class="text-muted block text-[11.5px]">Ngôn ngữ ưa dùng</dt>
          <dd>{{ LANGUAGES[data.customer.language] ?? data.customer.language }}</dd>
        </div>
      </dl>
    </section>

    <div
      class="flex items-center gap-2.5"
      style="border-bottom: 1.5px solid var(--color-divider)"
      role="tablist"
    >
      <button
        type="button"
        role="tab"
        class="ay-tab"
        :class="tab === 'VEHICLES' ? 'ay-tab-on' : ''"
        :aria-selected="tab === 'VEHICLES'"
        @click="tab = 'VEHICLES'"
      >
        Phương tiện <span style="opacity: 0.6">{{ data.vehicles.items.length }}</span>
      </button>
      <button
        type="button"
        role="tab"
        class="ay-tab"
        :class="tab === 'BOOKINGS' ? 'ay-tab-on' : ''"
        :aria-selected="tab === 'BOOKINGS'"
        @click="tab = 'BOOKINGS'"
      >
        Lịch hẹn <span style="opacity: 0.6">{{ data.bookings?.items.length ?? 0 }}</span>
      </button>
      <button
        type="button"
        role="tab"
        class="ay-tab"
        :class="tab === 'WORK_ORDERS' ? 'ay-tab-on' : ''"
        :aria-selected="tab === 'WORK_ORDERS'"
        @click="tab = 'WORK_ORDERS'"
      >
        Phiếu dịch vụ <span style="opacity: 0.6">{{ data.workOrders?.items.length ?? 0 }}</span>
      </button>
    </div>

    <div class="table-wrap">
      <table v-if="tab === 'VEHICLES'" class="table" style="min-width: 600px">
        <thead>
          <tr>
            <th>Biển số</th><th>Hãng · dòng</th><th>Số km</th><th>Đời xe</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="vehicle in data.vehicles.items"
            :key="vehicle.id"
            data-clickable
            @click="navigateTo(`/admin/vehicles/${vehicle.id}`)"
          >
            <td>{{ vehicle.plateNumber }}</td>
            <td>{{ vehicle.maker }} {{ vehicle.model }}</td>
            <td>{{ number(vehicle.currentOdometer) }}</td>
            <td>{{ vehicle.modelYear ?? '—' }}</td>
          </tr>
          <tr v-if="data.vehicles.items.length === 0">
            <td colspan="4" class="text-muted py-6 text-center">Khách chưa có xe nào</td>
          </tr>
        </tbody>
      </table>

      <table v-else-if="tab === 'BOOKINGS'" class="table" style="min-width: 600px">
        <thead>
          <tr><th>Mã</th><th>Thời gian</th><th>Dịch vụ</th><th>Trạng thái</th></tr>
        </thead>
        <tbody>
          <tr
            v-for="booking in data.bookings?.items ?? []"
            :key="booking.id"
            data-clickable
            @click="navigateTo(`/admin/bookings/${booking.id}`)"
          >
            <td class="font-mono text-[12.5px]">{{ booking.code }}</td>
            <td>{{ date(booking.scheduledAt) }}</td>
            <td>{{ (booking.services ?? []).map((s) => s.serviceName).join(', ') || '—' }}</td>
            <td><AyStatusTag :status="booking.status" /></td>
          </tr>
          <tr v-if="(data.bookings?.items ?? []).length === 0">
            <td colspan="4" class="text-muted py-6 text-center">Chưa có lịch hẹn nào</td>
          </tr>
        </tbody>
      </table>

      <table v-else class="table" style="min-width: 600px">
        <thead>
          <tr><th>Mã phiếu</th><th>Ngày</th><th>Tổng tiền</th><th>Trạng thái</th></tr>
        </thead>
        <tbody>
          <tr
            v-for="order in data.workOrders?.items ?? []"
            :key="order.id"
            data-clickable
            @click="navigateTo(`/admin/work-orders/${order.id}`)"
          >
            <td class="font-mono text-[12.5px]">{{ order.code }}</td>
            <td>{{ date(order.createdAt) }}</td>
            <td>{{ money(order.totalAmount) }}</td>
            <td><AyStatusTag :status="order.status" /></td>
          </tr>
          <tr v-if="(data.workOrders?.items ?? []).length === 0">
            <td colspan="4" class="text-muted py-6 text-center">Chưa có phiếu dịch vụ nào</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="grid gap-[13px]" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))">
      <section class="card gap-[7px]" style="background: #fff">
        <h5>Ghi chú nội bộ</h5>
        <textarea
          v-model="note"
          class="input"
          style="min-height: 70px"
          placeholder="Chỉ nhân viên thấy nội dung này"
        />
        <button type="button" class="btn btn-secondary self-end text-[12.5px]" @click="saveNote">
          Lưu ghi chú
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.ay-tab {
  border-radius: 0;
  padding: 8px 2px 9px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-neutral-700);
}
.ay-tab-on {
  font-weight: 700;
  color: var(--color-accent-700);
  box-shadow: inset 0 -2.5px 0 var(--color-accent);
}
</style>
