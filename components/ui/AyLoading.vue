<script setup lang="ts">
defineProps<{ label?: string }>();
</script>

<template>
  <div class="flex items-center justify-center gap-2 py-10 text-muted" role="status">
    <span
      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    {{ label ?? 'Đang tải…' }}
  </div>
</template>
