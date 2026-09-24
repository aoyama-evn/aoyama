<script setup lang="ts">
/** Tieu de trang dung chung cho ca hai site: ma man hinh, ten, mo ta, hanh dong. */
defineProps<{ code?: string; title: string; description?: string; backTo?: string }>();
</script>

<template>
  <header class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <NuxtLink v-if="backTo" :to="backTo" class="ay-btn ay-btn-ghost ay-btn-sm -ml-2 mb-1">
        ← Quay lại
      </NuxtLink>
      <p v-if="code" class="ay-kicker">{{ code }}</p>
      <h1 class="font-heading text-[22px]">{{ title }}</h1>
      <p v-if="description" class="mt-0.5 max-w-prose text-[13.5px] ay-muted">{{ description }}</p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
