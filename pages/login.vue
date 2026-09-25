<script setup lang="ts">
/**
 * SC-18 Dang nhap khach hang — FR-AUTH-02.
 * Chi can so dien thoai; ma OTP nhap o SC-19. Hai the duoi cung la loi moi
 * dang ky va tra cuu khong can tai khoan, dung nhu ban thiet ke.
 */
const api = useApi();
const ui = useUiStore();

const phone = ref('');
const sending = ref(false);
const error = ref<string | null>(null);

async function requestOtp(): Promise<void> {
  error.value = null;
  if (!phone.value.trim()) {
    error.value = 'Vui lòng nhập số điện thoại';
    return;
  }
  sending.value = true;
  try {
    await api.post('/auth/otp/request', { phone: phone.value.trim(), purpose: 'LOGIN' });
    const query = new URLSearchParams({ phone: phone.value.trim(), purpose: 'LOGIN' }).toString();
    await navigateTo(`/verify-otp?${query}`);
  } catch (caught) {
    error.value = normalizeError(caught).message;
    ui.error(error.value);
  } finally {
    sending.value = false;
  }
}

useHead({ title: 'Đăng nhập — AOYAMA Service' });
</script>

<template>
  <form class="flex flex-col gap-3.5 pb-4 pt-2" @submit.prevent="requestOtp">
    <h3>Đăng nhập</h3>

    <AyField for="phone" label="Số điện thoại" required :error="error ?? undefined">
      <input
        id="phone"
        v-model="phone"
        class="input"
        type="tel"
        inputmode="tel"
        autocomplete="tel"
        placeholder="090-1234-5678"
      />
    </AyField>

    <button
      type="submit"
      class="btn btn-primary btn-block"
      style="min-height: 48px; font-size: 15px; margin: 0"
      :disabled="sending"
    >
      {{ sending ? 'Đang gửi…' : 'Gửi mã đăng nhập' }}
    </button>

    <div
      class="flex flex-col gap-1.5 p-3"
      style="background: var(--color-accent-2-100); border-radius: 20px"
    >
      <p class="text-[13px] font-semibold">Chưa có tài khoản?</p>
      <p class="text-[12px] leading-[1.5]" style="color: var(--color-accent-2-800)">
        Đăng ký để lưu hồ sơ xe, xem lịch sử dịch vụ và nhận nhắc bảo dưỡng.
      </p>
      <NuxtLink
        to="/register"
        class="btn btn-secondary self-start text-[12.5px]"
        style="
          min-height: 44px;
          border-color: var(--color-accent-2-500);
          color: var(--color-accent-2-800);
        "
      >
        Đăng ký →
      </NuxtLink>
    </div>

    <div
      class="flex flex-col gap-1.5 p-3"
      style="background: var(--color-accent-100); border-radius: 20px"
    >
      <p class="text-[13px] font-semibold">Chỉ muốn xem lịch hẹn?</p>
      <p class="text-[12px] leading-[1.5]" style="color: var(--color-neutral-700)">
        Tra cứu bằng mã lịch hẹn và số điện thoại — không cần tài khoản.
      </p>
      <NuxtLink
        to="/booking/lookup"
        class="btn btn-secondary self-start text-[12.5px]"
        style="min-height: 44px"
      >
        Tra cứu lịch hẹn →
      </NuxtLink>
    </div>
  </form>
</template>
