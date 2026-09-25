<script setup lang="ts">
import type { DiagnosisFinding, ServiceItem } from '~/types/models';

/**
 * CP-16 The ket qua chan doan AI — SC-11.
 * Ban thiet ke: khung vien dut mau accent-2, mot thanh ty le cho moi kha nang,
 * o dich vu de xuat tren nen trang, roi cau nhac day chi la goi y (RK-01).
 */
const props = defineProps<{
  findings: DiagnosisFinding[];
  vehicleLabel?: string | null;
}>();

const emit = defineEmits<{ (e: 'book', serviceCodes: string[] | undefined): void }>();

const api = useApi();
const { i18n, money } = useFormat();

/** Dich vu de xuat lay tu kha nang cao nhat. */
const top = computed(() =>
  [...props.findings].sort((a, b) => b.matchPercent - a.matchPercent)[0] ?? null,
);

const { data: services } = await useAsyncData('diagnosis-services', () =>
  api.get<ServiceItem[]>('/services'),
);

const suggested = computed(() => {
  const codes = top.value?.suggestedServiceCodes ?? [];
  return (services.value ?? []).find((service) => codes.includes(service.code)) ?? null;
});

function pct(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}
</script>

<template>
  <article
    class="flex flex-col gap-[11px] self-start p-3.5"
    style="
      max-width: 92%;
      border: 1.5px dashed var(--color-accent-2-400);
      background: var(--color-accent-2-100);
      border-radius: 22px 22px 22px 8px;
    "
  >
    <div class="flex flex-wrap items-center gap-2">
      <span class="tag" style="background: var(--color-accent-2-500); color: #fff">
        {{ $t('diag.badge') }}
      </span>
      <span v-if="vehicleLabel" class="text-[11px]" style="color: var(--color-accent-2-800)">
        {{ vehicleLabel }}
      </span>
    </div>

    <div class="flex flex-col gap-2.5">
      <div v-for="(finding, index) in findings" :key="index">
        <div class="mb-1 flex justify-between text-[13px] font-semibold">
          <span>{{ finding.label }}</span>
          <span>{{ pct(finding.matchPercent) }} %</span>
        </div>
        <div
          class="overflow-hidden"
          style="height: 7px; border-radius: 999px; background: var(--color-accent-2-200)"
          role="progressbar"
          :aria-valuenow="pct(finding.matchPercent)"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`${finding.label}: ${pct(finding.matchPercent)}%`"
        >
          <div
            style="height: 100%; border-radius: 999px; background: var(--color-accent-2-600)"
            :style="{ width: `${pct(finding.matchPercent)}%` }"
          />
        </div>
        <p v-if="finding.description" class="mt-1 text-[11.5px] leading-[1.45]">
          {{ finding.description }}
        </p>
      </div>
    </div>

    <div
      v-if="suggested"
      class="flex items-center justify-between gap-2.5 px-3 py-2.5"
      style="background: #fff; border-radius: 16px"
    >
      <span class="leading-[1.35]">
        <span class="block text-[13px] font-semibold">{{ i18n(suggested.name) }}</span>
        <span class="text-muted block text-[11px]">
          {{ $t('diag.suggested') }} · {{ $t('common.minutes', { n: suggested.durationMinutes }) }}
        </span>
      </span>
      <span class="whitespace-nowrap font-heading text-[15px]">
        {{ suggested.quoteOnly ? $t('common.quoteOnly') : `~ ${money(suggested.basePrice)}` }}
      </span>
    </div>

    <p class="text-[11px] leading-[1.45]" style="color: var(--color-accent-2-800)">
      {{ $t('diag.disclaimer') }}
    </p>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="btn btn-primary text-[12.5px]"
        style="min-height: 42px"
        @click="emit('book', top?.suggestedServiceCodes)"
      >
        {{ $t('diag.bookThis') }}
      </button>
    </div>
  </article>
</template>
