<script setup lang="ts">
/**
 * Nhan "Goi y boi AI" — OV-2026-001 muc 9, nguyen tac 1.
 * Ban thiet ke dung nen dam accent-2-500 chu trang cho nhan nay.
 */
defineProps<{ confidence?: number | null; solid?: boolean }>();
</script>

<template>
  <span
    class="tag"
    :class="solid ? '' : 'tag-accent-2'"
    :style="solid ? 'background: var(--color-accent-2-500); color: #fff' : ''"
  >
    <span aria-hidden="true">✦</span>
    Gợi ý bởi AI<template v-if="confidence != null"> · {{ Math.round(confidence) }}%</template>
  </span>
</template>
