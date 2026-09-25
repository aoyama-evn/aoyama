<script setup lang="ts">
/**
 * Bieu do cot cua SA-02 va cac man hinh bao cao.
 * Ve thang bang SVG — bo du lieu nho, khong dang keo them mot thu vien bieu do
 * vao goi tai ve. Bieu do cuon ngang trong khung cha khi man hinh hep.
 */
const props = withDefaults(
  defineProps<{
    data: { label: string; value: number }[];
    /** Ham dinh dang nhan gia tri tren dinh cot. */
    format?: (value: number) => string;
    ariaLabel?: string;
  }>(),
  { ariaLabel: 'Biểu đồ cột' },
);

const W = 760;
const H = 240;
const LEFT = 58;
const RIGHT = 14;
const TOP = 26;
const BASE = 210;

const max = computed(() => Math.max(1, ...props.data.map((d) => d.value)));

/** Bon duong ke ngang, lam tron len cho de doc. */
const gridlines = computed(() =>
  [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    y: BASE - ratio * (BASE - TOP),
    value: Math.round(max.value * ratio),
  })),
);

const bars = computed(() => {
  const count = props.data.length || 1;
  const span = (W - LEFT - RIGHT) / count;
  const width = Math.min(60, span * 0.62);
  return props.data.map((item, index) => {
    const height = (item.value / max.value) * (BASE - TOP);
    const center = LEFT + span * index + span / 2;
    return {
      ...item,
      x: center - width / 2,
      y: BASE - height,
      width,
      height,
      center,
    };
  });
});

function short(value: number): string {
  if (props.format) return props.format(value);
  return value >= 1000 ? `¥${Math.round(value / 100) / 10}k` : `¥${value}`;
}
</script>

<template>
  <div class="overflow-x-auto">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      style="width: 760px; min-width: 760px; height: 240px; display: block"
      class="font-body"
      role="img"
      :aria-label="ariaLabel"
    >
      <template v-for="line in gridlines" :key="line.ratio">
        <line
          :x1="LEFT" :y1="line.y" :x2="W - RIGHT" :y2="line.y"
          stroke="var(--color-divider)" stroke-width="1"
        />
        <text
          :x="LEFT - 9" :y="line.y + 4" text-anchor="end" font-size="10.5"
          fill="var(--color-neutral-600)"
        >
          {{ short(line.value) }}
        </text>
      </template>

      <line
        :x1="LEFT" :y1="BASE" :x2="W - RIGHT" :y2="BASE"
        stroke="var(--color-neutral-400)" stroke-width="1.5"
      />

      <template v-for="bar in bars" :key="bar.label">
        <rect
          :x="bar.x" :y="bar.y" :width="bar.width" :height="bar.height" rx="8"
          fill="var(--color-accent-300)"
        />
        <text
          :x="bar.center" :y="bar.y - 6" text-anchor="middle" font-size="10.5"
          font-weight="700" fill="var(--color-neutral-700)"
        >
          {{ short(bar.value) }}
        </text>
        <text
          :x="bar.center" :y="BASE + 18" text-anchor="middle" font-size="11"
          fill="var(--color-neutral-700)"
        >
          {{ bar.label }}
        </text>
      </template>
    </svg>
  </div>
</template>
