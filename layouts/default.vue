<script setup lang="ts">
/** Bo cuc site khach hang — CP-01 va CP-02. */
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <SiteHeader />
    <main class="mx-auto w-full max-w-content flex-1 px-4 py-6">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
