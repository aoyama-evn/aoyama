<script setup lang="ts">
/**
 * Thanh buoc cua luong dat lich SC-12 → SC-16.
 * RK-05 — luong toi da 3 buoc nhap lieu roi den xac nhan, chu so va nhan lon
 * de nguoi lon tuoi theo doi duoc dang o dau.
 */
defineProps<{ current: 1 | 2 | 3 | 4 }>();

const STEPS = [
  { index: 1, label: 'Dịch vụ & cửa hàng', to: '/booking/step1' },
  { index: 2, label: 'Ngày & giờ', to: '/booking/step2' },
  { index: 3, label: 'Thông tin xe', to: '/booking/step3' },
  { index: 4, label: 'Xác nhận', to: '/booking/confirm' },
];
</script>

<template>
  <ol class="flex items-center gap-1 overflow-x-auto pb-1" aria-label="Các bước đặt lịch">
    <li v-for="step in STEPS" :key="step.index" class="flex flex-none items-center gap-1">
      <span
        class="flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px]"
        :class="
          step.index === current
            ? 'bg-accent text-white font-semibold'
            : step.index < current
              ? 'bg-accent-200 text-accent-800'
              : 'bg-neutral-200 ay-muted'
        "
        :aria-current="step.index === current ? 'step' : undefined"
      >
        <span
          class="grid h-5 w-5 place-items-center rounded-full text-[11px]"
          :class="step.index === current ? 'bg-white/25' : 'bg-white/60'"
        >
          <template v-if="step.index < current">✓</template>
          <template v-else>{{ step.index }}</template>
        </span>
        {{ step.label }}
      </span>
      <span
        v-if="step.index < STEPS.length"
        class="h-0.5 w-4 bg-neutral-300"
        aria-hidden="true"
      />
    </li>
  </ol>
</template>
