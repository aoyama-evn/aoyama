<script setup lang="ts">
/**
 * Nhan "Goi y boi AI" — OV-2026-001 muc 9, nguyen tac 1.
 * Moi ket qua do AI sinh ra deu phai deo nhan nay, kem do tin cay khi co.
 */
defineProps<{ confidence?: number | null }>();
</script>

<template>
  <span class="ay-tag bg-teal-100 text-teal-800">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 3 1-5a8 8 0 1 1 17-6Z" />
    </svg>
    Gợi ý bởi AI<template v-if="confidence != null"> · {{ Math.round(confidence) }}%</template>
  </span>
</template>
