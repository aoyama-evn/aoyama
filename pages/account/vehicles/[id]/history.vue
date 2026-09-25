<script setup lang="ts">
import type { Page, ServiceHistory, Store, Vehicle } from '~/types/models';

/**
 * SC-31 Lich su dich vu cua xe — FR-VEH-04, FR-VEH-05.
 * Ban thiet ke: dau trang la ten xe va moc bao duong de xuat, ba the loc
 * (tat ca / bao duong / sua chua) kem so luong, roi mot dong thoi gian.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const api = useApi();
const booking = useBookingStore();
const { date, money, number } = useFormat();

const id = route.params.id as string;

const { data } = await useAsyncData(`veh-history-${id}`, async () => {
  const [vehicle, history, stores] = await Promise.all([
    api.get<Vehicle>(`/account/vehicles/${id}`),
    api.get<Page<ServiceHistory>>(`/account/vehicles/${id}/history`, { limit: 100 }),
    api.get<Store[]>('/stores'),
  ]);
  return { vehicle, history, stores };
});

const vehicle = computed(() => data.value?.vehicle ?? null);
const records = computed(() => data.value?.history.items ?? []);

const filter = ref<'ALL' | 'MAINTENANCE' | 'REPAIR'>('ALL');

const counts = computed(() => ({
  ALL: records.value.length,
  MAINTENANCE: records.value.filter((r) => r.type === 'MAINTENANCE').length,
  REPAIR: records.value.filter((r) => r.type === 'REPAIR').length,
}));

const visible = computed(() =>
  filter.value === 'ALL' ? records.value : records.value.filter((r) => r.type === filter.value),
);

const TABS = [
  { value: 'ALL' as const, label: 'Tất cả' },
  { value: 'MAINTENANCE' as const, label: 'Bảo dưỡng' },
  { value: 'REPAIR' as const, label: 'Sửa chữa' },
];

const TYPE_LABELS: Record<string, string> = {
  MAINTENANCE: 'Bảo dưỡng',
  REPAIR: 'Sửa chữa',
  INSPECTION: 'Kiểm tra',
  PACKAGE: 'Gói dịch vụ',
};

function storeName(storeId: string): string {
  const found = (data.value?.stores ?? []).find((s) => s.id === storeId);
  return found ? (found.name.vi ?? found.name.ja ?? '') : '';
}

async function bookAgain(): Promise<void> {
  if (!vehicle.value) return;
  booking.restore();
  booking.setVehicle(vehicle.value);
  await navigateTo('/booking/step1');
}

useHead({ title: 'Lịch sử dịch vụ' });
</script>

<template>
  <div v-if="vehicle" class="flex flex-col gap-3.5 pb-4 pt-1">
    <div>
      <h4 class="mb-1">{{ vehicle.maker }} {{ vehicle.model }}</h4>
      <p class="text-muted text-[12px]">
        {{ vehicle.plateNumber }}
        <template v-if="vehicle.currentOdometer !== null">
          · {{ number(vehicle.currentOdometer) }} km
        </template>
      </p>
      <p
        v-if="vehicle.nextServiceDueDate || vehicle.nextServiceDueOdometer"
        class="mt-1.5 text-[12.5px]"
        style="color: var(--color-accent-2-800)"
      >
        Bảo dưỡng tiếp theo đề xuất:
        <template v-if="vehicle.nextServiceDueDate">
          {{ date(vehicle.nextServiceDueDate, 'yyyy/MM') }}
        </template>
        <template v-if="vehicle.nextServiceDueOdometer">
          hoặc {{ number(vehicle.nextServiceDueOdometer) }} km
        </template>
      </p>
    </div>

    <div
      class="flex items-center gap-2.5"
      style="border-bottom: 1.5px solid var(--color-divider)"
      role="tablist"
    >
      <button
        v-for="tab in TABS"
        :key="tab.value"
        type="button"
        role="tab"
        :aria-selected="filter === tab.value"
        class="ay-tab"
        :class="filter === tab.value ? 'ay-tab-on' : ''"
        @click="filter = tab.value"
      >
        {{ tab.label }} <span style="opacity: 0.6">{{ counts[tab.value] }}</span>
      </button>
    </div>

    <AyEmptyState
      v-if="visible.length === 0"
      title="Chưa có lần dịch vụ nào trong nhóm này"
      hint="Lịch sử được ghi tự động sau mỗi lần bảo dưỡng hoặc sửa chữa tại cửa hàng."
    />

    <div v-for="(record, index) in visible" :key="record.id" class="flex gap-[13px]">
      <span class="flex w-[26px] flex-none flex-col items-center">
        <span
          class="rounded-full"
          style="width: 14px; height: 14px; background: var(--color-accent-2-600)"
        />
        <span
          v-if="index < visible.length - 1"
          class="w-0.5 flex-1"
          style="background: var(--color-accent-2-400); min-height: 20px"
        />
      </span>

      <component
        :is="record.workOrderId ? 'NuxtLink' : 'div'"
        :to="record.workOrderId ? `/service-records/${record.workOrderId}` : undefined"
        class="flex flex-1 flex-col gap-1"
        :class="index < visible.length - 1 ? 'pb-3.5' : ''"
      >
        <span class="text-[13.5px] font-semibold">
          {{ date(record.servicedAt) }} · {{ TYPE_LABELS[record.type] ?? record.type }}
        </span>
        <span class="text-muted text-[11.5px]">
          {{ storeName(record.storeId) }}
          <template v-if="record.odometer"> · {{ number(record.odometer) }} km</template>
        </span>
        <span class="text-[12.5px]">
          {{ record.itemNames.length ? record.itemNames.join(', ') : record.summary }}
        </span>
        <span class="mt-0.5 flex items-center gap-2">
          <strong class="text-[13px]">{{ money(record.totalAmount) }}</strong>
          <span
            class="whitespace-nowrap text-[11px] font-bold"
            style="color: var(--color-accent-2-700)"
          >
            Đã hoàn tất
          </span>
        </span>
      </component>
    </div>

    <button
      type="button"
      class="btn btn-primary btn-block text-[14px]"
      style="min-height: 46px; margin: 0"
      @click="bookAgain"
    >
      Đặt lịch cho xe này
    </button>

    <NuxtLink to="/account/vehicles" class="btn btn-ghost self-center text-[13px]">
      ← Xe của tôi
    </NuxtLink>
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
