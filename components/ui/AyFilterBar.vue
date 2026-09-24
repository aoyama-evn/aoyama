<script setup lang="ts">
/** CP-07 Thanh loc va tim kiem — dung tren moi man hinh danh sach. */
defineProps<{ hasActiveFilters?: boolean }>();
const emit = defineEmits<{ (e: 'reset'): void }>();
</script>

<template>
  <div class="ay-card flex flex-wrap items-end gap-3">
    <slot />
    <button
      v-if="hasActiveFilters"
      type="button"
      class="ay-btn ay-btn-ghost ay-btn-sm ml-auto"
      @click="emit('reset')"
    >
      Xóa bộ lọc
    </button>
  </div>
</template>
