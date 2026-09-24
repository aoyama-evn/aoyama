<script setup lang="ts">
/**
 * CP-01 Dau trang site khach hang.
 * Ban thiet ke chi de ba thu o day: chu AOYAMA, bo chuyen ngon ngu dang nut gat,
 * va nut Dat lich. Khong co thanh menu ngang — dieu huong con lai nam trong noi
 * dung tung man hinh.
 */
const auth = useAuthStore();
</script>

<template>
  <header
    class="sticky top-0 z-40 ay-safe-top"
    style="background: var(--color-bg); border-bottom: 1px solid var(--color-divider)"
  >
    <div class="sp-shell flex items-center gap-2.5 px-4 py-2">
      <NuxtLink
        to="/"
        class="font-heading text-[16px]"
        style="color: var(--color-accent-700)"
      >
        AOYAMA
      </NuxtLink>

      <div class="ml-auto flex items-center gap-1.5">
        <AyLangSwitcher />

        <NuxtLink
          v-if="auth.isCustomer"
          to="/account/bookings"
          class="btn btn-secondary px-3 text-[12px]"
          style="min-height: 34px"
        >
          {{ auth.user?.name?.split(' ').at(-1) || 'Tài khoản' }}
        </NuxtLink>

        <NuxtLink
          to="/booking/step1"
          class="btn btn-primary px-3 text-[12px]"
          style="min-height: 34px"
        >
          Đặt lịch
        </NuxtLink>
      </div>
    </div>
  </header>
</template>
