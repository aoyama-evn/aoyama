<script setup lang="ts">
import type { Store } from '~/types/models';

/**
 * CP-05 Thanh tieu de trang quan tri.
 * Ban thiet ke: nen trang, ten man hinh font-heading 16px ben trai; ben phai la
 * nhan chon cua hang, so thong bao va vong tron chu cai dau cua tai khoan.
 */
const auth = useAuthStore();
const ui = useUiStore();
const api = useApi();
const router = useRouter();
const route = useRoute();
const { i18n } = useFormat();

const { data: stores } = await useAsyncData('admin-stores', () => api.get<Store[]>('/admin/stores'));

/** Tai khoan gan voi mot cua hang thi khoa lua chon theo cua hang do (OQ-02). */
const canSwitchStore = computed(() => !auth.user?.storeId);
const storeMenuOpen = ref(false);
const accountMenuOpen = ref(false);

const activeStoreName = computed(() => {
  const found = (stores.value ?? []).find((s) => s.id === ui.activeStoreId);
  return found ? i18n(found.name) : 'Tất cả cửa hàng';
});

const initials = computed(() => {
  const name = auth.user?.name || auth.user?.username || 'AY';
  return name
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
});

/** Ten man hinh lay tu tieu de trang, khong phai go lai o tung cho. */
const TITLES: Record<string, string> = {
  '/admin': 'Bảng điều khiển',
  '/admin/bookings': 'Lịch hẹn',
  '/admin/bookings/calendar': 'Lịch theo ngày',
  '/admin/bookings/new': 'Đặt lịch thay khách',
  '/admin/scan': 'Quét mã QR',
  '/admin/work-orders': 'Phiếu dịch vụ',
  '/admin/quotations': 'Báo giá',
  '/admin/customers': 'Khách hàng',
  '/admin/vehicles': 'Phương tiện',
  '/admin/services': 'Dịch vụ',
  '/admin/pricing': 'Bảng giá',
  '/admin/parts': 'Phụ tùng',
  '/admin/inventory': 'Tồn kho',
  '/admin/stores': 'Cửa hàng',
  '/admin/reports': 'Báo cáo',
  '/admin/users': 'Tài khoản quản trị',
  '/admin/settings': 'Cấu hình hệ thống',
  '/admin/audit-logs': 'Nhật ký thao tác',
};

const screenTitle = computed(() => {
  const path = route.path.replace(/\/$/, '');
  if (TITLES[path]) return TITLES[path];
  // Tuyen con: lay muc cha dai nhat khop duoc.
  const parent = Object.keys(TITLES)
    .filter((key) => path.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  return parent ? TITLES[parent] : 'Trang quản trị';
});

onMounted(() => {
  ui.restoreActiveStore();
  if (auth.user?.storeId) ui.setActiveStore(auth.user.storeId);
});

async function logout(): Promise<void> {
  try {
    if (auth.refreshToken) await api.post('/auth/logout', { refreshToken: auth.refreshToken });
  } finally {
    auth.clear();
    await router.push('/admin/login');
  }
}
</script>

<template>
  <header
    class="flex items-center gap-3.5 px-5 py-3"
    style="background: #fff; border-bottom: 1px solid var(--color-divider)"
  >
    <h1 class="font-heading text-[16px]">{{ screenTitle }}</h1>

    <div class="ml-auto flex items-center gap-2.5">
      <!-- Chon cua hang -->
      <div class="relative">
        <button
          type="button"
          class="tag tag-neutral"
          :disabled="!canSwitchStore"
          :aria-expanded="storeMenuOpen"
          @click="storeMenuOpen = !storeMenuOpen"
        >
          Cửa hàng: {{ activeStoreName }} ▾
        </button>

        <ul
          v-if="storeMenuOpen"
          class="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-xl py-1"
          style="background: #fff; box-shadow: var(--shadow-sm)"
        >
          <li>
            <button
              type="button"
              class="w-full px-3 py-2 text-left text-[13px] hover:bg-[var(--color-accent-100)]"
              @click="ui.setActiveStore(null); storeMenuOpen = false"
            >
              Tất cả cửa hàng
            </button>
          </li>
          <li v-for="store in stores ?? []" :key="store.id">
            <button
              type="button"
              class="w-full px-3 py-2 text-left text-[13px] hover:bg-[var(--color-accent-100)]"
              @click="ui.setActiveStore(store.id); storeMenuOpen = false"
            >
              {{ i18n(store.name) }}
            </button>
          </li>
        </ul>
      </div>

      <AyLangSwitcher />

      <!-- Tai khoan -->
      <div class="relative">
        <button
          type="button"
          class="grid place-items-center rounded-full text-[11px] font-bold"
          style="width: 30px; height: 30px; background: var(--color-accent-300)"
          :aria-expanded="accountMenuOpen"
          :aria-label="auth.user?.name || 'Tài khoản'"
          @click="accountMenuOpen = !accountMenuOpen"
        >
          {{ initials }}
        </button>

        <div
          v-if="accountMenuOpen"
          class="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-xl"
          style="background: #fff; box-shadow: var(--shadow-sm)"
        >
          <p
            class="px-3 py-2 text-[12px] text-muted"
            style="border-bottom: 1px solid var(--color-divider)"
          >
            {{ auth.user?.name }} ·
            {{ auth.user?.adminRole === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên' }}
          </p>
          <NuxtLink
            to="/admin/change-password"
            class="block px-3 py-2.5 text-[13.5px] hover:bg-[var(--color-accent-100)]"
          >
            Đổi mật khẩu
          </NuxtLink>
          <button
            type="button"
            class="w-full px-3 py-2.5 text-left text-[13.5px]"
            style="color: var(--color-danger)"
            @click="logout"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
