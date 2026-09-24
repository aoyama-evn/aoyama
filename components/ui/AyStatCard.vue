<script setup lang="ts">
/** CP-22 The chi so — con so lon, nhan, so sanh ky truoc. */
const props = defineProps<{
  label: string;
  value: string | number;
  hint?: string;
  delta?: number | null;
  tone?: 'default' | 'warning' | 'danger';
  to?: string;
}>();

const toneClass = computed(() => {
  if (props.tone === 'danger') return 'text-danger';
  if (props.tone === 'warning') return 'text-warning';
  return 'text-ink';
});

const deltaLabel = computed(() => {
  if (props.delta === null || props.delta === undefined) return null;
  const sign = props.delta > 0 ? '+' : '';
  return `${sign}${props.delta}% so với kỳ trước`;
});
</script>

<template>
  <component :is="to ? 'NuxtLink' : 'div'" :to="to" class="ay-card flex flex-col gap-1">
    <p class="text-[12.5px] font-semibold ay-muted">{{ label }}</p>
    <p class="font-heading text-[28px] leading-tight" :class="toneClass">{{ value }}</p>
    <p v-if="deltaLabel" class="text-[12px]" :class="(delta ?? 0) >= 0 ? 'text-success' : 'text-danger'">
      {{ deltaLabel }}
    </p>
    <p v-else-if="hint" class="text-[12px] ay-muted">{{ hint }}</p>
  </component>
</template>
