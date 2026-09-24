<script setup lang="ts">
import type { ApiError } from '~/types/models';

/** SC-18 Dang nhap bang so dien thoai — FR-AUTH-02. */
definePageMeta({ layout: 'auth' });

const api = useApi();
const route = useRoute();

const phone = ref('');
const loading = ref(false);
const error = ref<ApiError | null>(null);

async function requestOtp(): Promise<void> {
  error.value = null;
  loading.value = true;
  try {
    await api.post('/auth/otp/request', { phone: phone.value.trim(), purpose: 'LOGIN' });
    const query = new URLSearchParams({ phone: phone.value.trim(), purpose: 'LOGIN' });
    if (route.query.redirect) query.set('redirect', String(route.query.redirect));
    await navigateTo(`/verify-otp?${query}`);
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    loading.value = false;
  }
}

useHead({ title: 'Đăng nhập — AOYAMA Service' });
</script>

<template>
  <div class="ay-card flex flex-col gap-4">
    <div>
      <p class="ay-kicker">SC-18</p>
      <h1 class="font-heading text-[20px]">Đăng nhập</h1>
      <p class="mt-1 text-[13.5px] ay-muted">
        Nhập số điện thoại, chúng tôi gửi mã xác thực qua SMS. Không cần nhớ mật khẩu.
      </p>
    </div>

    <form class="flex flex-col gap-3" @submit.prevent="requestOtp">
      <AyField label="Số điện thoại" required>
        <template #default="{ id }">
          <input
            :id="id" v-model="phone" class="ay-input" type="tel"
            placeholder="090-1234-5678" autocomplete="tel" required
          >
        </template>
      </AyField>

      <AyErrorNote :error="error" />

      <AyButton type="submit" block :loading="loading" :disabled="!phone.trim()">
        Gửi mã xác thực
      </AyButton>
    </form>

    <p class="text-center text-[13px] ay-muted">
      Chưa có tài khoản?
      <NuxtLink to="/register" class="underline">Đăng ký</NuxtLink>
    </p>
    <p class="text-center text-[13px] ay-muted">
      Chỉ muốn tra cứu một lịch hẹn?
      <NuxtLink to="/booking/lookup" class="underline">Tra cứu bằng mã</NuxtLink>
    </p>
  </div>
</template>
