<script setup lang="ts">
/**
 * Bo cuc man hinh dang nhap quan tri — SA-01 va SA-01b.
 * Ban thiet ke ve mot the toi (neutral-900) rong toi da 430px, can giua tren
 * nen neutral-200, khong co dieu huong de bot xao nhang.
 */
</script>

<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center px-4 py-10"
    style="background: var(--color-neutral-200)"
  >
    <div
      class="flex w-full flex-col gap-3.5 px-[26px] pb-[26px] pt-7"
      style="
        max-width: 430px;
        background: var(--color-neutral-900);
        border-radius: 26px;
        box-shadow: var(--shadow-lg);
      "
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
/** Chu tren nen toi: nhan o nhap va chu phu deu phai sang len. */
:deep(.field > label),
:deep(.label) {
  color: var(--color-neutral-300);
}
</style>
