<script setup lang="ts">
import type { OtpRequestResponse } from '~/types/models';

/**
 * SC-18 Dang nhap khach hang — FR-AUTH-02.
 * Chi can so dien thoai; ma OTP nhap o SC-19. Hai the duoi cung la loi moi
 * dang ky va tra cuu khong can tai khoan, dung nhu ban thiet ke.
 */
const { t } = useI18n();
const api = useApi();
const ui = useUiStore();

/**
 * middleware/auth gan ?redirect= khi day nguoi chua dang nhap ve day. Phai
 * chuyen tiep sang SC-19 thi xac thuc xong moi quay lai dung trang ho dinh mo.
 */
const route = useRoute();
const redirect = computed(() => (route.query.redirect ? String(route.query.redirect) : null));

const phone = ref('');
const sending = ref(false);
const error = ref<string | null>(null);

async function requestOtp(): Promise<void> {
  error.value = null;
  if (!phone.value.trim()) {
    error.value = t('validate.phone');
    return;
  }
  sending.value = true;
  try {
    const sent = await api.post<OtpRequestResponse>('/auth/otp/request', {
      phone: phone.value.trim(),
      purpose: 'LOGIN',
    });
    const query = new URLSearchParams({ phone: phone.value.trim(), purpose: 'LOGIN' });
    if (redirect.value) query.set('redirect', redirect.value);
    // May chu phat trien chua noi cong SMS thi gui kem ma de SC-19 hien ra.
    if (sent.devCode) query.set('dev', sent.devCode);
    await navigateTo(`/verify-otp?${query.toString()}`);
  } catch (caught) {
    error.value = normalizeError(caught).message;
    ui.error(error.value);
  } finally {
    sending.value = false;
  }
}

useHead({ title: () => t('sc18.title') });
</script>

<template>
  <form class="flex flex-col gap-3.5 pb-4 pt-2" @submit.prevent="requestOtp">
    <h3>{{ $t('sc18.title') }}</h3>

    <AyField for="phone" :label="$t('sc14.phone')" required :error="error ?? undefined">
      <AyPhoneField id="phone" v-model="phone" :invalid="Boolean(error)" />
    </AyField>

    <button
      type="submit"
      class="btn btn-primary btn-block"
      style="min-height: 48px; font-size: 15px; margin: 0"
      :disabled="sending"
    >
      {{ sending ? $t('common.sending') : $t('sc18.submit') }}
    </button>

    <div
      class="flex flex-col gap-1.5 p-3"
      style="background: var(--color-accent-2-100); border-radius: 20px"
    >
      <p class="text-[13px] font-semibold">{{ $t('sc14.noAccount') }}</p>
      <p class="text-[12px] leading-[1.5]" style="color: var(--color-accent-2-800)">
        {{ $t('sc18.signupLead') }}
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
        {{ $t('sc18.signupCta') }}
      </NuxtLink>
    </div>

    <div
      class="flex flex-col gap-1.5 p-3"
      style="background: var(--color-accent-100); border-radius: 20px"
    >
      <p class="text-[13px] font-semibold">{{ $t('sc18.lookupTitle') }}</p>
      <p class="text-[12px] leading-[1.5]" style="color: var(--color-neutral-700)">
        {{ $t('sc18.lookupLead') }}
      </p>
      <NuxtLink
        to="/booking/lookup"
        class="btn btn-secondary self-start text-[12.5px]"
        style="min-height: 44px"
      >
        {{ $t('sc18.lookupCta') }}
      </NuxtLink>
    </div>
  </form>
</template>
