<script setup lang="ts">
/**
 * Bo cuc site khach hang.
 * Ban thiet ke ve theo khung dien thoai 392px, nen noi dung giu mot cot hep
 * can giua tren man hinh rong — dung ty le va nhip cua ban thiet ke.
 */
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <SiteHeader />
    <main class="sp-shell w-full flex-1 px-4 py-4">
      <slot />
    </main>
    <SiteFooter />
    <SiteMenu />
  </div>
</template>
