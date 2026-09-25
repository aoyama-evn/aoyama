<script setup lang="ts">
/**
 * CP-05 Thanh tieu de trang quan tri.
 * Ban thiet ke: nen trang, ten man hinh font-heading 16px ben trai; ben phai
 * chi co chuong thong bao va vong tron chu cai dau cua tai khoan. Bo chon cua
 * hang khong nam o day ma o dau noi dung tung man hinh (AdminStoreBar).
 */
const { t } = useI18n();
const auth = useAuthStore();
const api = useApi();
const router = useRouter();
const title = useScreenTitle();

const emit = defineEmits<{ (e: 'open-nav'): void }>();

const accountMenuOpen = ref(false);

const initials = computed(() => {
  const name = auth.user?.name || auth.user?.username || 'AY';
  return name
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
});

/** So thong bao chua doc — hien tren chuong. */
const { data: unread } = await useAsyncData('admin-unread', () =>
  api.get<{ count: number }>('/admin/notifications/unread-count').catch(() => ({ count: 0 })),
);

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
    class="admin-topbar flex flex-none items-center gap-3.5"
    style="background: #fff; border-bottom: 1px solid var(--color-divider)"
  >
    <button
      type="button"
      class="btn -ml-1 p-2 lg:hidden"
      style="background: transparent; color: var(--color-neutral-800)"
      :aria-label="$t('adm.nav.open')"
      @click="emit('open-nav')"
    >
      <svg
        width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.75" stroke-linecap="round" aria-hidden="true"
      >
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>

    <h1 class="font-heading text-[16px]">{{ title || $t('adm.top.default') }}</h1>

    <div class="ml-auto flex items-center gap-2.5">
      <NuxtLink
        to="/admin/notifications/logs"
        class="relative inline-flex items-center"
        style="color: var(--color-neutral-700)"
        :title="$t('adm.top.unread', { n: unread?.count ?? 0 })"
        :aria-label="$t('adm.top.unread', { n: unread?.count ?? 0 })"
      >
        <svg
          width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
        >
          <path d="M18 9a6 6 0 0 0-12 0c0 5-2 6-2 6h16s-2-1-2-6Z" />
          <path d="M13.7 20a2 2 0 0 1-3.4 0" />
        </svg>
        <span
          v-if="unread?.count"
          class="absolute inline-flex items-center justify-center rounded-full text-[10px] font-bold"
          style="
            top: -5px; right: -6px; min-width: 16px; height: 16px; padding: 0 4px;
            background: #c0392b; color: #fff;
          "
        >
          {{ unread.count }}
        </span>
      </NuxtLink>

      <div class="relative">
        <button
          type="button"
          class="grid place-items-center rounded-full text-[11px] font-bold"
          style="width: 30px; height: 30px; background: var(--color-accent-300)"
          :aria-expanded="accountMenuOpen"
          :aria-label="auth.user?.name || t('adm.top.account')"
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
            class="text-muted px-3 py-2 text-[12px]"
            style="border-bottom: 1px solid var(--color-divider)"
          >
            {{ auth.user?.name }} ·
            {{
              auth.user?.adminRole === 'ADMIN' ? $t('adm.top.roleAdmin') : $t('adm.top.roleStaff')
            }}
          </p>
          <NuxtLink
            to="/admin/change-password"
            class="block px-3 py-2.5 text-[13.5px] hover:bg-[var(--color-accent-100)]"
          >
            {{ $t('adm.top.changePw') }}
          </NuxtLink>
          <button
            type="button"
            class="w-full px-3 py-2.5 text-left text-[13.5px]"
            style="color: var(--color-danger)"
            @click="logout"
          >
            {{ $t('adm.top.logout') }}
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
