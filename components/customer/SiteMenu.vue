<script setup lang="ts">
/**
 * Ngan keo menu cua CP-01 — truot tu phai, chiem 82% be ngang khung.
 * Muc menu khac nhau giua khach va thanh vien, dung nhu ban thiet ke.
 */
const menu = useSiteMenu();
const auth = useAuthStore();
const overlayTarget = useOverlayTarget();

type Item = { to: string; label: string; icon: string };

/** Duong ve cua bieu tuong, giu nguyen net 2.75px cua ban thiet ke. */
const ICON = {
  services: 'M14.7 6.3a4 4 0 0 0 5 5L21 21H3l8-8a4 4 0 0 1 0-5 4 4 0 0 1 3.7-1.7Z',
  vehicles: 'M6.5 17h5l3-7h3M13 10 11 5H8.5',
  bookings: 'M8 3v4M16 3v4M3.5 10h17',
  profile: 'M5 20a7 7 0 0 1 14 0',
  lookup: 'M20 20l-4-4',
  login: 'M10 8l4 4-4 4M14 12H4',
};

const { t } = useI18n();

const memberItems = computed<Item[]>(() => [
  { to: '/services', label: t('nav.services'), icon: 'services' },
  { to: '/account/vehicles', label: t('nav.myVehicles'), icon: 'vehicles' },
  { to: '/account/bookings', label: t('nav.myBookings'), icon: 'bookings' },
  { to: '/account/profile', label: t('nav.myProfile'), icon: 'profile' },
]);

const guestItems = computed<Item[]>(() => [
  { to: '/services', label: t('nav.services'), icon: 'services' },
  { to: '/booking/lookup', label: t('nav.lookup'), icon: 'lookup' },
  { to: '/login', label: t('nav.loginRegister'), icon: 'login' },
]);

const items = computed(() => (auth.isCustomer ? memberItems.value : guestItems.value));

const logoutOpen = ref(false);

/**
 * Dong ngan keo roi moi mo hop thoai: ngan keo o z-60 con hop thoai o z-50
 * nen de chong nhau thi hop thoai bi khuat sau ngan keo.
 */
function askSignOut(): void {
  menu.close();
  logoutOpen.value = true;
}

async function signOut(): Promise<void> {
  logoutOpen.value = false;
  auth.clear();
  await navigateTo('/');
}
</script>

<template>
  <Teleport :to="overlayTarget">
    <Transition name="ay-drawer">
      <div
        v-if="menu.isOpen.value"
        class="ay-overlay z-[60] flex justify-end"
        style="background: rgba(32, 30, 29, 0.5)"
        role="dialog"
        aria-modal="true"
        :aria-label="$t('nav.menu')"
        @click.self="menu.close()"
      >
        <div
          class="ay-safe-top ay-safe-bottom flex h-full flex-col gap-[11px] px-4 py-[18px]"
          style="
            background: var(--color-bg);
            width: 82%;
            max-width: 352px;
            box-shadow: var(--shadow-lg);
          "
        >
          <div class="flex items-center gap-2.5">
            <span class="font-heading text-[16px]" style="color: var(--color-accent-700)">
              AOYAMA
            </span>
            <button
              type="button"
              class="btn btn-ghost ml-auto px-2 text-[16px]"
              :aria-label="$t('nav.close')"
              @click="menu.close()"
            >
              ✕
            </button>
          </div>

          <NuxtLink
            to="/booking/step1"
            class="btn btn-primary btn-block"
            style="min-height: 50px; font-size: 15px; margin: 2px 0 6px"
          >
            {{ $t('nav.bookNow') }}
          </NuxtLink>

          <nav class="flex flex-col gap-[9px]">
            <NuxtLink v-for="item in items" :key="item.to" :to="item.to" class="ay-menu-item">
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="var(--color-accent-700)" stroke-width="2.75" stroke-linecap="round"
                stroke-linejoin="round" class="flex-none" aria-hidden="true"
              >
                <circle v-if="item.icon === 'vehicles'" cx="6.5" cy="17" r="3" />
                <circle v-if="item.icon === 'vehicles'" cx="17.5" cy="17" r="3" />
                <rect v-if="item.icon === 'bookings'" x="3.5" y="5" width="17" height="16" rx="3" />
                <circle v-if="item.icon === 'profile'" cx="12" cy="8" r="3.6" />
                <circle v-if="item.icon === 'lookup'" cx="11" cy="11" r="7" />
                <path
                  v-if="item.icon === 'login'"
                  d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15"
                />
                <path :d="ICON[item.icon as keyof typeof ICON]" />
              </svg>
              {{ item.label }}
            </NuxtLink>

            <button v-if="auth.isCustomer" type="button" class="ay-menu-item" @click="askSignOut">
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="var(--color-accent-700)" stroke-width="2.75" stroke-linecap="round"
                stroke-linejoin="round" class="flex-none" aria-hidden="true"
              >
                <path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9" />
                <path d="M14 8l4 4-4 4M18 12H8" />
              </svg>
              {{ $t('nav.logout') }}
            </button>
          </nav>

          <p class="text-muted mt-auto text-center text-[11px] leading-[1.5]">
            {{ $t('common.copyright', { year: new Date().getFullYear() }) }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>

  <AyConfirmDialog
    :open="logoutOpen"
    :title="$t('sc33.logoutAsk')"
    :message="$t('sc33.logoutAskBody')"
    :confirm-label="$t('sc33.logout')"
    :cancel-label="$t('common.close')"
    @confirm="signOut"
    @cancel="logoutOpen = false"
  />
</template>

<style scoped>
.ay-menu-item {
  display: flex;
  width: 100%;
  min-height: 50px;
  align-items: center;
  gap: 12px;
  border-radius: 18px;
  background: var(--color-surface);
  padding: 13px 14px;
  text-align: left;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text);
}
.ay-menu-item:hover {
  background: var(--color-accent-200);
  text-decoration: none;
}

.ay-drawer-enter-active,
.ay-drawer-leave-active {
  transition: opacity 0.16s ease;
}
.ay-drawer-enter-from,
.ay-drawer-leave-to {
  opacity: 0;
}
</style>
