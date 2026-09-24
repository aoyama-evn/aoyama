<script setup lang="ts">
/**
 * CP-22 The chi so — SA-02, SA-36..SA-38.
 * Ban thiet ke: nen trang, nhan nho o tren, con so font-heading 34px, dong so
 * sanh mo 11.5px o duoi. The canh bao dung nen accent-100.
 */
const props = defineProps<{
  label: string;
  value: string | number;
  hint?: string;
  delta?: number | null;
  tone?: 'default' | 'warning' | 'danger';
  to?: string;
}>();

const deltaLabel = computed(() => {
  if (props.delta === null || props.delta === undefined) return null;
  return `${props.delta > 0 ? '+' : ''}${props.delta} so với kỳ trước`;
});

const background = computed(() =>
  props.tone === 'default' || !props.tone ? '#fff' : 'var(--color-accent-100)',
);
</script>

<template>
  <component
    :is="to ? 'NuxtLink' : 'div'"
    :to="to"
    class="card elev-sm items-start gap-1 text-left"
    :style="{ background }"
  >
    <div class="card-kicker">{{ label }}</div>
    <div
      class="font-heading text-[34px]"
      style="line-height: 1"
      :style="
        tone === 'danger'
          ? 'color: var(--color-danger)'
          : tone === 'warning'
            ? 'color: var(--color-warning)'
            : ''
      "
    >
      {{ value }}
    </div>
    <div v-if="deltaLabel" class="text-[11.5px] text-muted">{{ deltaLabel }}</div>
    <div v-else-if="hint" class="text-[11.5px] text-muted">{{ hint }}</div>
  </component>
</template>
