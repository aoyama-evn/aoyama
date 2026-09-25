<script setup lang="ts">
/**
 * CP-04 Thanh dieu huong trang quan tri.
 * Ban thiet ke: rong 186px, nen neutral-900, danh sach phang 12.5px khong chia
 * nhom va khong kem ma man hinh, nut "Quet ma QR" ghim duoi cung. Man hinh con
 * cua tung muc duoc vao tu chinh muc do chu khong len thanh dieu huong.
 */
const { t } = useI18n();
const auth = useAuthStore();

interface NavItem {
  to: string;
  /** Khoa ngon ngu cua nhan, vi du adm.nav.bookings. */
  label: string;
  /** Duong dan con van lam sang muc nay. */
  match?: string[];
  adminOnly?: boolean;
}

const ITEMS: NavItem[] = [
  { to: '/admin', label: 'adm.nav.dashboard' },
  { to: '/admin/bookings', label: 'adm.nav.bookings' },
  { to: '/admin/bookings/calendar', label: 'adm.nav.calendar' },
  { to: '/admin/scan', label: 'adm.nav.intake', match: ['/admin/work-orders'] },
  { to: '/admin/quotations', label: 'adm.nav.quotations' },
  { to: '/admin/customers', label: 'adm.nav.customers', match: ['/admin/vehicles'] },
  {
    to: '/admin/services',
    label: 'adm.nav.catalog',
    match: ['/admin/pricing', '/admin/parts', '/admin/inventory'],
  },
  { to: '/admin/tech-assistant', label: 'adm.nav.assistant', match: ['/admin/knowledge-base'] },
  { to: '/admin/stores', label: 'adm.nav.stores' },
  {
    to: '/admin/users',
    label: 'adm.nav.system',
    match: ['/admin/notifications', '/admin/settings', '/admin/audit-logs', '/admin/reports'],
    adminOnly: true,
  },
];

/** RD muc 8 — tai khoan STAFF khong thay muc chi danh cho ADMIN. */
const items = computed(() =>
  ITEMS.filter((item) => !item.adminOnly || auth.isSuperAdmin).map((item) => ({
    ...item,
    text: t(item.label),
  })),
);

const route = useRoute();

function isActive(item: NavItem): boolean {
  const path = route.path.replace(/\/$/, '') || '/admin';
  if (item.to === '/admin') return path === '/admin';
  // "Lich dang tuan" la duong dan con cua "Lich hen", nen phai xet truoc.
  if (item.to === '/admin/bookings') return path.startsWith('/admin/bookings') && !path.startsWith('/admin/bookings/calendar');
  return path.startsWith(item.to) || (item.match ?? []).some((m) => path.startsWith(m));
}
</script>

<template>
  <aside
    class="flex flex-col gap-1 overflow-y-auto px-3 py-[18px]"
    style="background: var(--color-neutral-900)"
  >
    <NuxtLink
      to="/admin"
      class="px-2 pb-3 font-heading text-[15px]"
      style="color: var(--color-accent-300)"
    >
      AOYAMA Admin
    </NuxtLink>

    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="ay-nav-item"
      :class="isActive(item) ? 'ay-nav-active' : ''"
      :aria-current="isActive(item) ? 'page' : undefined"
    >
      {{ item.text }}
    </NuxtLink>

    <NuxtLink to="/admin/scan" class="btn btn-primary mt-auto gap-[7px] text-[12.5px]">
      <svg
        width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.75" stroke-linecap="round" aria-hidden="true"
      >
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <path d="M14 14h3v3M21 21h.01M17 21h.01M21 17h.01" />
      </svg>
      {{ $t('adm.nav.scanQr') }}
    </NuxtLink>
  </aside>
</template>

<style scoped>
.ay-nav-item {
  border-radius: 10px;
  padding: 7px 10px;
  font-size: 12.5px;
  color: var(--color-neutral-100);
  transition: background 0.12s ease;
}
.ay-nav-item:hover {
  background: rgb(255 255 255 / 9%);
  text-decoration: none;
}
.ay-nav-active {
  background: rgb(255 255 255 / 15%);
  font-weight: 600;
  color: #fff;
}
</style>
