<script setup lang="ts">
/**
 * CP-01 Dau trang site khach hang.
 * Ban thiet ke dat o day: chu AOYAMA, o chon ngon ngu dang vien thuoc, nut
 * Dang nhap (khach) hoac vong tron ho so (thanh vien), va nut mo menu.
 */
const auth = useAuthStore();
const menu = useSiteMenu();
const { locale, setLocale } = useI18n();

const LANGS = ['ja', 'vi', 'en'] as const;

function onLangChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value as (typeof LANGS)[number];
  setLocale(value);
}
</script>

<template>
  <header
    class="ay-safe-top sticky top-0 z-40"
    style="background: var(--color-bg); border-bottom: 1px solid var(--color-divider)"
  >
    <div class="sp-shell flex items-center gap-2.5 px-4 py-2">
      <NuxtLink to="/" class="font-heading text-[16px]" style="color: var(--color-accent-700)">
        AOYAMA
      </NuxtLink>

      <div class="ml-auto flex items-center gap-1.5">
        <select
          class="input"
          style="width: 56px; min-width: 0; min-height: 28px; padding: 3px 4px 3px 7px; font-size: 11px"
          :aria-label="$t('common.language')"
          :value="locale"
          @change="onLangChange"
        >
          <option v-for="code in LANGS" :key="code" :value="code">{{ code.toUpperCase() }}</option>
        </select>

        <NuxtLink
          v-if="auth.isCustomer"
          to="/account/profile"
          class="btn btn-primary btn-icon"
          style="width: 34px; height: 34px; padding: 0"
          :aria-label="$t('nav.myProfile')"
          :title="$t('nav.myProfile')"
        >
          <svg
            width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
          >
            <circle cx="12" cy="8" r="3.6" />
            <path d="M5 20a7 7 0 0 1 14 0" />
          </svg>
        </NuxtLink>

        <NuxtLink
          v-else
          to="/login"
          class="btn btn-primary"
          style="min-height: 34px; font-size: 12px; padding: 6px 14px"
        >
          {{ $t('nav.login') }}
        </NuxtLink>

        <button
          type="button"
          class="btn"
          style="
            width: 34px; height: 34px; padding: 0; border: 0;
            background: var(--color-neutral-200); color: var(--color-neutral-800);
          "
          :aria-label="$t('nav.menu')"
          :title="$t('nav.menu')"
          @click="menu.open()"
        >
          <svg
            width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.75" stroke-linecap="round" aria-hidden="true"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>
