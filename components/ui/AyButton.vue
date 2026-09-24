<script setup lang="ts">
/**
 * Nut dung chung, bam theo bo lop cua ban thiet ke.
 * size "cta" la nut chinh cua mot man hinh: rong het dong, cao 48px.
 */
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'md' | 'sm' | 'cta';
    type?: 'button' | 'submit' | 'reset';
    to?: string;
    disabled?: boolean;
    loading?: boolean;
    block?: boolean;
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
);

const VARIANT: Record<NonNullable<typeof props.variant>, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

const classes = computed(() => [
  'btn',
  VARIANT[props.variant],
  props.size === 'sm' ? 'text-[12.5px]' : '',
  props.size === 'cta' ? 'btn-cta' : '',
  props.block ? 'btn-block' : '',
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
      class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot v-else name="icon" />
    <slot />
  </button>
</template>
