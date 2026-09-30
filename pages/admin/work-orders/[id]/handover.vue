<script setup lang="ts">
import type { WorkOrder } from '~/types/models';

/**
 * SA-10b Phieu da ban giao — man cuoi cua luong tiep nhan → ban giao.
 *
 * Ban thiet ke dat mot man xac nhan rieng sau khi thu tien va ban giao xe,
 * tom tat lai phieu roi dua nhan vien ve danh sach lich hen de tiep khach
 * sau. Truoc day buoc nay do ve man chi tiet phieu, nhan vien khong biet
 * viec da xong hay chua.
 */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const { t } = useI18n();
const { money, dateTime, number } = useFormat();

const id = route.params.id as string;
const { data: workOrder } = await useAsyncData(`handover-${id}`, () =>
  api.get<WorkOrder>(`/admin/work-orders/${id}`),
);
if (!workOrder.value) {
  throw createError({ statusCode: 404, statusMessage: t('sa10.notFound') });
}

setScreenTitle(() => t('sa10b.title'));

/** Con no lai bao nhieu — de le tan doc cho khach nghe truoc khi tien. */
const outstanding = computed(() => {
  const order = workOrder.value;
  if (!order) return 0;
  return Math.max(0, (order.totalAmount ?? 0) - (order.paidAmount ?? 0));
});

useHead({ title: () => `${t('sa10b.title')} — AOYAMA Admin` });
</script>

<template>
  <div v-if="workOrder" class="admin-stack gap-[15px]">
    <section
      class="flex flex-wrap items-center gap-3.5 p-4"
      style="background: var(--color-accent-2-100); border-radius: 26px"
    >
      <span
        class="grid flex-none place-items-center rounded-full text-white"
        style="width: 46px; height: 46px; background: var(--color-accent-2-500)"
        aria-hidden="true"
      >
        <svg
          width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"
        >
          <path d="M4 12.5 9.5 18 20 6.5" />
        </svg>
      </span>
      <div class="min-w-0 flex-1">
        <h4 class="mb-0.5">{{ $t('sa10b.done', { code: workOrder.code }) }}</h4>
        <p class="text-[12.5px]" style="color: var(--color-accent-2-800)">
          {{ $t('sa10b.lead') }}
        </p>
      </div>
      <AyStatusTag :status="workOrder.status" />
    </section>

    <div
      class="grid gap-[13px]"
      style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))"
    >
      <div class="card gap-1" style="background: #fff">
        <div class="card-kicker">{{ $t('sa03.colCustomer') }}</div>
        <p class="text-[14px] font-semibold">{{ workOrder.customer?.name }}</p>
        <p class="text-muted text-[12px]">{{ workOrder.customer?.phone }}</p>
      </div>
      <div class="card gap-1" style="background: #fff">
        <div class="card-kicker">{{ $t('sa03.colVehicle') }}</div>
        <p class="text-[14px] font-semibold">
          {{ workOrder.vehicle?.maker }} {{ workOrder.vehicle?.model }}
        </p>
        <p v-if="workOrder.vehicle" class="text-muted text-[12px]">
          {{ workOrder.vehicle.plateNumber }}
          <template v-if="workOrder.intakeOdometer">
            · {{ number(workOrder.intakeOdometer) }} km
          </template>
        </p>
      </div>
      <div class="card gap-1" style="background: #fff">
        <div class="card-kicker">{{ $t('sa10b.deliveredAt') }}</div>
        <p class="text-[14px] font-semibold">
          {{ workOrder.deliveredAt ? dateTime(workOrder.deliveredAt) : '—' }}
        </p>
      </div>
    </div>

    <section class="card gap-2" style="background: #fff">
      <h5>{{ $t('sa10b.money') }}</h5>
      <div class="flex justify-between text-[13.5px]">
        <span class="text-muted">{{ $t('sa10b.total') }}</span>
        <strong>{{ money(workOrder.totalAmount ?? 0) }}</strong>
      </div>
      <div class="flex justify-between text-[13.5px]">
        <span class="text-muted">{{ $t('sa10b.paid') }}</span>
        <strong>{{ money(workOrder.paidAmount ?? 0) }}</strong>
      </div>
      <div
        class="flex justify-between pt-2 text-[13.5px]"
        style="border-top: 1px solid var(--color-divider)"
      >
        <span class="text-muted">{{ $t('sa10b.outstanding') }}</span>
        <strong :style="outstanding > 0 ? 'color: var(--color-danger)' : undefined">
          {{ money(outstanding) }}
        </strong>
      </div>
      <p v-if="outstanding > 0" class="text-[12px]" style="color: var(--color-danger)">
        {{ $t('sa10b.unpaidNote') }}
      </p>
    </section>

    <div class="flex flex-wrap items-center justify-end gap-2.5">
      <NuxtLink
        :to="`/admin/work-orders/${id}`"
        class="btn btn-secondary text-[13px]"
        style="min-height: 48px; padding-inline: 20px"
      >
        {{ $t('sa10b.openOrder') }}
      </NuxtLink>
      <NuxtLink
        to="/admin/bookings"
        class="btn btn-primary text-[15px]"
        style="min-height: 48px; padding-inline: 26px"
      >
        {{ $t('sa10b.backToBookings') }}
      </NuxtLink>
    </div>
  </div>
</template>
