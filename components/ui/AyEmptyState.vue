<script setup lang="ts">
/** CP-26 Trang thai rong — luon giai thich va goi y hanh dong tiep theo. */
defineProps<{ title: string; hint?: string }>();
</script>

<template>
  <div class="flex flex-col items-center gap-1.5 px-6 py-10 text-center">
    <p class="font-heading text-[15px]">{{ title }}</p>
    <p v-if="hint" class="max-w-prose text-[12.5px] text-muted">{{ hint }}</p>
    <div class="mt-2"><slot /></div>
  </div>
</template>
