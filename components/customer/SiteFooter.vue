<script setup lang="ts">
/**
 * CP-02 Chan trang site khach hang.
 * Ban thiet ke chi de mot dong ban quyen can giua co duong ke tren — khong co
 * khoi lien ket. Dieu huong con lai nam trong ngan keo menu cua CP-01.
 */
const year = new Date().getFullYear();
</script>

<template>
  <footer class="sp-shell ay-safe-bottom px-4 pb-6">
    <p
      class="text-muted pt-2.5 text-center text-[11px] leading-[1.5]"
      style="border-top: 1px solid var(--color-divider)"
    >
      © {{ year }} 遠鉄グループ AOYAMA. All Rights Reserved.
    </p>
  </footer>
</template>
