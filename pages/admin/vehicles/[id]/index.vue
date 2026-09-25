<script setup lang="ts">
import type { CustomerProfile, Page, ServiceHistory, Vehicle } from '~/types/models';

/**
 * SA-20 Chi tiet phuong tien va lich su — FR-VEH-10.
 * Ban thiet ke: hang ten xe kem nut hanh dong, bon the chi so (the "Bao duong
 * tiep theo" dung nen accent-100), the thong tin xe, bieu do so km theo thoi
 * gian, va bang lich su dich vu.
 */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const { date, money, number } = useFormat();

const id = route.params.id as string;

const { data } = await useAsyncData(`admin-vehicle-${id}`, async () => {
  const vehicle = await api.get<Vehicle>(`/admin/vehicles/${id}`);
  const [history, owner] = await Promise.all([
    api.get<Page<ServiceHistory>>(`/admin/vehicles/${id}/history`, { limit: 50 }),
    api.get<CustomerProfile>(`/admin/customers/${vehicle.customerId}`).catch(() => null),
  ]);
  return { vehicle, history, owner };
});

if (!data.value?.vehicle) throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy xe' });

setScreenTitle('Chi tiết phương tiện');

const vehicle = computed(() => data.value!.vehicle);
const records = computed(() => data.value?.history.items ?? []);

const FUEL_LABELS: Record<string, string> = {
  GASOLINE: 'Xăng',
  ELECTRIC: 'Điện',
  HYBRID: 'Hybrid',
};

const TYPE_LABELS: Record<string, string> = {
  MAINTENANCE: 'Bảo dưỡng',
  REPAIR: 'Sửa chữa',
  INSPECTION: 'Kiểm tra',
  PACKAGE: 'Gói dịch vụ',
};

const stats = computed(() => ({
  visits: records.value.length,
  totalSpent: records.value.reduce((sum, r) => sum + r.totalAmount, 0),
}));

/** Bon moc so km gan nhat, ve thanh cot don gian nhu ban thiet ke. */
const odometerBars = computed(() => {
  const points = records.value
    .filter((r) => r.odometer !== null)
    .slice(0, 4)
    .reverse() as (ServiceHistory & { odometer: number })[];
  const max = Math.max(1, ...points.map((p) => p.odometer));
  return points.map((p) => ({
    label: date(p.servicedAt, 'yyyy/MM'),
    value: p.odometer,
    height: Math.round((p.odometer / max) * 100),
  }));
});

const dueSoon = computed(() => {
  const due = vehicle.value.nextServiceDueDate;
  if (!due) return false;
  return new Date(due).getTime() - Date.now() < 30 * 86_400_000;
});

useHead({ title: `${data.value.vehicle.plateNumber} — AOYAMA Admin` });
</script>

<template>
  <div v-if="data" class="flex flex-col gap-3.5">
    <div class="flex flex-wrap items-center gap-2.5">
      <p class="font-heading text-[21px]">
        {{ vehicle.maker }} {{ vehicle.model }} · {{ vehicle.plateNumber }}
      </p>
      <span v-if="dueSoon" class="tag tag-accent">Đến hạn bảo dưỡng</span>
      <div class="ml-auto flex flex-wrap gap-2">
        <NuxtLink
          :to="`/admin/vehicles/${id}/edit`"
          class="btn btn-secondary text-[13px]"
          style="min-height: 44px"
        >
          Sửa
        </NuxtLink>
        <NuxtLink
          :to="`/admin/bookings/new?vehicleId=${id}`"
          class="btn btn-primary text-[13px]"
          style="min-height: 44px"
        >
          Đặt lịch cho xe này
        </NuxtLink>
      </div>
    </div>

    <div class="grid gap-3" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))">
      <div class="card elev-sm gap-0.5" style="background: #fff">
        <div class="card-kicker">Lần dịch vụ</div>
        <p class="font-heading text-[30px] leading-none">{{ stats.visits }}</p>
      </div>
      <div class="card elev-sm gap-0.5" style="background: #fff">
        <div class="card-kicker">Tổng chi tiêu</div>
        <p class="font-heading text-[30px] leading-none">{{ money(stats.totalSpent) }}</p>
      </div>
      <div class="card elev-sm gap-0.5" style="background: #fff">
        <div class="card-kicker">Số km hiện tại</div>
        <p class="font-heading text-[30px] leading-none">
          {{ number(vehicle.currentOdometer) }}
        </p>
      </div>
      <div class="card elev-sm gap-0.5" style="background: var(--color-accent-100)">
        <div class="card-kicker">Bảo dưỡng tiếp theo</div>
        <p class="font-heading text-[22px] leading-[1.2]">
          {{ vehicle.nextServiceDueDate ? date(vehicle.nextServiceDueDate, 'yyyy/MM') : '—' }}
        </p>
        <p v-if="vehicle.nextServiceDueOdometer" class="text-muted text-[11.5px]">
          hoặc {{ number(vehicle.nextServiceDueOdometer) }} km
        </p>
      </div>
    </div>

    <div class="grid gap-[13px]" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))">
      <section class="card gap-1.5" style="background: #fff">
        <div class="card-kicker">Thông tin xe</div>
        <dl
          class="grid gap-2 text-[13px]"
          style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))"
        >
          <div>
            <dt class="text-muted block text-[11.5px]">Hãng · dòng</dt>
            <dd>{{ vehicle.maker }} {{ vehicle.model }}</dd>
          </div>
          <div>
            <dt class="text-muted block text-[11.5px]">Nhiên liệu</dt>
            <dd>{{ FUEL_LABELS[vehicle.fuelType] ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-muted block text-[11.5px]">Biển số</dt>
            <dd>{{ vehicle.plateNumber }}</dd>
          </div>
          <div>
            <dt class="text-muted block text-[11.5px]">Dung tích</dt>
            <dd>{{ vehicle.engineCc ? `${vehicle.engineCc}cc` : '—' }}</dd>
          </div>
          <div>
            <dt class="text-muted block text-[11.5px]">Đời xe</dt>
            <dd>{{ vehicle.modelYear ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-muted block text-[11.5px]">Màu</dt>
            <dd>{{ vehicle.color ?? '—' }}</dd>
          </div>
        </dl>
        <p class="pt-2 text-[13px]" style="border-top: 1px solid var(--color-divider)">
          Chủ sở hữu: <strong>{{ data.owner?.name ?? '—' }}</strong>
          <template v-if="data.owner"> · {{ data.owner.phone }} — </template>
          <NuxtLink :to="`/admin/customers/${vehicle.customerId}`">mở hồ sơ khách</NuxtLink>
        </p>
      </section>

      <section class="card gap-2.5" style="background: #fff">
        <div class="card-kicker">Số km theo thời gian</div>
        <div v-if="odometerBars.length" class="flex items-end gap-3" style="height: 104px">
          <div
            v-for="bar in odometerBars"
            :key="bar.label"
            class="flex flex-1 flex-col items-center justify-end gap-1.5"
          >
            <span
              class="w-full"
              style="background: var(--color-accent-300); border-radius: 8px 8px 0 0"
              :style="{ height: `${bar.height}%` }"
            />
            <span class="text-muted text-[10.5px]">{{ bar.label }}</span>
          </div>
        </div>
        <p v-if="odometerBars.length" class="text-muted text-[11.5px]">
          {{ odometerBars.map((b) => number(b.value)).join(' → ') }} km
        </p>
        <p v-else class="text-muted text-[12.5px]">Chưa có mốc số km nào được ghi.</p>
      </section>
    </div>

    <section class="card gap-2.5" style="background: #fff; overflow-x: auto">
      <h5>Lịch sử dịch vụ</h5>
      <table class="table" style="min-width: 700px">
        <thead>
          <tr>
            <th>Ngày</th><th>Phiếu</th><th>Loại</th><th>Hạng mục</th><th>Số km</th>
            <th class="text-right">Tổng tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="record in records"
            :key="record.id"
            :data-clickable="record.workOrderId ? '' : undefined"
            @click="record.workOrderId && navigateTo(`/admin/work-orders/${record.workOrderId}`)"
          >
            <td class="whitespace-nowrap">{{ date(record.servicedAt) }}</td>
            <td class="whitespace-nowrap tabular-nums">{{ record.summary }}</td>
            <td>{{ TYPE_LABELS[record.type] ?? record.type }}</td>
            <td>{{ record.itemNames.join(', ') || '—' }}</td>
            <td>{{ record.odometer ? number(record.odometer) : '—' }}</td>
            <td class="text-right">{{ money(record.totalAmount) }}</td>
          </tr>
          <tr v-if="records.length === 0">
            <td colspan="6" class="text-muted py-6 text-center">Xe chưa có lịch sử dịch vụ</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
