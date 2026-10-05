<script setup lang="ts">
/**
 * Thanh chuyen giua bon man du lieu nen: dich vu, bang gia, phu tung, kho.
 *
 * Muc "Danh muc" o cot ben trai chi dan sang man Dich vu, con ba man kia
 * khong co duong nao di toi — phu tung va kho coi nhu khong ton tai voi
 * nguoi dung du da dung xong. Dat thanh nay tren dau ca bon man.
 */
const route = useRoute();

const TABS = [
  { to: '/admin/services', label: 'adm.cat.services' },
  { to: '/admin/pricing', label: 'adm.cat.pricing' },
  { to: '/admin/parts', label: 'adm.cat.parts' },
  { to: '/admin/inventory', label: 'adm.cat.inventory' },
];

function active(to: string): boolean {
  return route.path === to || route.path.startsWith(`${to}/`);
}
</script>

<template>
  <nav class="flex flex-wrap gap-2" :aria-label="$t('adm.cat.nav')">
    <NuxtLink
      v-for="tab in TABS"
      :key="tab.to"
      :to="tab.to"
      class="tag"
      :style="
        active(tab.to)
          ? 'background: var(--color-accent); color: #fff'
          : 'background: #fff; color: var(--color-neutral-800)'
      "
      :aria-current="active(tab.to) ? 'page' : undefined"
    >
      {{ $t(tab.label) }}
    </NuxtLink>
  </nav>
</template>
