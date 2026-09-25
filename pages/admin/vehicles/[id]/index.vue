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
const { t } = useI18n();
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

if (!data.value?.vehicle) {
  throw createError({ statusCode: 404, statusMessage: t('sa20.notFound') });
}

setScreenTitle(() => t('sa20.title'));

const vehicle = computed(() => data.value!.vehicle);
const records = computed(() => data.value?.history.items ?? []);

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
      <span v-if="dueSoon" class="tag tag-accent">{{ $t('sa20.dueSoon') }}</span>
      <div class="ml-auto flex flex-wrap gap-2">
        <NuxtLink
          :to="`/admin/vehicles/${id}/edit`"
          class="btn btn-secondary text-[13px]"
          style="min-height: 44px"
        >
          {{ $t('common.edit') }}
        </NuxtLink>
        <NuxtLink
          :to="`/admin/bookings/new?vehicleId=${id}`"
          class="btn btn-primary text-[13px]"
          style="min-height: 44px"
        >
          {{ $t('sa20.bookFor') }}
        </NuxtLink>
      </div>
    </div>

    <div class="grid gap-3" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))">
      <div class="card elev-sm gap-0.5" style="background: #fff">
        <div class="card-kicker">{{ $t('sa20.visits') }}</div>
        <p class="font-heading text-[30px] leading-none">{{ stats.visits }}</p>
      </div>
      <div class="card elev-sm gap-0.5" style="background: #fff">
        <div class="card-kicker">{{ $t('sa16.totalSpent') }}</div>
        <p class="font-heading text-[30px] leading-none">{{ money(stats.totalSpent) }}</p>
      </div>
      <div class="card elev-sm gap-0.5" style="background: #fff">
        <div class="card-kicker">{{ $t('sa20.currentOdo') }}</div>
        <p class="font-heading text-[30px] leading-none">
          {{ number(vehicle.currentOdometer) }}
        </p>
      </div>
      <div class="card elev-sm gap-0.5" style="background: var(--color-accent-100)">
        <div class="card-kicker">{{ $t('sa20.nextService') }}</div>
        <p class="font-heading text-[22px] leading-[1.2]">
          {{ vehicle.nextServiceDueDate ? date(vehicle.nextServiceDueDate, 'yyyy/MM') : '—' }}
        </p>
        <p v-if="vehicle.nextServiceDueOdometer" class="text-muted text-[11.5px]">
          {{ $t('sc29.orKm', { km: number(vehicle.nextServiceDueOdometer) }) }}
        </p>
      </div>
    </div>

    <div class="grid gap-[13px]" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))">
      <section class="card gap-1.5" style="background: #fff">
        <div class="card-kicker">{{ $t('sa20.info') }}</div>
        <dl
          class="grid gap-2 text-[13px]"
          style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))"
        >
          <div>
            <dt class="text-muted block text-[11.5px]">{{ $t('sa16.colMakerModel') }}</dt>
            <dd>{{ vehicle.maker }} {{ vehicle.model }}</dd>
          </div>
          <div>
            <dt class="text-muted block text-[11.5px]">{{ $t('vehicle.fuel') }}</dt>
            <dd>{{ vehicle.fuelType ? $t(`fuelType.${vehicle.fuelType}`) : '—' }}</dd>
          </div>
          <div>
            <dt class="text-muted block text-[11.5px]">{{ $t('sa16.colPlate') }}</dt>
            <dd>{{ vehicle.plateNumber }}</dd>
          </div>
          <div>
            <dt class="text-muted block text-[11.5px]">{{ $t('sa19.colCc') }}</dt>
            <dd>{{ vehicle.engineCc ? `${vehicle.engineCc}cc` : '—' }}</dd>
          </div>
          <div>
            <dt class="text-muted block text-[11.5px]">{{ $t('sa16.colYear') }}</dt>
            <dd>{{ vehicle.modelYear ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-muted block text-[11.5px]">{{ $t('sa20.color') }}</dt>
            <dd>{{ vehicle.color ?? '—' }}</dd>
          </div>
        </dl>
        <p class="pt-2 text-[13px]" style="border-top: 1px solid var(--color-divider)">
          {{ $t('sa20.owner') }} <strong>{{ data.owner?.name ?? '—' }}</strong>
          <template v-if="data.owner"> · {{ data.owner.phone }} — </template>
          <NuxtLink :to="`/admin/customers/${vehicle.customerId}`">{{ $t('sa20.openCustomer') }}</NuxtLink>
        </p>
      </section>

      <section class="card gap-2.5" style="background: #fff">
        <div class="card-kicker">{{ $t('sa20.odoOverTime') }}</div>
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
        <p v-else class="text-muted text-[12.5px]">{{ $t('sa20.noOdo') }}</p>
      </section>
    </div>

    <section class="card gap-2.5" style="background: #fff; overflow-x: auto">
      <h5>{{ $t('sa20.history') }}</h5>
      <table class="table" style="min-width: 700px">
        <thead>
          <tr>
            <th>{{ $t('sa16.colDate') }}</th>
            <th>{{ $t('sa20.colOrder') }}</th>
            <th>{{ $t('sa20.colType') }}</th>
            <th>{{ $t('sa20.colItems') }}</th>
            <th>{{ $t('sa16.colOdometer') }}</th>
            <th class="text-right">{{ $t('sa09.colTotal') }}</th>
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
            <td>{{ $t(`serviceType.${record.type}`) }}</td>
            <td>{{ record.itemNames.join(', ') || '—' }}</td>
            <td>{{ record.odometer ? number(record.odometer) : '—' }}</td>
            <td class="text-right">{{ money(record.totalAmount) }}</td>
          </tr>
          <tr v-if="records.length === 0">
            <td colspan="6" class="text-muted py-6 text-center">{{ $t('sa20.noHistory') }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
