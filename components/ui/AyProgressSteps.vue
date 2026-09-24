<script setup lang="ts">
import { WORK_ORDER_FLOW, type WorkOrderStatus } from '~/types/enums';

/**
 * CP-19 Thanh tien do trang thai — SC-26, SA-10.
 * Ban thiet ke ve dang dong thoi gian doc: cham tron 16px noi bang duong ke 2px.
 * Moc da qua to mau accent-2, moc dang lam to mau accent kem quang sang,
 * moc chua toi chi la vong tron rong.
 */
const props = defineProps<{
  current: WorkOrderStatus;
  /** Bo qua buoc bao gia khi phieu khong can bao gia. */
  skipQuotation?: boolean;
  /** Moc thoi gian va ghi chu cho tung trang thai, neu co. */
  timeline?: Partial<Record<WorkOrderStatus, { at?: string; note?: string | null }>>;
}>();

const LABELS: Record<WorkOrderStatus, string> = {
  RECEIVED: 'Đã tiếp nhận',
  DIAGNOSING: 'Đã chẩn đoán',
  QUOTED: 'Đã gửi báo giá',
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

function state(index: number): 'done' | 'current' | 'todo' {
  if (index < currentIndex.value) return 'done';
  return index === currentIndex.value ? 'current' : 'todo';
}
</script>

<template>
  <div v-if="isCancelled" class="card flex-row items-center gap-2">
    <AyStatusTag status="CANCELLED" />
    <p class="text-[13.5px] text-muted">Phiếu dịch vụ này đã bị hủy.</p>
  </div>

  <ol v-else class="flex flex-col">
    <li v-for="(step, index) in steps" :key="step" class="flex gap-3">
      <span class="flex w-[26px] flex-none flex-col items-center">
        <span
          class="rounded-full"
          style="width: 16px; height: 16px"
          :style="
            state(index) === 'done'
              ? 'background: var(--color-accent-2-600)'
              : state(index) === 'current'
                ? 'background: var(--color-accent); box-shadow: 0 0 0 4px var(--color-accent-200)'
                : 'border: 2px solid var(--color-neutral-400)'
          "
        />
        <span
          v-if="index < steps.length - 1"
          class="w-0.5 flex-1"
          style="min-height: 26px"
          :style="
            state(index) === 'done'
              ? 'background: var(--color-accent-2-400)'
              : 'background: var(--color-neutral-300)'
          "
        />
      </span>

      <span class="pb-4" :class="index === steps.length - 1 ? 'pb-0' : ''">
        <span
          class="block text-[14px]"
          :style="
            state(index) === 'current'
              ? 'font-weight: 700; color: var(--color-accent-700)'
              : state(index) === 'todo'
                ? 'color: var(--color-neutral-600)'
                : 'font-weight: 600'
          "
        >
          {{ LABELS[step] }}
        </span>
        <span v-if="timeline?.[step]" class="block text-[11.5px] text-muted">
          {{ timeline[step]?.at }}
          <template v-if="timeline[step]?.note"> · {{ timeline[step]?.note }}</template>
        </span>
        <slot :name="`after-${step}`" />
      </span>
    </li>
  </ol>
</template>
