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
const { t } = useI18n();
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
  throw createError({ statusCode: 404, statusMessage: t('sa16.notFound') });
}

setScreenTitle(() => t('sa16.title'));

const note = ref(data.value.customer.internalNote ?? '');
const tab = ref<'VEHICLES' | 'BOOKINGS' | 'WORK_ORDERS'>('VEHICLES');

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
    ui.success(t('sa05.noteSaved'));
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
        {{ data.customer.isGuest ? $t('sa15.guest') : $t('sa16.active') }}
      </span>
      <div class="ml-auto flex flex-wrap gap-2">
        <NuxtLink
          :to="`/admin/customers/${id}/edit`"
          class="btn btn-secondary text-[13px]"
          style="min-height: 44px"
        >
          {{ $t('common.edit') }}
        </NuxtLink>
        <NuxtLink
          :to="`/admin/bookings/new?customerId=${id}`"
          class="btn btn-primary text-[13px]"
          style="min-height: 44px"
        >
          {{ $t('sa16.bookFor') }}
        </NuxtLink>
      </div>
    </div>

    <div class="grid gap-3" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))">
      <div class="card elev-sm gap-0.5" style="background: #fff">
        <div class="card-kicker">{{ $t('sa16.visits') }}</div>
        <p class="font-heading text-[30px] leading-none">{{ stats.visits }}</p>
      </div>
      <div class="card elev-sm gap-0.5" style="background: #fff">
        <div class="card-kicker">{{ $t('sa16.totalSpent') }}</div>
        <p class="font-heading text-[30px] leading-none">{{ money(stats.totalSpent) }}</p>
      </div>
      <div class="card elev-sm gap-0.5" style="background: #fff">
        <div class="card-kicker">{{ $t('sa16.lastVisit') }}</div>
        <p class="font-heading text-[22px] leading-[1.2]">
          {{ stats.lastAt ? date(stats.lastAt) : '—' }}
        </p>
      </div>
      <div class="card elev-sm gap-0.5" style="background: #fff">
        <div class="card-kicker">{{ $t('sa16.vehicleCount') }}</div>
        <p class="font-heading text-[30px] leading-none">{{ stats.vehicles }}</p>
      </div>
    </div>

    <section class="card gap-1.5" style="background: #fff">
      <div class="card-kicker">{{ $t('sa16.personal') }}</div>
      <dl
        class="grid gap-2 text-[13px]"
        style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))"
      >
        <div>
          <dt class="text-muted block text-[11.5px]">{{ $t('sa15.colPhone') }}</dt>
          <dd>{{ data.customer.phone }}</dd>
        </div>
        <div>
          <dt class="text-muted block text-[11.5px]">Email</dt>
          <dd>{{ data.customer.email ?? '—' }}</dd>
        </div>
        <div>
          <dt class="text-muted block text-[11.5px]">{{ $t('sa17.address') }}</dt>
          <dd>{{ data.customer.address ?? '—' }}</dd>
        </div>
        <div>
          <dt class="text-muted block text-[11.5px]">{{ $t('sa16.prefLang') }}</dt>
          <dd>{{ $t(`lang.${data.customer.language}`) }}</dd>
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
        {{ $t('sa16.tabVehicles') }} <span style="opacity: 0.6">{{ data.vehicles.items.length }}</span>
      </button>
      <button
        type="button"
        role="tab"
        class="ay-tab"
        :class="tab === 'BOOKINGS' ? 'ay-tab-on' : ''"
        :aria-selected="tab === 'BOOKINGS'"
        @click="tab = 'BOOKINGS'"
      >
        {{ $t('sa03.title') }} <span style="opacity: 0.6">{{ data.bookings?.items.length ?? 0 }}</span>
      </button>
      <button
        type="button"
        role="tab"
        class="ay-tab"
        :class="tab === 'WORK_ORDERS' ? 'ay-tab-on' : ''"
        :aria-selected="tab === 'WORK_ORDERS'"
        @click="tab = 'WORK_ORDERS'"
      >
        {{ $t('sa09.title') }} <span style="opacity: 0.6">{{ data.workOrders?.items.length ?? 0 }}</span>
      </button>
    </div>

    <div class="table-wrap">
      <table v-if="tab === 'VEHICLES'" class="table" style="min-width: 600px">
        <thead>
          <tr>
            <th>{{ $t('sa16.colPlate') }}</th>
            <th>{{ $t('sa16.colMakerModel') }}</th>
            <th>{{ $t('sa16.colOdometer') }}</th>
            <th>{{ $t('sa16.colYear') }}</th>
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
            <td colspan="4" class="text-muted py-6 text-center">{{ $t('sa16.noVehicles') }}</td>
          </tr>
        </tbody>
      </table>

      <table v-else-if="tab === 'BOOKINGS'" class="table" style="min-width: 600px">
        <thead>
          <tr>
            <th>{{ $t('sa03.colCode') }}</th>
            <th>{{ $t('sa03.colWhen') }}</th>
            <th>{{ $t('sa02.colService') }}</th>
            <th>{{ $t('sa02.colStatus') }}</th>
          </tr>
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
            <td colspan="4" class="text-muted py-6 text-center">{{ $t('sa16.noBookings') }}</td>
          </tr>
        </tbody>
      </table>

      <table v-else class="table" style="min-width: 600px">
        <thead>
          <tr>
            <th>{{ $t('sa09.colCode') }}</th>
            <th>{{ $t('sa16.colDate') }}</th>
            <th>{{ $t('sa09.colTotal') }}</th>
            <th>{{ $t('sa02.colStatus') }}</th>
          </tr>
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
            <td colspan="4" class="text-muted py-6 text-center">{{ $t('sa16.noOrders') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="grid gap-[13px]" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))">
      <section class="card gap-[7px]" style="background: #fff">
        <h5>{{ $t('sa05.internalNote') }}</h5>
        <textarea
          v-model="note"
          class="input"
          style="min-height: 70px"
          :placeholder="$t('sa05.internalHint')"
        />
        <button type="button" class="btn btn-secondary self-end text-[12.5px]" @click="saveNote">
          {{ $t('sa05.saveNote') }}
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
