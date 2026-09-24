<script setup lang="ts">
/**
 * CP-04 Thanh dieu huong trang quan tri.
 * Nhom menu bam theo danh muc module M-01..M-19 de nguoi dung tim theo dung
 * cach tai lieu mo ta cong viec.
 */
const ui = useUiStore();
const auth = useAuthStore();

interface NavItem {
  to: string;
  label: string;
  code: string;
  adminOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: 'Tổng quan',
    items: [{ to: '/admin', label: 'Bảng điều khiển', code: 'SA-02' }],
  },
  {
    label: 'Lịch hẹn',
    items: [
      { to: '/admin/bookings', label: 'Danh sách lịch hẹn', code: 'SA-03' },
      { to: '/admin/bookings/calendar', label: 'Lịch theo ngày', code: 'SA-04' },
      { to: '/admin/bookings/new', label: 'Đặt thay khách', code: 'SA-06' },
    ],
  },
  {
    label: 'Tiếp nhận & phiếu dịch vụ',
    items: [
      { to: '/admin/scan', label: 'Quét mã QR', code: 'SA-07' },
      { to: '/admin/work-orders', label: 'Phiếu dịch vụ', code: 'SA-09' },
      { to: '/admin/quotations', label: 'Báo giá', code: 'SA-13' },
    ],
  },
  {
    label: 'Khách hàng & xe',
    items: [
      { to: '/admin/customers', label: 'Khách hàng', code: 'SA-15' },
      { to: '/admin/customers/merge', label: 'Gộp hồ sơ', code: 'SA-18' },
      { to: '/admin/vehicles', label: 'Phương tiện', code: 'SA-19' },
    ],
  },
  {
    label: 'Danh mục',
    items: [
      { to: '/admin/services', label: 'Dịch vụ', code: 'SA-22' },
      { to: '/admin/pricing', label: 'Bảng giá', code: 'SA-24' },
      { to: '/admin/parts', label: 'Phụ tùng', code: 'SA-25' },
      { to: '/admin/parts/ai-import', label: 'Nhập phụ tùng bằng AI', code: 'SA-27' },
      { to: '/admin/inventory', label: 'Tồn kho', code: 'SA-28' },
      { to: '/admin/inventory/transactions', label: 'Nhập xuất kho', code: 'SA-29' },
    ],
  },
  {
    label: 'Trợ lý AI',
    items: [
      { to: '/admin/tech-assistant', label: 'Trợ lý kỹ thuật', code: 'SA-30' },
      { to: '/admin/knowledge-base', label: 'Kho tài liệu', code: 'SA-31' },
    ],
  },
  {
    label: 'Cửa hàng',
    items: [{ to: '/admin/stores', label: 'Cửa hàng & lịch làm việc', code: 'SA-32' }],
  },
  {
    label: 'Báo cáo',
    items: [
      { to: '/admin/reports', label: 'Tổng hợp', code: 'SA-36' },
      { to: '/admin/reports/revenue', label: 'Doanh thu', code: 'SA-37' },
      { to: '/admin/reports/parts', label: 'Phụ tùng & tồn kho', code: 'SA-38' },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      { to: '/admin/users', label: 'Tài khoản quản trị', code: 'SA-39', adminOnly: true },
      { to: '/admin/notifications/templates', label: 'Mẫu thông báo', code: 'SA-41' },
      { to: '/admin/notifications/logs', label: 'Nhật ký thông báo', code: 'SA-42' },
      { to: '/admin/settings', label: 'Cấu hình', code: 'SA-43', adminOnly: true },
      { to: '/admin/audit-logs', label: 'Nhật ký thao tác', code: 'SA-44', adminOnly: true },
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
    class="flex flex-col gap-4 overflow-y-auto bg-neutral-900 py-5 text-neutral-100 transition-[width]"
    :class="ui.sidebarCollapsed ? 'w-[72px]' : 'w-[258px]'"
  >
    <div class="flex items-center gap-2 px-4">
      <NuxtLink to="/admin" class="flex flex-1 flex-col leading-tight">
        <span class="font-heading text-[16px] text-accent-300">
          {{ ui.sidebarCollapsed ? 'AY' : 'AOYAMA Service' }}
        </span>
        <span v-if="!ui.sidebarCollapsed" class="text-[10.5px] text-neutral-400">
          Trang quản trị
        </span>
      </NuxtLink>
      <button
        type="button"
        class="rounded-lg px-2 py-1 text-neutral-400 hover:bg-white/10 hover:text-white"
        :aria-label="ui.sidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'"
        @click="ui.toggleSidebar()"
      >
        {{ ui.sidebarCollapsed ? '»' : '«' }}
      </button>
    </div>

    <nav class="flex flex-col gap-4 px-2" aria-label="Menu quản trị">
      <div v-for="group in groups" :key="group.label" class="flex flex-col gap-0.5">
        <p
          v-if="!ui.sidebarCollapsed"
          class="px-2 text-[10px] uppercase tracking-[0.1em] text-neutral-500"
        >
          {{ group.label }}
        </p>
        <NuxtLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] transition-colors hover:bg-white/10"
          active-class="bg-white/15 font-semibold text-white"
          :title="ui.sidebarCollapsed ? `${item.code} ${item.label}` : undefined"
        >
          <span class="font-mono text-[10.5px] tabular-nums opacity-55">{{ item.code }}</span>
          <span v-if="!ui.sidebarCollapsed" class="truncate">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </aside>
</template>
