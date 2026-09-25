<script setup lang="ts">
/**
 * SA-01b Quen mat khau quan tri.
 * Ban thiet ke co hai trang thai tren cung mot the: o nhap email, va man hinh
 * da gui kem nut gui lai.
 */
definePageMeta({ layout: 'auth' });

const { t } = useI18n();
const api = useApi();

const email = ref('');
const sent = ref(false);
const sending = ref(false);
const errorText = ref<string | null>(null);

async function submit(): Promise<void> {
  errorText.value = null;
  if (!email.value.trim()) {
    errorText.value = t('validate.email');
    return;
  }
  sending.value = true;
  try {
    await api.post('/auth/admin/forgot-password', { email: email.value.trim() });
    sent.value = true;
  } catch (caught) {
    errorText.value = normalizeError(caught).message;
  } finally {
    sending.value = false;
  }
}

useHead({ title: () => `${t('sa01b.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <div class="flex flex-col gap-1.5">
      <p class="font-heading text-[20px]" style="color: var(--color-accent-300)">{{ $t('sa01b.title') }}</p>
      <p
        v-if="!sent"
        class="text-[12.5px] leading-[1.55]"
        style="color: var(--color-neutral-300)"
      >
        {{ $t('sa01b.lead') }}
      </p>
    </div>

    <form v-if="!sent" class="flex flex-col gap-3.5" @submit.prevent="submit">
      <AyField for="email" :label="$t('sc14.email')" required :error="errorText ?? undefined">
        <input
          id="email"
          v-model="email"
          class="input"
          type="email"
          autocomplete="email"
          placeholder="admin@aoyama.example"
        />
      </AyField>
      <button
        type="submit"
        class="btn btn-primary btn-block"
        style="min-height: 48px; font-size: 15px; margin: 0"
        :disabled="sending"
      >
        {{ sending ? $t('common.sending') : $t('sa01b.submit') }}
      </button>
    </form>

    <div v-else class="flex flex-col gap-3">
      <div
        class="flex items-start gap-[11px] px-3.5 py-3"
        style="background: rgb(255 255 255 / 7%); border-radius: 18px"
      >
        <span
          class="grid flex-none place-items-center rounded-full text-[12px] text-white"
          style="width: 24px; height: 24px; background: var(--color-accent-2-500)"
          aria-hidden="true"
        >
          ✓
        </span>
        <p class="text-[13px] leading-[1.55]" style="color: var(--color-neutral-200)">
          <i18n-t keypath="sa01b.sent" tag="span">
            <template #email><strong style="color: #fff">{{ email }}</strong></template>
          </i18n-t>
        </p>
      </div>
      <button
        type="button"
        class="btn btn-secondary btn-block"
        style="
          min-height: 44px; margin: 0;
          color: var(--color-neutral-100); border-color: rgb(255 255 255 / 30%);
        "
        :disabled="sending"
        @click="submit"
      >
        {{ $t('sa01b.resend') }}
      </button>
    </div>

    <NuxtLink
      to="/admin/login"
      class="btn btn-ghost self-center text-[13px]"
      style="color: var(--color-accent-300)"
    >
      {{ $t('sa01.backToLogin') }}
    </NuxtLink>
  </div>
</template>
