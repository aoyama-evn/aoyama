<script setup lang="ts">
import type { Quotation } from '~/types/models';

/** SC-27 Xem bao gia — FR-QUO-07, NFR-SE-08 (duong dan kho doan). */
const route = useRoute();
const api = useApi();
const { t } = useI18n();
const { money, date } = useFormat();

const token = route.params.token as string;
const { data: quotation } = await useAsyncData(`quotation-${token}`, () =>
  api.get<Quotation>(`/quotations/${token}`),
);
if (!quotation.value) {
  throw createError({ statusCode: 404, statusMessage: t('sc27.notFound') });
}

const labor = computed(() => (quotation.value?.items ?? []).filter((i) => i.kind !== 'PART'));
const parts = computed(() => (quotation.value?.items ?? []).filter((i) => i.kind === 'PART'));

const laborTotal = computed(() =>
  labor.value.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
);
const partsTotal = computed(() => parts.value.reduce((s, i) => s + i.unitPrice * i.quantity, 0));

const canRespond = computed(() => quotation.value?.status === 'SENT');
const expired = computed(() =>
  Boolean(
    quotation.value?.validUntil && quotation.value.validUntil < new Date().toISOString().slice(0, 10),
  ),
);

useHead({ title: () => t('sc27.title', { code: quotation.value?.code ?? '' }) });
</script>

<template>
  <div v-if="quotation" class="flex flex-col gap-3.5 pb-4">
    <div class="flex items-center justify-between gap-2">
      <div>
        <div class="text-[11px] text-muted">{{ $t('sc27.kicker') }}</div>
        <div class="font-heading text-[18px]">
          {{ quotation.code }} · {{ $t('sc27.version', { n: quotation.version }) }}
        </div>
      </div>
      <AyStatusTag :status="quotation.status" />
    </div>

    <div class="flex flex-col gap-2">
      <div v-if="labor.length" class="card-kicker">{{ $t('sc27.laborItems') }}</div>
      <div
        v-for="item in labor"
        :key="item.id"
        class="flex justify-between gap-3 text-[13.5px]"
        :class="item.isAccepted ? '' : 'opacity-50 line-through'"
      >
        <span>
          {{ item.name }}
          <span v-if="item.isOptional" class="tag tag-neutral ml-1">{{ $t('sc27.optional') }}</span>
        </span>
        <span class="whitespace-nowrap">{{ money(item.unitPrice * item.quantity) }}</span>
      </div>

      <div v-if="parts.length" class="card-kicker mt-1.5">{{ $t('sc27.partItems') }}</div>
      <div
        v-for="item in parts"
        :key="item.id"
        class="flex justify-between gap-3 text-[13.5px]"
        :class="item.isAccepted ? '' : 'opacity-50 line-through'"
      >
        <span>
          {{ item.name }}<template v-if="item.quantity > 1"> ×{{ item.quantity }}</template>
          <span v-if="item.isOptional" class="tag tag-neutral ml-1">{{ $t('sc27.optional') }}</span>
        </span>
        <span class="whitespace-nowrap">{{ money(item.unitPrice * item.quantity) }}</span>
      </div>
    </div>

    <!-- CP-21 bang dong tien -->
    <div
      class="flex flex-col gap-1.5 p-3.5 text-[13px]"
      style="background: var(--color-surface); border-radius: 22px"
    >
      <div class="flex justify-between"><span class="text-muted">{{ $t('money.labor') }}</span><span>{{ money(laborTotal) }}</span></div>
      <div class="flex justify-between"><span class="text-muted">{{ $t('money.parts') }}</span><span>{{ money(partsTotal) }}</span></div>
      <div v-if="quotation.discountAmount" class="flex justify-between" style="color: var(--color-success)">
        <span>{{ $t('money.discount') }}</span><span>− {{ money(quotation.discountAmount) }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-muted">{{ $t('money.taxRate', { rate: quotation.taxRate }) }}</span><span>{{ money(quotation.taxAmount) }}</span>
      </div>
      <div
        class="mt-0.5 flex items-baseline justify-between pt-2"
        style="border-top: 1px solid var(--color-divider)"
      >
        <strong>{{ $t('money.total') }}</strong>
        <span class="font-heading text-[22px]">{{ money(quotation.totalAmount) }}</span>
      </div>
    </div>

    <p
      v-if="quotation.validUntil || quotation.note"
      class="px-3.5 py-2.5 text-[12px]"
      style="background: var(--color-accent-100); border-radius: 18px; color: var(--color-neutral-700)"
    >
      <i18n-t v-if="quotation.validUntil" keypath="sc27.validUntil" tag="span">
        <template #date><strong>{{ date(quotation.validUntil) }}</strong></template>
      </i18n-t>
      <template v-if="quotation.note">
        {{ ' ' }}{{ $t('sc27.storeNote', { note: quotation.note }) }}
      </template>
    </p>

    <template v-if="canRespond && !expired">
      <NuxtLink :to="`/quotations/${token}/respond?accept=1`" class="btn btn-primary btn-cta">
        {{ $t('sc27.accept') }}
      </NuxtLink>
      <NuxtLink
        :to="`/quotations/${token}/respond`"
        class="btn btn-secondary btn-block"
        style="min-height: 44px"
      >
        {{ $t('sc27.reject') }}
      </NuxtLink>
    </template>

    <div
      v-else-if="expired"
      class="card text-center text-[13px]"
      style="color: var(--color-danger)"
    >
      {{ $t('sc27.expired') }}
    </div>

    <div
      v-else-if="quotation.status === 'ACCEPTED'"
      class="card text-center text-[13px]"
      style="color: var(--color-success)"
    >
      {{ $t('sc27.accepted') }}
    </div>

    <div v-else-if="quotation.status === 'REJECTED'" class="card text-center text-[13px] text-muted">
      {{ $t('sc27.rejected') }}
      <template v-if="quotation.rejectReason">
        {{ ' ' }}{{ $t('sc27.rejectedWhy', { reason: quotation.rejectReason }) }}
      </template>
    </div>
  </div>
</template>
