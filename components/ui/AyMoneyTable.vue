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
      <dt class="ay-muted">Tiền công</dt>
      <dd>{{ money(laborSubtotal) }}</dd>
    </div>
    <div v-if="partsSubtotal !== undefined" class="flex justify-between">
      <dt class="ay-muted">Tiền phụ tùng</dt>
      <dd>{{ money(partsSubtotal) }}</dd>
    </div>
    <div v-if="subtotal !== undefined" class="flex justify-between">
      <dt class="ay-muted">Tạm tính</dt>
      <dd>{{ money(subtotal) }}</dd>
    </div>
    <div v-if="discountAmount" class="flex justify-between text-success">
      <dt>Giảm giá</dt>
      <dd>− {{ money(discountAmount) }}</dd>
    </div>
    <div v-if="taxAmount !== undefined" class="flex justify-between">
      <dt class="ay-muted">Thuế{{ taxRate !== undefined ? ` (${taxRate}%)` : '' }}</dt>
      <dd>{{ money(taxAmount) }}</dd>
    </div>

    <div class="mt-1 flex justify-between border-t border-divider pt-2 font-heading text-[17px]">
      <dt>Tổng cộng</dt>
      <dd>{{ money(totalAmount) }}</dd>
    </div>

    <div v-if="paidAmount !== undefined" class="flex justify-between text-[13px]">
      <dt class="ay-muted">Đã thanh toán</dt>
      <dd>
        {{ money(paidAmount) }}
        <span v-if="paidAmount < totalAmount" class="text-danger">
          (còn {{ money(totalAmount - paidAmount) }})
        </span>
      </dd>
    </div>
  </dl>
</template>
