<script setup lang="ts">
import type { Store } from '~/types/models';

/** CP-05 Thanh tieu de trang quan tri — chon cua hang, tai khoan, dang xuat. */
const auth = useAuthStore();
const ui = useUiStore();
const api = useApi();
const router = useRouter();

const { data: stores } = await useAsyncData('admin-stores', () =>
  api.get<Store[]>('/admin/stores'),
);

const { i18n } = useFormat();
const menuOpen = ref(false);

/**
 * Tai khoan gan voi mot cua hang thi khoa lua chon theo cua hang do — OQ-02
 * chua chot co bat buoc gioi han hay khong, nen phia giao dien lam chat truoc.
 */
const canSwitchStore = computed(() => !auth.user?.storeId);

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
  <header class="flex items-center gap-3 border-b border-divider bg-surface px-4 py-2.5">
    <slot name="title" />

    <div class="ml-auto flex items-center gap-2">
      <label class="hidden items-center gap-1.5 text-[12.5px] sm:flex">
        <span class="ay-muted">Cửa hàng</span>
        <select
          class="ay-input h-9 min-h-0 w-auto py-1 text-[13px]"
          :value="ui.activeStoreId ?? ''"
          :disabled="!canSwitchStore"
          @change="ui.setActiveStore(($event.target as HTMLSelectElement).value || null)"
        >
          <option value="">Tất cả cửa hàng</option>
          <option v-for="store in stores ?? []" :key="store.id" :value="store.id">
            {{ i18n(store.name) }}
          </option>
        </select>
      </label>

      <AyLangSwitcher />

      <div class="relative">
        <button
          type="button"
          class="ay-btn ay-btn-secondary ay-btn-sm"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          {{ auth.user?.name || auth.user?.username || 'Tài khoản' }}
        </button>
        <div
          v-if="menuOpen"
          class="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-xl bg-surface shadow-card"
        >
          <p class="border-b border-divider px-3 py-2 text-[12px] ay-muted">
            {{ auth.user?.adminRole === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên' }}
          </p>
          <NuxtLink to="/admin/change-password" class="block px-3 py-2.5 text-[14px] hover:bg-accent-100">
            Đổi mật khẩu
          </NuxtLink>
          <button
            type="button"
            class="w-full px-3 py-2.5 text-left text-[14px] text-danger hover:bg-danger-bg"
            @click="logout"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
