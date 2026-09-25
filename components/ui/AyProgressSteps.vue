<script setup lang="ts">
/**
 * CP-19 Dong thoi gian tien do — SC-26 va SA-10.
 *
 * Ban thiet ke ve mot cot duy nhat di tu luc dat lich den luc ban giao, nen
 * thanh phan nay nhan thang mot danh sach moc thay vi tu suy ra tu trang thai
 * phieu: cham 16px, duong noi 2px, moc da qua mau accent-2, moc dang lam mau
 * accent kem quang sang, moc chua toi chi la vong tron rong.
 */
export interface ProgressStep {
  /** Khoa de gan slot rieng cho tung moc. */
  key: string;
  label: string;
  at?: string | null;
  note?: string | null;
  state: 'done' | 'current' | 'todo';
}

defineProps<{ steps: ProgressStep[] }>();
</script>

<template>
  <ol class="flex flex-col">
    <li v-for="(step, index) in steps" :key="step.key" class="flex gap-[13px]">
      <span class="flex w-[26px] flex-none flex-col items-center">
        <span
          class="rounded-full"
          style="width: 16px; height: 16px"
          :style="
            step.state === 'done'
              ? 'background: var(--color-accent-2-600)'
              : step.state === 'current'
                ? 'background: var(--color-accent); box-shadow: 0 0 0 4px var(--color-accent-200)'
                : 'border: 2px solid var(--color-neutral-400)'
          "
        />
        <span
          v-if="index < steps.length - 1"
          class="w-0.5 flex-1"
          style="min-height: 26px"
          :style="
            step.state === 'done'
              ? 'background: var(--color-accent-2-400)'
              : 'background: var(--color-neutral-300)'
          "
        />
      </span>

      <span
        class="flex flex-col items-start gap-[3px]"
        :class="index < steps.length - 1 ? 'pb-4' : ''"
      >
        <span class="flex flex-wrap items-baseline gap-2">
          <span
            class="text-[14px]"
            :style="
              step.state === 'current'
                ? 'font-weight: 700; color: var(--color-accent-700)'
                : step.state === 'todo'
                  ? 'color: var(--color-neutral-600)'
                  : 'font-weight: 600'
            "
          >
            {{ step.label }}
          </span>
          <span v-if="step.at" class="text-muted text-[11.5px]">{{ step.at }}</span>
        </span>
        <span v-if="step.note" class="text-muted text-[11.5px]">{{ step.note }}</span>
        <slot :name="`after-${step.key}`" />
      </span>
    </li>
  </ol>
</template>
