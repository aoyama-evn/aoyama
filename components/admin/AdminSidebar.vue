<script setup lang="ts">
/**
 * CP-04 Thanh dieu huong trang quan tri.
 * Ban thiet ke: rong 186px, nen neutral-900, muc menu phang co 12.5px khong kem
 * ma man hinh, nhom duoc ngan bang dong chu mo, nut "Quet ma QR" ghim duoi cung.
 */
const auth = useAuthStore();

interface NavItem {
  to: string;
  label: string;
  adminOnly?: boolean;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    items: [
      { to: '/admin', label: 'Bảng điều khiển' },
      { to: '/admin/bookings', label: 'Lịch hẹn' },
      { to: '/admin/work-orders', label: 'Phiếu dịch vụ' },
      { to: '/admin/quotations', label: 'Báo giá' },
    ],
  },
  {
    label: 'Khách hàng',
    items: [
      { to: '/admin/customers', label: 'Hồ sơ khách hàng' },
      { to: '/admin/vehicles', label: 'Phương tiện' },
    ],
  },
  {
    label: 'Danh mục',
    items: [
      { to: '/admin/services', label: 'Dịch vụ' },
      { to: '/admin/pricing', label: 'Bảng giá' },
      { to: '/admin/parts', label: 'Phụ tùng' },
      { to: '/admin/inventory', label: 'Tồn kho' },
    ],
  },
  {
    label: 'Trợ lý AI',
    items: [
      { to: '/admin/tech-assistant', label: 'Trợ lý kỹ thuật' },
      { to: '/admin/knowledge-base', label: 'Kho tài liệu' },
    ],
  },
  {
    label: 'Cửa hàng',
    items: [{ to: '/admin/stores', label: 'Cửa hàng & khung giờ' }],
  },
  {
    label: 'Báo cáo',
    items: [
      { to: '/admin/reports', label: 'Tổng hợp' },
      { to: '/admin/reports/revenue', label: 'Doanh thu' },
      { to: '/admin/reports/parts', label: 'Phụ tùng & tồn kho' },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      { to: '/admin/users', label: 'Tài khoản', adminOnly: true },
      { to: '/admin/notifications/templates', label: 'Mẫu thông báo' },
      { to: '/admin/notifications/logs', label: 'Nhật ký thông báo' },
      { to: '/admin/settings', label: 'Cấu hình', adminOnly: true },
      { to: '/admin/audit-logs', label: 'Nhật ký thao tác', adminOnly: true },
    ],
  },
];

/** RD muc 8 — tai khoan STAFF khong thay cac muc chi danh cho ADMIN. */
const groups = computed(() =>
  GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.adminOnly || auth.isSuperAdmin),
  })).filter((group) => group.items.length > 0),
);
</script>

<template>
  <aside
    class="flex flex-col gap-1 overflow-y-auto px-3 py-4"
    style="width: 186px; background: var(--color-neutral-900)"
  >
    <NuxtLink
      to="/admin"
      class="px-2 pb-3 font-heading text-[15px]"
      style="color: var(--color-accent-300)"
    >
      AOYAMA Admin
    </NuxtLink>

    <template v-for="(group, gi) in groups" :key="gi">
      <div
        v-if="group.label"
        class="px-2.5 pt-2.5 text-[12.5px]"
        style="color: var(--color-neutral-500)"
      >
        {{ group.label }}
      </div>

      <NuxtLink
        v-for="item in group.items"
        :key="item.to"
        :to="item.to"
        class="rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors"
        style="color: var(--color-neutral-100)"
        active-class="ay-nav-active"
      >
        {{ item.label }}
      </NuxtLink>
    </template>

    <NuxtLink to="/admin/scan" class="btn btn-primary mt-auto gap-2 text-[12.5px]">
      <svg
        width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.75" stroke-linecap="round" aria-hidden="true"
      >
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <path d="M14 14h3v3M21 21h.01M17 21h.01M21 17h.01" />
      </svg>
      Quét mã QR
    </NuxtLink>
  </aside>
</template>

<style scoped>
a:hover {
  background: rgb(255 255 255 / 9%);
  text-decoration: none;
}
a.ay-nav-active {
  background: rgb(255 255 255 / 15%);
  font-weight: 600;
  color: #fff;
}
</style>
