<script setup lang="ts">
/**
 * Bo cuc cho SC-10. Ban thiet ke ve man hinh tro chuyen chiem tron chieu cao
 * khung: dau trang o tren, khung tin nhan cuon o giua, o soan ghim duoi — nen
 * khong dung dem va chan trang cua bo cuc thuong.
 */
</script>

<template>
  <div class="flex h-[100dvh] flex-col">
    <SiteHeader />
    <main class="sp-shell flex min-h-0 w-full flex-1 flex-col">
      <slot />
    </main>
    <SiteMenu />
  </div>
</template>
