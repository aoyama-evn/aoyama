<script setup lang="ts">
/** CP-26 Trang thai rong — luon giai thich va goi y hanh dong tiep theo. */
defineProps<{ title: string; hint?: string; icon?: string }>();
</script>

<template>
  <div class="flex flex-col items-center gap-2 px-6 py-12 text-center">
    <span class="grid h-12 w-12 place-items-center rounded-full bg-neutral-200 text-xl" aria-hidden="true">
      {{ icon ?? '—' }}
    </span>
    <p class="font-heading text-[15px]">{{ title }}</p>
    <p v-if="hint" class="max-w-prose text-[13px] ay-muted">{{ hint }}</p>
    <div class="mt-2"><slot /></div>
  </div>
</template>
