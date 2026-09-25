<script setup lang="ts">
/**
 * Hang the loc co so dem — SA-15, SA-22, SA-25, SA-39.
 * Ban thiet ke: nhan chu nho viet hoa ben trai, the dang vien thuoc, the dang
 * chon to mau accent voi chu nen, so dem mo hon o ben canh nhan.
 */
defineProps<{
  label?: string;
  modelValue: string;
  options: { value: string; label: string; count?: number }[];
}>();

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();
</script>

<template>
  <span
    v-if="label"
    class="mr-0.5 text-[10px] uppercase"
    style="letter-spacing: 0.09em; color: var(--color-neutral-600)"
  >
    {{ label }}
  </span>

  <button
    v-for="option in options"
    :key="option.value"
    type="button"
    class="ay-chip"
    :class="modelValue === option.value ? 'ay-chip-on' : ''"
    :aria-pressed="modelValue === option.value"
    @click="emit('update:modelValue', option.value)"
  >
    {{ option.label }}
    <span v-if="option.count !== undefined" style="opacity: 0.6">{{ option.count }}</span>
  </button>
</template>

<style scoped>
.ay-chip {
  border-radius: 999px;
  background: var(--color-surface);
  padding: 5px 13px;
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text);
}
.ay-chip:hover {
  background: var(--color-accent-200);
}
.ay-chip-on {
  background: var(--color-accent);
  font-weight: 700;
  color: var(--color-bg);
}
.ay-chip-on:hover {
  background: var(--color-accent);
}
</style>
