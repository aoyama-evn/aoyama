<script setup lang="ts">
import type { WorkOrder } from '~/types/models';

/** SC-32 Chi tiet phieu dich vu phia khach — FR-VEH-06, FR-PAY-06. */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const api = useApi();
const { t } = useI18n();
const { money, dateTime, number } = useFormat();

const id = route.params.id as string;
const { data: record } = await useAsyncData(`record-${id}`, () =>
  api.get<WorkOrder>(`/account/service-records/${id}`),
);

if (!record.value) {
  throw createError({ statusCode: 404, statusMessage: t('sc32.notFound') });
}

useHead({ title: () => t('sc32.title', { code: record.value?.code ?? '' }) });
</script>

<template>
  <div v-if="record" class="mx-auto flex max-w-2xl flex-col gap-5">
    <AyPageHeader code="SC-32" :title="$t('sc32.title', { code: record.code })">
      <template #actions>
        <AyStatusTag :status="record.status" />
        <AyStatusTag :status="record.paymentStatus" />
      </template>
    </AyPageHeader>

    <section class="card flex flex-col gap-2 text-[14px]">
      <div class="flex justify-between gap-3">
        <span class="text-muted">{{ $t('sc22.vehicle') }}</span>
        <span>{{ record.vehicle?.plateNumber }} · {{ record.vehicle?.maker }} {{ record.vehicle?.model }}</span>
      </div>
      <div class="flex justify-between gap-3">
        <span class="text-muted">{{ $t('sc32.intakeOdo') }}</span>
        <span>{{ number(record.intakeOdometer) }} km</span>
      </div>
      <div v-if="record.completedAt" class="flex justify-between gap-3">
        <span class="text-muted">{{ $t('sc32.completed') }}</span>
        <span>{{ dateTime(record.completedAt) }}</span>
      </div>
      <div v-if="record.deliveredAt" class="flex justify-between gap-3">
        <span class="text-muted">{{ $t('sc32.delivered') }}</span>
        <span>{{ dateTime(record.deliveredAt) }}</span>
      </div>
    </section>

    <section v-if="record.customerSymptom || record.diagnosisNote" class="card flex flex-col gap-2">
      <h2 class="font-heading text-[16px]">{{ $t('sc32.diagnosis') }}</h2>
      <div v-if="record.customerSymptom">
        <p class="text-[12.5px] text-muted">{{ $t('sc32.yourSymptom') }}</p>
        <p class="whitespace-pre-line text-[14px]">{{ record.customerSymptom }}</p>
      </div>
      <div v-if="record.diagnosisNote">
        <p class="text-[12.5px] text-muted">{{ $t('sc32.techNote') }}</p>
        <p class="whitespace-pre-line text-[14px]">{{ record.diagnosisNote }}</p>
      </div>
    </section>

    <section v-if="(record.items ?? []).length" class="card">
      <h2 class="mb-2 font-heading text-[16px]">{{ $t('sc27.laborItems') }}</h2>
      <ul class="flex flex-col gap-1.5 text-[14px]">
        <li v-for="item in record.items" :key="item.id" class="flex justify-between gap-3">
          <span>{{ item.name }}<template v-if="item.quantity > 1"> × {{ item.quantity }}</template></span>
          <span class="whitespace-nowrap">{{ money(item.unitPrice * item.quantity) }}</span>
        </li>
      </ul>
    </section>

    <section v-if="(record.parts ?? []).length" class="card">
      <h2 class="mb-2 font-heading text-[16px]">{{ $t('sc32.partsUsed') }}</h2>
      <ul class="flex flex-col gap-1.5 text-[14px]">
        <li v-for="part in record.parts" :key="part.id" class="flex justify-between gap-3">
          <span>{{ part.partName }}<template v-if="part.quantity > 1"> × {{ part.quantity }}</template></span>
          <span class="whitespace-nowrap">{{ money(part.unitPrice * part.quantity) }}</span>
        </li>
      </ul>
    </section>

    <section class="card">
      <AyMoneyTable
        :labor-subtotal="record.laborSubtotal"
        :parts-subtotal="record.partsSubtotal"
        :discount-amount="record.discountAmount"
        :tax-rate="record.taxRate"
        :tax-amount="record.taxAmount"
        :total-amount="record.totalAmount"
        :paid-amount="record.paidAmount"
      />
    </section>

    <section v-if="(record.photos ?? []).length" class="card">
      <h2 class="mb-2 font-heading text-[16px]">{{ $t('sc32.photos') }}</h2>
      <ul class="grid grid-cols-3 gap-2">
        <li v-for="photo in record.photos" :key="photo.id">
          <img :src="photo.url" :alt="photo.caption ?? ''" class="aspect-square w-full rounded-xl object-cover">
        </li>
      </ul>
    </section>
  </div>
</template>
