<script setup lang="ts">
/**
 * Bieu do cot cua SA-02 va cac man hinh bao cao.
 *
 * Ve thang bang SVG — bo du lieu nho, khong dang keo them mot thu vien bieu do
 * vao goi tai ve. Chieu rong do theo the chua nen tren man 1920 bieu do trai
 * het the ma chu van dung co, khong bi keo gian nhu khi phong to mot viewBox
 * co dinh.
 */
const props = withDefaults(
  defineProps<{
    data: { label: string; value: number }[];
    /** Ham dinh dang nhan gia tri tren dinh cot. */
    format?: (value: number) => string;
    ariaLabel?: string;
    /** Cot cuoi cung — thuong la hom nay — to dam hon cho de nhin. */
    highlightLast?: boolean;
  }>(),
  { ariaLabel: 'Biểu đồ cột', highlightLast: true },
);

const host = ref<HTMLElement | null>(null);
const { width: hostWidth } = useElementSize(host);

const H = 240;
const LEFT = 58;
const RIGHT = 14;
const TOP = 26;
const BASE = 210;
const MIN_W = 520;

const width = computed(() => Math.max(MIN_W, Math.round(hostWidth.value) || MIN_W));

/**
 * Chia truc doc thanh bon bac tron so, de nhan doc ra la mot con so dep chu
 * khong phai mot phan tu cua gia tri lon nhat.
 */
const axisMax = computed(() => {
  const raw = Math.max(1, ...props.data.map((d) => d.value));
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = magnitude / 2;
  return Math.ceil(raw / step) * step;
});

const gridlines = computed(() =>
  [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    y: BASE - ratio * (BASE - TOP),
    value: Math.round(axisMax.value * ratio),
  })),
);

const bars = computed(() => {
  const count = props.data.length || 1;
  const span = (width.value - LEFT - RIGHT) / count;
  const barWidth = Math.min(64, span * 0.46);
  return props.data.map((item, index) => {
    const height = (item.value / axisMax.value) * (BASE - TOP);
    const center = LEFT + span * index + span / 2;
    return {
      ...item,
      x: center - barWidth / 2,
      y: BASE - height,
      width: barWidth,
      height,
      center,
      strong: props.highlightLast && index === count - 1,
    };
  });
});

function short(value: number): string {
  if (props.format) return props.format(value);
  if (value >= 1000) {
    const k = value / 1000;
    return `¥${k >= 100 ? Math.round(k) : Math.round(k * 10) / 10}k`;
  }
  return `¥${value}`;
}
</script>

<template>
  <div ref="host" class="w-full overflow-x-auto">
    <svg
      :viewBox="`0 0 ${width} ${H}`"
      :style="{ width: `${width}px`, height: `${H}px`, display: 'block' }"
      class="font-body"
      role="img"
      :aria-label="ariaLabel"
    >
      <template v-for="line in gridlines" :key="line.ratio">
        <line
          :x1="LEFT" :y1="line.y" :x2="width - RIGHT" :y2="line.y"
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
        :x1="LEFT" :y1="BASE" :x2="width - RIGHT" :y2="BASE"
        stroke="var(--color-neutral-400)" stroke-width="1.5"
      />

      <template v-for="bar in bars" :key="bar.label">
        <rect
          :x="bar.x" :y="bar.y" :width="bar.width" :height="bar.height" rx="8"
          :fill="bar.strong ? 'var(--color-accent)' : 'var(--color-accent-300)'"
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
