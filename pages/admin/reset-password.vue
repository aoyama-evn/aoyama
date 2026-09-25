<script setup lang="ts">
/**
 * Dat mat khau moi tu duong dan trong email — buoc sau cua SA-01b.
 * Ban thiet ke khong ve rieng man hinh nay; giu dung phong cach the toi cua
 * SA-01 de lien mach.
 */
definePageMeta({ layout: 'auth' });

const { t } = useI18n();
const api = useApi();
const route = useRoute();
const ui = useUiStore();

const adminId = String(route.query.id ?? '');
const token = String(route.query.token ?? '');

const password = ref('');
const confirm = ref('');
const saving = ref(false);
const errorText = ref<string | null>(null);

async function submit(): Promise<void> {
  errorText.value = null;
  if (password.value.length < 10) {
    errorText.value = t('sa01c.tooShort');
    return;
  }
  if (password.value !== confirm.value) {
    errorText.value = t('sa01c.mismatch');
    return;
  }
  saving.value = true;
  try {
    await api.post('/auth/admin/reset-password', {
      adminId,
      token,
      newPassword: password.value,
    });
    ui.success(t('sa01c.done'), t('sa01c.doneSub'));
    await navigateTo('/admin/login');
  } catch (caught) {
    errorText.value = normalizeError(caught).message;
  } finally {
    saving.value = false;
  }
}

useHead({ title: () => `${t('sa01c.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <p class="font-heading text-[20px]" style="color: var(--color-accent-300)">{{ $t('sa01c.title') }}</p>

    <p
      v-if="!adminId || !token"
      class="text-[12.5px] leading-[1.55]"
      style="color: var(--color-neutral-300)"
    >
      {{ $t('sa01c.badLink') }}
    </p>

    <form v-else class="flex flex-col gap-3.5" @submit.prevent="submit">
      <AyField for="pw" :label="$t('sa01c.newPw')" required :hint="$t('sa01c.newPwHint')">
        <input
          id="pw"
          v-model="password"
          class="input"
          type="password"
          autocomplete="new-password"
        />
      </AyField>

      <AyField for="pw2" :label="$t('sa01c.repeatPw')" required :error="errorText ?? undefined">
        <input
          id="pw2"
          v-model="confirm"
          class="input"
          type="password"
          autocomplete="new-password"
        />
      </AyField>

      <button
        type="submit"
        class="btn btn-primary btn-block"
        style="min-height: 48px; font-size: 15px; margin: 0"
        :disabled="saving"
      >
        {{ saving ? $t('common.saving') : $t('sa01c.submit') }}
      </button>
    </form>

    <NuxtLink
      to="/admin/login"
      class="btn btn-ghost self-center text-[13px]"
      style="color: var(--color-accent-300)"
    >
      {{ $t('sa01.backToLogin') }}
    </NuxtLink>
  </div>
</template>
