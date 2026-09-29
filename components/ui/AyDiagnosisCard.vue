<script setup lang="ts">
import type { DiagnosisFinding, ServiceItem } from '~/types/models';

/**
 * CP-16 The ket qua chan doan AI — SC-11.
 * Ban thiet ke: khung vien dut mau accent-2, mot thanh ty le cho moi kha nang,
 * o dich vu de xuat tren nen trang, roi cau nhac day chi la goi y (RK-01).
 *
 * Moi kha nang keo theo mot hoac nhieu hang muc dich vu. Khach tu tick nhung
 * hang muc muon lam — khong co gi tu vao gio, dung nguyen tac AI chi goi y con
 * nguoi quyet dinh.
 */
const props = withDefaults(
  defineProps<{
    findings: DiagnosisFinding[];
    vehicleLabel?: string | null;
    /** 'book' dan sang dat lich, 'add' them vao danh sach dang chon tai cho. */
    mode?: 'book' | 'add';
  }>(),
  { mode: 'book' },
);

const emit = defineEmits<{ (e: 'book', serviceCodes: string[]): void }>();

const api = useApi();
const { i18n, money } = useFormat();

const { data: services } = await useAsyncData('diagnosis-services', () =>
  api.get<ServiceItem[]>('/services'),
);

/**
 * Gop hang muc tu moi kha nang thanh mot danh sach khong trung. Mot hang muc
 * duoc nhieu kha nang cung de xuat thi lay muc khop cao nhat, roi xep giam dan
 * de cai dang ngo nhat nam tren.
 */
const options = computed(() => {
  const byCode = new Map<string, { service: ServiceItem; percent: number }>();
  for (const finding of props.findings) {
    for (const code of finding.suggestedServiceCodes ?? []) {
      const service = (services.value ?? []).find((s) => s.code === code);
      if (!service) continue;
      const current = byCode.get(code);
      if (!current || finding.matchPercent > current.percent) {
        byCode.set(code, { service, percent: finding.matchPercent });
      }
    }
  }
  return [...byCode.values()].sort((a, b) => b.percent - a.percent);
});

const chosen = ref<string[]>([]);

// Doi ket qua chan doan thi bo lua chon cu, tranh mang theo hang muc khong con
// duoc de xuat nua.
watch(options, () => {
  chosen.value = chosen.value.filter((code) => options.value.some((o) => o.service.code === code));
});

function toggle(code: string): void {
  chosen.value = chosen.value.includes(code)
    ? chosen.value.filter((x) => x !== code)
    : [...chosen.value, code];
}

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

    <!-- Cac kha nang kem muc do khop -->
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

    <!-- Hang muc de xuat — khach tu tick nhung cai muon lam -->
    <template v-if="options.length">
      <p class="text-[11.5px] font-semibold" style="color: var(--color-accent-2-800)">
        {{ $t('diag.pickItems') }}
      </p>

      <label
        v-for="option in options"
        :key="option.service.code"
        class="flex cursor-pointer items-start gap-2.5 px-3 py-2.5"
        style="background: #fff; border-radius: 16px"
        :style="
          chosen.includes(option.service.code)
            ? 'box-shadow: inset 0 0 0 1.5px var(--color-accent-2-500)'
            : undefined
        "
      >
        <input
          type="checkbox"
          class="mt-1 h-4 w-4 flex-none"
          style="accent-color: var(--color-accent-2-600)"
          :checked="chosen.includes(option.service.code)"
          @change="toggle(option.service.code)"
        />
        <span class="min-w-0 flex-1 leading-[1.35]">
          <span class="block text-[13px] font-semibold">{{ i18n(option.service.name) }}</span>
          <span class="text-muted block text-[11px]">
            {{ pct(option.percent) }} % ·
            {{ $t('common.minutes', { n: option.service.durationMinutes }) }}
          </span>
        </span>
        <span class="whitespace-nowrap font-heading text-[14px]">
          {{
            option.service.quoteOnly
              ? $t('common.quoteOnly')
              : `~ ${money(option.service.basePrice)}`
          }}
        </span>
      </label>
    </template>

    <p v-else class="text-[11.5px]" style="color: var(--color-accent-2-800)">
      {{ $t('diag.noItems') }}
    </p>

    <p class="text-[11px] leading-[1.45]" style="color: var(--color-accent-2-800)">
      {{ $t('diag.disclaimer') }}
    </p>

    <div v-if="options.length" class="flex flex-wrap gap-2">
      <button
        type="button"
        class="btn btn-primary text-[12.5px]"
        style="min-height: 42px"
        :disabled="chosen.length === 0"
        @click="emit('book', chosen)"
      >
        {{
          mode === 'add'
            ? $t('diag.addCount', { n: chosen.length })
            : $t('diag.bookCount', { n: chosen.length })
        }}
      </button>
    </div>
  </article>
</template>
