<script setup lang="ts">
/** CP-01 Dau trang site khach hang. */
const auth = useAuthStore();
const route = useRoute();
const mobileOpen = ref(false);

const NAV = [
  { to: '/services', label: 'Dịch vụ' },
  { to: '/pricing', label: 'Bảng giá' },
  { to: '/stores', label: 'Cửa hàng' },
  { to: '/faq', label: 'Hỏi đáp' },
  { to: '/contact', label: 'Liên hệ' },
];

// Dong menu di dong moi khi chuyen trang, tranh menu con mo de len noi dung.
watch(() => route.fullPath, () => { mobileOpen.value = false; });
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-divider bg-surface/95 backdrop-blur ay-safe-top">
    <div class="mx-auto flex max-w-content items-center gap-3 px-4 py-2.5">
      <NuxtLink to="/" class="flex flex-col leading-tight">
        <span class="font-heading text-[17px] text-accent-700">AOYAMA Service</span>
        <span class="text-[10.5px] ay-muted">バイクの整備・修理</span>
      </NuxtLink>

      <nav class="ml-6 hidden items-center gap-1 lg:flex" aria-label="Menu chính">
        <NuxtLink
          v-for="item in NAV" :key="item.to" :to="item.to"
          class="rounded-full px-3 py-2 text-[14px] transition-colors hover:bg-accent-200"
          active-class="bg-accent-200 font-semibold text-accent-800"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="ml-auto flex items-center gap-2">
        <AyLangSwitcher class="hidden sm:block" />

        <NuxtLink v-if="auth.isCustomer" to="/account/bookings" class="ay-btn ay-btn-secondary ay-btn-sm">
          {{ auth.user?.name || 'Tài khoản' }}
        </NuxtLink>
        <NuxtLink v-else to="/login" class="ay-btn ay-btn-secondary ay-btn-sm hidden sm:inline-flex">
          Đăng nhập
        </NuxtLink>

        <NuxtLink to="/booking/step1" class="ay-btn ay-btn-primary ay-btn-sm">Đặt lịch</NuxtLink>

        <button
          type="button" class="ay-btn ay-btn-secondary ay-btn-sm lg:hidden"
          :aria-expanded="mobileOpen" aria-label="Mở menu"
          @click="mobileOpen = !mobileOpen"
        >
          ☰
        </button>
      </div>
    </div>

    <nav v-if="mobileOpen" class="border-t border-divider lg:hidden" aria-label="Menu di động">
      <ul class="mx-auto flex max-w-content flex-col px-4 py-2">
        <li v-for="item in NAV" :key="item.to">
          <NuxtLink :to="item.to" class="block py-3 text-[15px]" active-class="font-semibold text-accent-800">
            {{ item.label }}
          </NuxtLink>
        </li>
        <li v-if="!auth.isCustomer">
          <NuxtLink to="/login" class="block py-3 text-[15px]">Đăng nhập</NuxtLink>
        </li>
        <li class="py-2"><AyLangSwitcher /></li>
      </ul>
    </nav>
  </header>
</template>
