<script setup lang="ts">
import { WORK_ORDER_FLOW, type WorkOrderStatus } from '~/types/enums';

/** CP-19 Thanh tien do trang thai — SC-26, SA-10. */
const props = defineProps<{
  current: WorkOrderStatus;
  /** Bo qua buoc bao gia khi phieu khong can bao gia. */
  skipQuotation?: boolean;
}>();

const LABELS: Record<WorkOrderStatus, string> = {
  RECEIVED: 'Đã tiếp nhận',
  DIAGNOSING: 'Đang chẩn đoán',
  QUOTED: 'Chờ duyệt báo giá',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn tất',
  DELIVERED: 'Đã bàn giao',
  CANCELLED: 'Đã hủy',
};

const steps = computed(() =>
  WORK_ORDER_FLOW.filter((s) => !(props.skipQuotation && s === 'QUOTED')),
);

const currentIndex = computed(() => steps.value.indexOf(props.current));
const isCancelled = computed(() => props.current === 'CANCELLED');
</script>

<template>
  <div v-if="isCancelled" class="ay-card flex items-center gap-2">
    <AyStatusTag status="CANCELLED" />
    <p class="text-[13.5px] ay-muted">Phiếu dịch vụ này đã bị hủy.</p>
  </div>

  <ol v-else class="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
    <li
      v-for="(step, index) in steps"
      :key="step"
      class="flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center"
    >
      <div class="flex flex-col items-center sm:w-full sm:flex-row">
        <span
          class="hidden h-0.5 flex-1 sm:block"
          :class="index === 0 ? 'opacity-0' : index <= currentIndex ? 'bg-accent' : 'bg-neutral-300'"
          aria-hidden="true"
        />
        <span
          class="grid h-8 w-8 flex-none place-items-center rounded-full text-[13px] font-semibold"
          :class="
            index < currentIndex
              ? 'bg-accent text-white'
              : index === currentIndex
                ? 'bg-accent text-white ring-4 ring-accent-200'
                : 'bg-neutral-200 ay-muted'
          "
        >
          <template v-if="index < currentIndex">✓</template>
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span
          class="hidden h-0.5 flex-1 sm:block"
          :class="index === steps.length - 1 ? 'opacity-0' : index < currentIndex ? 'bg-accent' : 'bg-neutral-300'"
          aria-hidden="true"
        />
        <span
          class="ml-3 mt-0 h-6 w-0.5 sm:hidden"
          :class="index === steps.length - 1 ? 'opacity-0' : index < currentIndex ? 'bg-accent' : 'bg-neutral-300'"
          aria-hidden="true"
        />
      </div>

      <p
        class="pb-4 text-[12.5px] sm:mt-1.5 sm:pb-0"
        :class="index === currentIndex ? 'font-semibold text-accent-800' : 'ay-muted'"
      >
        {{ LABELS[step] }}
      </p>
    </li>
  </ol>
</template>
