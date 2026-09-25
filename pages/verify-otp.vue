<script setup lang="ts">
import type { ApiError, TokenResponse } from '~/types/models';

/**
 * SC-19 Nhap ma OTP — FR-AUTH-03, FR-AUTH-04.
 * Ban thiet ke: sau o vuong rieng, dong dem nguoc truoc khi cho gui lai, va
 * mot dong nhac ve gioi han so lan nhap sai.
 */
const api = useApi();
const auth = useAuthStore();
const ui = useUiStore();
const route = useRoute();

const phone = String(route.query.phone ?? '');
const purpose = String(route.query.purpose ?? 'LOGIN') as 'LOGIN' | 'REGISTER';
const name = route.query.name ? String(route.query.name) : undefined;
const email = route.query.email ? String(route.query.email) : undefined;
const redirect = route.query.redirect ? String(route.query.redirect) : null;

const code = ref('');
const loading = ref(false);
const error = ref<ApiError | null>(null);

/** BR-03 — dem nguoc truoc khi cho gui lai ma. */
const cooldown = ref(60);
let timer: ReturnType<typeof setInterval> | null = null;

/** NFR-SE-11 — hien so da che bot o man hinh xac thuc. */
const maskedTarget = computed(() =>
  phone.length > 4 ? `${phone.slice(0, 3)}-****-${phone.slice(-4)}` : phone,
);

const digitsTyped = computed(() => code.value.replace(/\D/g, '').length);

const countdown = computed(() => {
  const value = Math.max(0, cooldown.value);
  const mm = String(Math.floor(value / 60)).padStart(2, '0');
  const ss = String(value % 60).padStart(2, '0');
  return `${mm}:${ss}`;
});

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
    ui.success(result.isNewAccount ? 'Tạo tài khoản thành công' : 'Xác thực thành công');
    await navigateTo(redirect ?? '/account/bookings');
  } catch (caught) {
    error.value = normalizeError(caught);
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
  } catch (caught) {
    error.value = normalizeError(caught);
  }
}

/** Tu gui khi go du 6 chu so — bot mot lan cham cho nguoi dung. */
watch(digitsTyped, (typed) => {
  if (typed === 6 && !loading.value) verify();
});

useHead({ title: 'Nhập mã xác thực' });
</script>

<template>
  <div class="flex flex-col gap-[15px] pb-4 pt-2">
    <div>
      <h3 class="mb-1.5">
        {{ purpose === 'REGISTER' ? 'Xác thực đăng ký' : 'Nhập mã đăng nhập' }}
      </h3>
      <p class="text-muted text-[12.5px]">
        Đã gửi 6 chữ số tới <strong>{{ maskedTarget }}</strong>. Mã có hiệu lực 5 phút.
      </p>
    </div>

    <AyOtpInput v-model="code" />

    <div class="flex items-center justify-between gap-2.5 text-[12.5px]">
      <span class="text-muted">
        {{ cooldown > 0 ? `Gửi lại mã sau ${countdown}` : 'Bạn có thể gửi lại mã' }}
      </span>
      <button
        type="button"
        class="btn btn-ghost p-0 text-[12.5px]"
        :style="cooldown > 0 ? 'opacity: .45' : ''"
        :disabled="cooldown > 0"
        @click="resend"
      >
        Gửi lại mã
      </button>
    </div>

    <p
      class="px-3.5 py-2.5 text-[12px] leading-[1.5]"
      style="background: var(--color-accent-100); border-radius: 18px"
    >
      Nhập sai quá 5 lần sẽ tạm khóa gửi mã cho số này trong 15 phút.
    </p>

    <AyErrorNote :error="error" />

    <button
      type="button"
      class="btn btn-primary btn-block"
      style="min-height: 48px; font-size: 15px; margin: 0"
      :disabled="loading || digitsTyped < 6"
      @click="verify"
    >
      {{ loading ? 'Đang xác thực…' : 'Xác nhận' }}
    </button>

    <NuxtLink to="/login" class="btn btn-ghost self-center text-[13px]">← Quay lại</NuxtLink>
  </div>
</template>
