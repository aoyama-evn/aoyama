<script setup lang="ts">
/** Menu phu cua khu vuc tai khoan — SC-21, SC-29, SC-33, SC-34. */
const { t } = useI18n();

const LINKS = computed(() => [
  { to: '/account/bookings', label: t('account.bookings'), code: 'SC-21' },
  { to: '/account/vehicles', label: t('account.vehicles'), code: 'SC-29' },
  { to: '/account/profile', label: t('account.profile'), code: 'SC-33' },
  { to: '/account/settings', label: t('account.settings'), code: 'SC-34' },
]);
</script>

<template>
  <nav class="flex gap-1 overflow-x-auto pb-1" :aria-label="$t('account.area')">
    <NuxtLink
      v-for="link in LINKS" :key="link.to" :to="link.to"
      class="flex-none rounded-full px-4 py-2 text-[13.5px] transition-colors hover:bg-accent-200"
      active-class="bg-accent-200 font-semibold text-accent-800"
    >
      {{ link.label }}
    </NuxtLink>
  </nav>
</template>
