<script setup lang="ts">
import type { ApiError, TokenResponse } from '~/types/models';

/** SA-01 Dang nhap quan tri — FR-AUTH-09, FR-AUTH-11. */
definePageMeta({ layout: 'auth' });

const api = useApi();
const auth = useAuthStore();
const route = useRoute();

const form = reactive({ username: '', password: '' });
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
    const redirect = route.query.redirect ? String(route.query.redirect) : '/admin';
    await navigateTo(auth.user?.mustChangePassword ? '/admin/change-password' : redirect);
  } catch (err) {
    error.value = normalizeError(err);
    form.password = '';
  } finally {
    loading.value = false;
  }
}

useHead({ title: 'Đăng nhập quản trị — AOYAMA Service' });
</script>

<template>
  <div class="card flex flex-col gap-4">
    <div>
      <p class="card-kicker">SA-01</p>
      <h1 class="font-heading text-[20px]">Đăng nhập trang quản trị</h1>
      <p class="mt-1 text-[13px] text-muted">Dành cho nhân viên và quản trị viên AOYAMA.</p>
    </div>

    <form class="flex flex-col gap-3" @submit.prevent="submit">
      <AyField label="Tên đăng nhập" required>
        <template #default="{ id }">
          <input :id="id" v-model="form.username" class="input" type="text" autocomplete="username" required>
        </template>
      </AyField>

      <AyField label="Mật khẩu" required>
        <template #default="{ id }">
          <input :id="id" v-model="form.password" class="input" type="password" autocomplete="current-password" required>
        </template>
      </AyField>

      <AyErrorNote :error="error" />

      <AyButton type="submit" block :loading="loading">Đăng nhập</AyButton>
    </form>

    <p class="text-center text-[12.5px] text-muted">
      Quên mật khẩu? Liên hệ quản trị viên để được đặt lại.
    </p>
  </div>
</template>
