<script setup lang="ts">
/**
 * Thanh buoc cua luong dat lich SC-12 → SC-15.
 * Ban thiet ke dung ba vong tron 20px noi bang duong ke 1.5px: buoc da qua hien
 * dau tick tren nen accent-300, buoc dang lam to dam mau accent.
 */
const props = defineProps<{ current: 1 | 2 | 3 }>();

const STEPS = [
  { index: 1, label: 'Dịch vụ' },
  { index: 2, label: 'Thời gian' },
  { index: 3, label: 'Thông tin' },
] as const;

function state(index: number): 'done' | 'current' | 'todo' {
  if (index < props.current) return 'done';
  return index === props.current ? 'current' : 'todo';
}
</script>

<template>
  <ol class="flex items-center gap-1.5 text-[11.5px]" aria-label="Các bước đặt lịch">
    <template v-for="(step, i) in STEPS" :key="step.index">
      <li
        class="flex items-center gap-1.5"
        :style="
          state(step.index) === 'current'
            ? 'color: var(--color-accent-700); font-weight: 700'
            : 'color: var(--color-neutral-600)'
        "
        :aria-current="state(step.index) === 'current' ? 'step' : undefined"
      >
        <span
          class="grid place-items-center rounded-full text-[11px]"
          style="width: 20px; height: 20px"
          :style="
            state(step.index) === 'done'
              ? 'background: var(--color-accent-300)'
              : state(step.index) === 'current'
                ? 'background: var(--color-accent); color: var(--color-bg)'
                : 'border: 1.5px solid var(--color-divider)'
          "
        >
          {{ state(step.index) === 'done' ? '✓' : step.index }}
        </span>
        {{ step.label }}
      </li>
      <li
        v-if="i < STEPS.length - 1"
        class="h-[1.5px] flex-1"
        :style="
          step.index < current
            ? 'background: var(--color-accent-300)'
            : 'background: var(--color-divider)'
        "
        aria-hidden="true"
      />
    </template>
  </ol>
</template>
