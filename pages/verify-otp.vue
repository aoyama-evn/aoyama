<script setup lang="ts">
import type { ApiError, TokenResponse } from '~/types/models';

/** SC-19 Nhap ma OTP — FR-AUTH-03, FR-AUTH-04. */
definePageMeta({ layout: 'auth' });

const api = useApi();
const auth = useAuthStore();
const ui = useUiStore();
const route = useRoute();

const phone = String(route.query.phone ?? '');
const purpose = (String(route.query.purpose ?? 'LOGIN') as 'LOGIN' | 'REGISTER');
const name = route.query.name ? String(route.query.name) : undefined;
const email = route.query.email ? String(route.query.email) : undefined;
const redirect = route.query.redirect ? String(route.query.redirect) : null;

const code = ref('');
const loading = ref(false);
const error = ref<ApiError | null>(null);

/** BR-03 — dem nguoc truoc khi cho gui lai ma. */
const cooldown = ref(60);
let timer: ReturnType<typeof setInterval> | null = null;

function startCooldown(): void {
  cooldown.value = 60;
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    cooldown.value -= 1;
    if (cooldown.value <= 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  }, 1000);
}

onMounted(() => {
  if (!phone) {
    navigateTo('/login');
    return;
  }
  startCooldown();
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

async function verify(): Promise<void> {
  error.value = null;
  loading.value = true;
  try {
    const result = await api.post<TokenResponse>('/auth/otp/verify', {
      phone,
      code: code.value.trim(),
      purpose,
      name,
      email,
    });
    auth.setSession(result, 'R-USER');
    ui.success(result.isNewAccount ? 'Tạo tài khoản thành công' : 'Đăng nhập thành công');
    await navigateTo(redirect ?? '/account/bookings');
  } catch (err) {
    error.value = normalizeError(err);
    code.value = '';
  } finally {
    loading.value = false;
  }
}

async function resend(): Promise<void> {
  error.value = null;
  try {
    await api.post('/auth/otp/request', { phone, purpose });
    ui.success('Đã gửi lại mã xác thực');
    startCooldown();
  } catch (err) {
    error.value = normalizeError(err);
  }
}

/** Tu gui khi go du 6 chu so — bot mot lan cham cho nguoi dung. */
watch(code, (value) => {
  if (value.replace(/\D/g, '').length === 6 && !loading.value) verify();
});

useHead({ title: 'Nhập mã xác thực' });
</script>

<template>
  <div class="ay-card flex flex-col gap-4">
    <div>
      <p class="ay-kicker">SC-19</p>
      <h1 class="font-heading text-[20px]">Nhập mã xác thực</h1>
      <p class="mt-1 text-[13.5px] ay-muted">
        Chúng tôi đã gửi mã 6 chữ số tới <strong>{{ phone }}</strong>. Mã có hiệu lực 5 phút.
      </p>
    </div>

    <form class="flex flex-col gap-3" @submit.prevent="verify">
      <AyField label="Mã xác thực" required>
        <template #default="{ id }">
          <input
            :id="id" v-model="code"
            class="ay-input text-center font-heading text-[26px] tracking-[0.4em]"
            type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code"
            placeholder="······" required
          >
        </template>
      </AyField>

      <AyErrorNote :error="error" />

      <AyButton type="submit" block :loading="loading" :disabled="code.trim().length < 4">
        Xác thực
      </AyButton>
    </form>

    <div class="flex flex-col items-center gap-1 text-[13px]">
      <button
        type="button" class="ay-btn ay-btn-ghost ay-btn-sm"
        :disabled="cooldown > 0" @click="resend"
      >
        {{ cooldown > 0 ? `Gửi lại mã sau ${cooldown} giây` : 'Gửi lại mã' }}
      </button>
      <NuxtLink to="/login" class="ay-muted underline">Đổi số điện thoại khác</NuxtLink>
    </div>
  </div>
</template>
