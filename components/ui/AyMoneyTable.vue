<script setup lang="ts">
/** CP-21 Bang dong tien — tien cong, tien phu tung, thue, tong cong. */
defineProps<{
  laborSubtotal?: number;
  partsSubtotal?: number;
  subtotal?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount: number;
  paidAmount?: number;
}>();

const { money } = useFormat();
</script>

<template>
  <dl class="flex flex-col gap-1.5 text-[14px]">
    <div v-if="laborSubtotal !== undefined" class="flex justify-between">
      <dt class="text-muted">{{ $t('money.labor') }}</dt>
      <dd>{{ money(laborSubtotal) }}</dd>
    </div>
    <div v-if="partsSubtotal !== undefined" class="flex justify-between">
      <dt class="text-muted">{{ $t('money.parts') }}</dt>
      <dd>{{ money(partsSubtotal) }}</dd>
    </div>
    <div v-if="subtotal !== undefined" class="flex justify-between">
      <dt class="text-muted">{{ $t('money.subtotal') }}</dt>
      <dd>{{ money(subtotal) }}</dd>
    </div>
    <div v-if="discountAmount" class="flex justify-between text-success">
      <dt>{{ $t('money.discount') }}</dt>
      <dd>− {{ money(discountAmount) }}</dd>
    </div>
    <div v-if="taxAmount !== undefined" class="flex justify-between">
      <dt class="text-muted">
        {{ taxRate === undefined ? $t('money.tax') : $t('money.taxRate', { rate: taxRate }) }}
      </dt>
      <dd>{{ money(taxAmount) }}</dd>
    </div>

    <div class="mt-1 flex justify-between border-t border-divider pt-2 font-heading text-[17px]">
      <dt>{{ $t('money.total') }}</dt>
      <dd>{{ money(totalAmount) }}</dd>
    </div>

    <div v-if="paidAmount !== undefined" class="flex justify-between text-[13px]">
      <dt class="text-muted">{{ $t('money.paid') }}</dt>
      <dd>
        {{ money(paidAmount) }}
        <span v-if="paidAmount < totalAmount" class="text-danger">
          {{ $t('money.remaining', { amount: money(totalAmount - paidAmount) }) }}
        </span>
      </dd>
    </div>
  </dl>
</template>
