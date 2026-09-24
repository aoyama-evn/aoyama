<script setup lang="ts">
/** Bo cuc man hinh dang nhap, dang ky, nhap OTP — khong co menu de bot xao nhang. */
</script>

<template>
  <div class="flex min-h-screen flex-col bg-neutral-200">
    <div class="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <NuxtLink to="/" class="mb-6 text-center">
        <span class="block font-heading text-[20px] text-accent-700">AOYAMA Service</span>
        <span class="block text-[11.5px] ay-muted">バイクの整備・修理</span>
      </NuxtLink>
      <slot />
      <div class="mt-6 flex justify-center"><AyLangSwitcher /></div>
    </div>
  </div>
</template>
