<script setup lang="ts">
/** Bo cuc trang quan tri — CP-04 va CP-05, noi dung dem 20px 22px 28px. */
</script>

<template>
  <div class="flex min-h-screen" style="background: var(--color-bg)">
    <AdminSidebar class="sticky top-0 hidden h-screen flex-none md:flex" />
    <div class="flex min-w-0 flex-1 flex-col">
      <AdminTopbar />
      <main class="flex-1 overflow-x-hidden px-[22px] pb-7 pt-5">
        <slot />
      </main>
    </div>
  </div>
</template>
