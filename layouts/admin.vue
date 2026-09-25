<script setup lang="ts">
/**
 * Bo cuc trang quan tri — CP-04 va CP-05.
 *
 * Ban thiet ke ve mot tam the bo tron noi tren nen neutral-200. Day la ung dung
 * cho may tinh nen tam the gian theo be rong that (xem .admin-page trong
 * main.css): co vien tu 1024px, chan lai o 1720px de bang du lieu khong bi keo
 * qua dai tren man 1920.
 *
 * Duoi 1024px — man hinh laptop nho dat doc hoac may tinh bang — thanh dieu
 * huong thu vao thanh ngan keo, mo bang nut o CP-05.
 */
const navOpen = ref(false);
const route = useRoute();

// Doi trang thi dong ngan keo, khong de no treo tren man hinh moi.
watch(() => route.fullPath, () => {
  navOpen.value = false;
});
</script>

<template>
  <div class="admin-page">
    <div class="admin-shell">
      <AdminSidebar class="admin-nav hidden lg:flex" />

      <div class="flex min-w-0 flex-1 flex-col">
        <AdminTopbar @open-nav="navOpen = true" />
        <main class="admin-main flex-1 overflow-x-hidden">
          <slot />
        </main>
      </div>
    </div>

    <!-- Ngan keo dieu huong cho man hinh hep -->
    <Teleport to="body">
      <Transition name="ay-drawer">
        <div
          v-if="navOpen"
          class="fixed inset-0 z-[60] flex lg:hidden"
          style="background: rgb(32 30 29 / 50%)"
          role="dialog"
          aria-modal="true"
          aria-label="Điều hướng trang quản trị"
          @click.self="navOpen = false"
        >
          <AdminSidebar class="admin-nav flex h-full" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.ay-drawer-enter-active,
.ay-drawer-leave-active {
  transition: opacity 0.16s ease;
}
.ay-drawer-enter-from,
.ay-drawer-leave-to {
  opacity: 0;
}
</style>
