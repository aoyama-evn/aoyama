<script setup lang="ts">
import type { Booking, CustomerProfile, Page, Vehicle } from '~/types/models';

/** SA-16 Chi tiet khach hang — FR-CUS-03, FR-CUS-05. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { date, dateTime, number } = useFormat();

const id = route.params.id as string;

const { data } = await useAsyncData(`admin-customer-${id}`, async () => {
  const [customer, vehicles, bookings] = await Promise.all([
    api.get<CustomerProfile>(`/admin/customers/${id}`),
    api.get<Page<Vehicle>>('/admin/vehicles', { customerId: id, limit: 50 }),
    api.get<Page<Booking>>('/admin/bookings', { keyword: id, limit: 10 }).catch(() => null),
  ]);
  return { customer, vehicles, bookings };
});

if (!data.value?.customer) {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy khách hàng' });
}

const note = ref(data.value.customer.internalNote ?? '');

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
  <div v-if="data" class="flex flex-col gap-4">
    <AyPageHeader code="SA-16" :title="data.customer.name" back-to="/admin/customers">
      <template #actions>
        <AyButton :to="`/admin/customers/${id}/edit`" variant="secondary" size="sm">Sửa hồ sơ</AyButton>
        <AyButton :to="`/admin/bookings/new?customerId=${id}`" size="sm">Đặt lịch thay khách</AyButton>
      </template>
    </AyPageHeader>

    <div class="grid gap-4 lg:grid-cols-3">
      <section class="ay-card lg:col-span-2">
        <h2 class="mb-2 font-heading text-[16px]">Thông tin</h2>
        <dl class="grid gap-2 text-[14px] sm:grid-cols-2">
          <div><dt class="ay-muted">Điện thoại</dt><dd>{{ data.customer.phone }}</dd></div>
          <div><dt class="ay-muted">Email</dt><dd>{{ data.customer.email ?? '—' }}</dd></div>
          <div><dt class="ay-muted">Tên kana</dt><dd>{{ data.customer.nameKana ?? '—' }}</dd></div>
          <div><dt class="ay-muted">Địa chỉ</dt><dd>{{ data.customer.address ?? '—' }}</dd></div>
          <div><dt class="ay-muted">Ngôn ngữ</dt><dd>{{ data.customer.language }}</dd></div>
          <div><dt class="ay-muted">Loại</dt><dd>{{ data.customer.isGuest ? 'Khách vãng lai' : 'Đã đăng ký' }}</dd></div>
          <div><dt class="ay-muted">Nhận SMS</dt><dd>{{ data.customer.notifySms ? 'Có' : 'Không' }}</dd></div>
          <div><dt class="ay-muted">Ngày tạo</dt><dd>{{ date(data.customer.createdAt) }}</dd></div>
        </dl>
      </section>

      <section class="ay-card">
        <h2 class="mb-2 font-heading text-[16px]">Ghi chú nội bộ</h2>
        <textarea v-model="note" class="ay-input min-h-[120px]" placeholder="Chỉ nhân viên thấy" />
        <AyButton variant="secondary" size="sm" class="mt-2" @click="saveNote">Lưu ghi chú</AyButton>
      </section>
    </div>

    <section class="ay-card">
      <div class="mb-3 flex items-baseline justify-between">
        <h2 class="font-heading text-[16px]">Phương tiện ({{ data.vehicles.items.length }})</h2>
        <NuxtLink :to="`/admin/vehicles/new/edit?customerId=${id}`" class="ay-btn ay-btn-ghost ay-btn-sm">
          + Thêm xe
        </NuxtLink>
      </div>

      <AyEmptyState v-if="data.vehicles.items.length === 0" title="Khách chưa có xe nào trong hệ thống" />

      <ul v-else class="grid gap-2 sm:grid-cols-2">
        <li v-for="vehicle in data.vehicles.items" :key="vehicle.id">
          <NuxtLink
            :to="`/admin/vehicles/${vehicle.id}`"
            class="flex items-center gap-3 rounded-xl border border-neutral-300 px-3 py-2.5 hover:bg-accent-100"
          >
            <span class="flex-1">
              <span class="block font-heading text-[15px]">{{ vehicle.plateNumber }}</span>
              <span class="block text-[12.5px] ay-muted">{{ vehicle.maker }} {{ vehicle.model }}</span>
            </span>
            <span class="text-[12.5px] ay-muted">{{ number(vehicle.currentOdometer) }} km</span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section v-if="data.bookings?.items.length" class="ay-card">
      <h2 class="mb-3 font-heading text-[16px]">Lịch hẹn gần đây</h2>
      <ul class="flex flex-col gap-1.5">
        <li v-for="booking in data.bookings.items" :key="booking.id">
          <NuxtLink
            :to="`/admin/bookings/${booking.id}`"
            class="flex items-center gap-3 rounded-xl px-2 py-2 text-[13.5px] hover:bg-accent-100"
          >
            <span class="font-mono text-[12px]">{{ booking.code }}</span>
            <span class="flex-1">{{ dateTime(booking.scheduledAt) }}</span>
            <AyStatusTag :status="booking.status" />
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
