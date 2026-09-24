<script setup lang="ts">
/** Bo cuc trang quan tri — CP-04 va CP-05. */
</script>

<template>
  <div class="flex min-h-screen">
    <AdminSidebar class="sticky top-0 hidden h-screen flex-none md:flex" />
    <div class="flex min-w-0 flex-1 flex-col">
      <AdminTopbar />
      <main class="flex-1 px-4 py-5">
        <slot />
      </main>
    </div>
  </div>
</template>
