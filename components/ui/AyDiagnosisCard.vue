<script setup lang="ts">
import type { DiagnosisFinding } from '~/types/models';

/**
 * CP-16 The ket qua AI — SC-11.
 * Luon kem nhan "Goi y boi AI" va muc do khop, de khach hieu day la de xuat
 * chu khong phai ket luan (RK-01).
 */
defineProps<{ finding: DiagnosisFinding; rank: number }>();
const emit = defineEmits<{ (e: 'book', finding: DiagnosisFinding): void }>();

const SEVERITY: Record<string, { label: string; class: string }> = {
  HIGH: { label: 'Nên xử lý sớm', class: 'bg-danger-bg text-danger' },
  MEDIUM: { label: 'Nên kiểm tra', class: 'bg-warning-bg text-warning' },
  LOW: { label: 'Theo dõi thêm', class: 'bg-info-bg text-info' },
};
</script>

<template>
  <article class="card flex flex-col gap-2">
    <header class="flex items-start justify-between gap-3">
      <h3 class="font-heading text-[15.5px]">
        <span class="text-muted">{{ rank }}.</span> {{ finding.label }}
      </h3>
      <AyAiBadge :confidence="finding.matchPercent" />
    </header>

    <div>
      <div class="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          class="h-full rounded-full bg-accent-500"
          :style="{ width: `${Math.min(100, Math.max(0, finding.matchPercent))}%` }"
          role="progressbar"
          :aria-valuenow="finding.matchPercent"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`Mức độ khớp ${finding.matchPercent}%`"
        />
      </div>
      <p class="mt-1 text-[12px] text-muted">Mức độ khớp {{ Math.round(finding.matchPercent) }}%</p>
    </div>

    <p v-if="finding.description" class="text-[13.5px]">{{ finding.description }}</p>

    <footer class="flex flex-wrap items-center gap-2">
      <span v-if="finding.severity" class="tag" :class="SEVERITY[finding.severity]?.class">
        {{ SEVERITY[finding.severity]?.label }}
      </span>
      <AyButton variant="ghost" size="sm" class="ml-auto" @click="emit('book', finding)">
        Đặt lịch với dịch vụ này →
      </AyButton>
    </footer>
  </article>
</template>
