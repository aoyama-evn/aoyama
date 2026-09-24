<script setup lang="ts">
/**
 * CP-07 Thanh loc va tim kiem.
 * Ban thiet ke xep cac o loc thanh mot hang chay tran, khong boc trong the.
 */
defineProps<{ hasActiveFilters?: boolean }>();
const emit = defineEmits<{ (e: 'reset'): void }>();
</script>

<template>
  <div class="flex flex-wrap items-end gap-2.5">
    <slot />
    <button
      v-if="hasActiveFilters"
      type="button"
      class="btn btn-ghost ml-auto text-[12.5px]"
      @click="emit('reset')"
    >
      Xóa bộ lọc
    </button>
  </div>
</template>
