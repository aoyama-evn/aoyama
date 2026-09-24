<script setup lang="ts">
import type { ApiError } from '~/types/models';

/** SC-17 Dang ky — FR-AUTH-01. */
definePageMeta({ layout: 'auth' });

const api = useApi();

const form = reactive({ name: '', phone: '', email: '' });
const agreed = ref(false);
const loading = ref(false);
const error = ref<ApiError | null>(null);

async function submit(): Promise<void> {
  error.value = null;
  loading.value = true;
  try {
    await api.post('/auth/otp/request', { phone: form.phone.trim(), purpose: 'REGISTER' });
    const query = new URLSearchParams({
      phone: form.phone.trim(),
      purpose: 'REGISTER',
      name: form.name.trim(),
    });
    if (form.email.trim()) query.set('email', form.email.trim());
    await navigateTo(`/verify-otp?${query}`);
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    loading.value = false;
  }
}

useHead({ title: 'Đăng ký — AOYAMA Service' });
</script>

<template>
  <div class="card flex flex-col gap-4">
    <div>
      <p class="card-kicker">SC-17</p>
      <h1 class="font-heading text-[20px]">Đăng ký tài khoản</h1>
      <p class="mt-1 text-[13.5px] text-muted">
        Có tài khoản, bạn xem được toàn bộ lịch sử bảo dưỡng của xe và đặt lại lịch chỉ với vài chạm.
      </p>
    </div>

    <form class="flex flex-col gap-3" @submit.prevent="submit">
      <AyField label="Họ tên" required>
        <template #default="{ id }">
          <input :id="id" v-model="form.name" class="input" type="text" autocomplete="name" required>
        </template>
      </AyField>

      <AyField label="Số điện thoại" required hint="Dùng để đăng nhập và nhận thông báo">
        <template #default="{ id }">
          <input :id="id" v-model="form.phone" class="input" type="tel" placeholder="090-1234-5678" autocomplete="tel" required>
        </template>
      </AyField>

      <AyField label="Email" hint="Không bắt buộc">
        <template #default="{ id }">
          <input :id="id" v-model="form.email" class="input" type="email" autocomplete="email">
        </template>
      </AyField>

      <label class="flex items-start gap-2.5 text-[13px]">
        <input v-model="agreed" type="checkbox" class="mt-1 h-4 w-4 accent-[var(--color-accent)]">
        <span>
          Tôi đồng ý với
          <NuxtLink to="/terms" class="underline" target="_blank">Điều khoản</NuxtLink> và
          <NuxtLink to="/privacy" class="underline" target="_blank">Chính sách dữ liệu</NuxtLink>.
        </span>
      </label>

      <AyErrorNote :error="error" />

      <AyButton type="submit" block :loading="loading" :disabled="!agreed || !form.name.trim() || !form.phone.trim()">
        Gửi mã xác thực
      </AyButton>
    </form>

    <p class="text-center text-[13px] text-muted">
      Đã có tài khoản?
      <NuxtLink to="/login" class="underline">Đăng nhập</NuxtLink>
    </p>
  </div>
</template>
