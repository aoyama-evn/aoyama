<script setup lang="ts">
import type { ApiError, TokenResponse } from '~/types/models';

/**
 * SA-01 Dang nhap quan tri — FR-AUTH-09, FR-AUTH-11.
 * Ban thiet ke: the toi, o ten dang nhap va mat khau co nut hien mat khau,
 * dong "Ghi nho dang nhap" va duong dan "Quen mat khau?".
 */
definePageMeta({ layout: 'auth' });

const api = useApi();
const { t } = useI18n();
const auth = useAuthStore();
const route = useRoute();

const form = reactive({ username: '', password: '' });
const showPassword = ref(false);
const remember = ref(true);
const loading = ref(false);
const error = ref<ApiError | null>(null);

async function submit(): Promise<void> {
  error.value = null;
  loading.value = true;
  try {
    const result = await api.post<TokenResponse>('/auth/admin/login', {
      username: form.username.trim(),
      password: form.password,
    });
    auth.setSession(result, 'R-ADMIN');
    auth.setRemember(remember.value);
    const redirect = route.query.redirect ? String(route.query.redirect) : '/admin';
    await navigateTo(auth.user?.mustChangePassword ? '/admin/change-password' : redirect);
  } catch (caught) {
    error.value = normalizeError(caught);
    form.password = '';
  } finally {
    loading.value = false;
  }
}

useHead({ title: () => `${t('sa01.title')} — AOYAMA Service` });
</script>

<template>
  <form class="flex flex-col gap-3.5" @submit.prevent="submit">
    <p class="font-heading text-[20px]" style="color: var(--color-accent-300)">AOYAMA Admin</p>

    <AyField for="username" :label="$t('sa01.username')" required>
      <input
        id="username"
        v-model="form.username"
        class="input"
        type="text"
        autocomplete="username"
        required
      />
    </AyField>

    <AyField for="password" :label="$t('sa01.password')" required>
      <div class="relative mt-[5px]">
        <input
          id="password"
          v-model="form.password"
          class="input w-full"
          style="padding-right: 44px"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          required
        />
        <button
          type="button"
          class="btn absolute right-1 top-1/2 -translate-y-1/2 p-2"
          style="background: transparent; color: var(--color-neutral-400)"
          :aria-label="showPassword ? $t('sa01.hidePw') : $t('sa01.showPw')"
          :title="showPassword ? $t('sa01.hidePw') : $t('sa01.showPw')"
          @click="showPassword = !showPassword"
        >
          <svg
            width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
          >
            <path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            <path v-if="showPassword" d="M4 20 20 4" />
          </svg>
        </button>
      </div>
    </AyField>

    <div class="flex items-center justify-between gap-2.5">
      <label
        class="flex cursor-pointer items-center gap-2 text-[12.5px]"
        style="color: var(--color-neutral-300)"
      >
        <input v-model="remember" type="checkbox" />
        {{ $t('sa01.remember') }}
      </label>
      <NuxtLink
        to="/admin/forgot-password"
        class="text-[12.5px]"
        style="color: var(--color-accent-300)"
      >
        {{ $t('sa01.forgot') }}
      </NuxtLink>
    </div>

    <AyErrorNote :error="error" />

    <button
      type="submit"
      class="btn btn-primary btn-block"
      style="min-height: 48px; font-size: 15px; margin: 0"
      :disabled="loading"
    >
      {{ loading ? $t('sa01.submitting') : $t('sa01.submit') }}
    </button>
  </form>
</template>
