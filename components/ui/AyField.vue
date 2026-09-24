<script setup lang="ts">
/** Vo boc cho mot o nhap: nhan, goi y, thong bao loi. Gan nhan bang for/id. */
const props = defineProps<{
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  for?: string;
}>();

const id = computed(() => props.for ?? `f-${useId()}`);
</script>

<template>
  <div class="flex flex-col">
    <label v-if="label" class="ay-label" :for="id">
      {{ label }}
      <span v-if="required" class="text-danger" aria-hidden="true">*</span>
    </label>
    <slot :id="id" :invalid="Boolean(error)" />
    <p v-if="error" class="ay-error">{{ error }}</p>
    <p v-else-if="hint" class="ay-hint">{{ hint }}</p>
  </div>
</template>
