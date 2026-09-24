<script setup lang="ts">
/** Menu phu cua khu vuc tai khoan — SC-21, SC-29, SC-33, SC-34. */
const LINKS = [
  { to: '/account/bookings', label: 'Lịch hẹn', code: 'SC-21' },
  { to: '/account/vehicles', label: 'Xe của tôi', code: 'SC-29' },
  { to: '/account/profile', label: 'Hồ sơ', code: 'SC-33' },
  { to: '/account/settings', label: 'Cài đặt', code: 'SC-34' },
];
</script>

<template>
  <nav class="flex gap-1 overflow-x-auto pb-1" aria-label="Khu vực tài khoản">
    <NuxtLink
      v-for="link in LINKS" :key="link.to" :to="link.to"
      class="flex-none rounded-full px-4 py-2 text-[13.5px] transition-colors hover:bg-accent-200"
      active-class="bg-accent-200 font-semibold text-accent-800"
    >
      {{ link.label }}
    </NuxtLink>
  </nav>
</template>
