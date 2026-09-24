<script setup lang="ts">
/** Nut dung chung. Chieu cao toi thieu 48px theo C-05. */
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'md' | 'sm';
    type?: 'button' | 'submit' | 'reset';
    to?: string;
    disabled?: boolean;
    loading?: boolean;
    block?: boolean;
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
);

const classes = computed(() => [
  'ay-btn',
  `ay-btn-${props.variant}`,
  props.size === 'sm' ? 'ay-btn-sm' : '',
  props.block ? 'w-full' : '',
]);
</script>

<template>
  <NuxtLink v-if="to && !disabled" :to="to" :class="classes">
    <slot name="icon" />
    <slot />
  </NuxtLink>
  <button v-else :type="type" :class="classes" :disabled="disabled || loading">
    <span
      v-if="loading"
      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot v-else name="icon" />
    <slot />
  </button>
</template>
