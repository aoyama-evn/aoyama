<script setup lang="ts">
import type { ApiError, OtpRequestResponse, TokenResponse } from '~/types/models';

/**
 * SC-19 Nhap ma OTP — FR-AUTH-03, FR-AUTH-04.
 * Ban thiet ke: sau o vuong rieng, dong dem nguoc truoc khi cho gui lai, va
 * mot dong nhac ve gioi han so lan nhap sai.
 */
const { t } = useI18n();
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
/**
 * Ma do may chu phat trien gui kem khi chua noi cong SMS that. Khong co cong
 * thi khong dien thoai nao nhan duoc gi, nen phai hien thang ra day thi moi
 * thu duoc luong dang nhap. Ban chay that khong bao gio co truong nay.
 */
const devCode = ref(route.query.dev ? String(route.query.dev) : '');
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
    ui.success(result.isNewAccount ? t('sc19.accountCreated') : t('common.verified'));
    // Khong co duong dan cho san thi ve trang chu. Truoc day day thang sang
    // lich su dat lich, nguoi vua dang ky xong khong hieu vi sao lai o do.
    await navigateTo(redirect ?? '/');
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
    const sent = await api.post<OtpRequestResponse>('/auth/otp/request', { phone, purpose });
    devCode.value = sent.devCode ?? '';
    ui.success(t('sc19.resent'));
    startCooldown();
  } catch (caught) {
    error.value = normalizeError(caught);
  }
}

/** Tu gui khi go du 6 chu so — bot mot lan cham cho nguoi dung. */
watch(digitsTyped, (typed) => {
  if (typed === 6 && !loading.value) verify();
});

useHead({ title: () => t('sc19.titleLogin') });
</script>

<template>
  <div class="flex flex-col gap-[15px] pb-4 pt-2">
    <div>
      <h3 class="mb-1.5">
        {{ purpose === 'REGISTER' ? $t('sc19.titleRegister') : $t('sc19.titleLogin') }}
      </h3>
      <p class="text-muted text-[12.5px]">
        <i18n-t keypath="sc19.sentTo" tag="span">
          <template #target><strong>{{ maskedTarget }}</strong></template>
        </i18n-t>
      </p>
    </div>

    <div
      v-if="devCode"
      class="flex flex-wrap items-center gap-2 px-3.5 py-3"
      style="
        border: 1.5px dashed var(--color-accent-2-400);
        background: var(--color-accent-2-100);
        border-radius: 16px;
      "
    >
      <p class="w-full text-[11.5px] leading-[1.45]" style="color: var(--color-accent-2-800)">
        {{ $t('otpDev.notice') }}
      </p>
      <strong class="select-all font-heading text-[19px]" style="letter-spacing: 0.14em">
        {{ devCode }}
      </strong>
      <button
        type="button"
        class="btn btn-secondary ml-auto text-[12px]"
        style="min-height: 38px"
        @click="code = devCode"
      >
        {{ $t('otpDev.fill') }}
      </button>
    </div>

    <AyOtpInput v-model="code" />

    <div class="flex items-center justify-between gap-2.5 text-[12.5px]">
      <span class="text-muted">
        {{
          cooldown > 0 ? $t('sc19.resendIn', { time: countdown }) : $t('sc19.canResend')
        }}
      </span>
      <button
        type="button"
        class="btn btn-ghost p-0 text-[12.5px]"
        :style="cooldown > 0 ? 'opacity: .45' : ''"
        :disabled="cooldown > 0"
        @click="resend"
      >
        {{ $t('sc14.resend') }}
      </button>
    </div>

    <p
      class="px-3.5 py-2.5 text-[12px] leading-[1.5]"
      style="background: var(--color-accent-100); border-radius: 18px"
    >
      {{ $t('sc19.lockNote') }}
    </p>

    <AyErrorNote :error="error" />

    <button
      type="button"
      class="btn btn-primary btn-block"
      style="min-height: 48px; font-size: 15px; margin: 0"
      :disabled="loading || digitsTyped < 6"
      @click="verify"
    >
      {{ loading ? $t('sc19.verifying') : $t('common.confirm') }}
    </button>

    <NuxtLink to="/login" class="btn btn-ghost self-center text-[13px]">{{ $t('common.back') }}</NuxtLink>
  </div>
</template>
