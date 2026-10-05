<script setup lang="ts">
import type { OtpRequestResponse } from '~/types/models';

/**
 * SC-17 Dang ky khach hang — FR-AUTH-01.
 * Ban thiet ke chi hoi ho ten, so dien thoai, email va o dong y dieu khoan;
 * xac thuc bang OTP o SC-19.
 */
const { t } = useI18n();
const api = useApi();

const form = reactive({ name: '', phone: '', email: '' });
const agreed = ref(true);
const loading = ref(false);
const errors = reactive<Record<string, string>>({});

async function submit(): Promise<void> {
  Object.keys(errors).forEach((key) => delete errors[key]);
  if (!form.name.trim()) errors.name = t('validate.name');
  if (!form.phone.trim()) errors.phone = t('validate.phone');
  if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    errors.email = t('validate.emailBad');
  }
  if (!agreed.value) errors.agreed = t('validate.terms');
  if (Object.keys(errors).length > 0) return;

  loading.value = true;
  try {
    const sent = await api.post<OtpRequestResponse>('/auth/otp/request', {
      phone: form.phone.trim(),
      purpose: 'REGISTER',
    });
    const query = new URLSearchParams({
      phone: form.phone.trim(),
      purpose: 'REGISTER',
      name: form.name.trim(),
    });
    if (form.email.trim()) query.set('email', form.email.trim());
    // May chu phat trien chua noi cong SMS thi gui kem ma de SC-19 hien ra.
    if (sent.devCode) query.set('dev', sent.devCode);
    await navigateTo(`/verify-otp?${query}`);
  } catch (caught) {
    errors.phone = normalizeError(caught).message;
  } finally {
    loading.value = false;
  }
}

useHead({ title: () => t('sc17.title') });
</script>

<template>
  <form class="flex flex-col gap-3 pb-4 pt-2" @submit.prevent="submit">
    <h3>{{ $t('sc17.title') }}</h3>

    <AyField for="name" :label="$t('sc14.fullName')" required :error="errors.name">
      <input id="name" v-model="form.name" class="input" autocomplete="name" :placeholder="$t('common.namePlaceholder')" />
    </AyField>

    <AyField for="phone" :label="$t('sc14.phone')" required :error="errors.phone">
      <AyPhoneField id="phone" v-model="form.phone" :invalid="Boolean(errors.phone)" />
    </AyField>

    <AyField for="email" :label="$t('sc14.email')" :error="errors.email">
      <input
        id="email"
        v-model="form.email"
        class="input"
        type="email"
        autocomplete="email"
        placeholder="nguyenvana@example.com"
      />
    </AyField>

    <label class="flex cursor-pointer items-start gap-2.5 text-[12.5px]">
      <input v-model="agreed" type="checkbox" class="mt-[3px]" />
      <i18n-t keypath="sc17.agree" tag="span">
        <template #terms><NuxtLink to="/terms">{{ $t('sc17.termsLink') }}</NuxtLink></template>
        <template #privacy>
          <NuxtLink to="/privacy">{{ $t('sc17.privacyLink') }}</NuxtLink>
        </template>
      </i18n-t>
    </label>
    <p v-if="errors.agreed" class="field-error">{{ errors.agreed }}</p>

    <button
      type="submit"
      class="btn btn-primary btn-block"
      style="min-height: 48px; font-size: 15px; margin: 0"
      :disabled="loading"
    >
      {{ loading ? $t('common.sending') : $t('sc17.submit') }}
    </button>

    <NuxtLink to="/login" class="btn btn-ghost self-center text-[13px]">
      {{ $t('sc17.haveAccount') }}
    </NuxtLink>
  </form>
</template>
