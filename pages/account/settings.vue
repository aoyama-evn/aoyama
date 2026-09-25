<script setup lang="ts">
import type { CustomerProfile, LanguageCode } from '~/types/models';

/** SC-34 Cai dat thong bao va ngon ngu — FR-I18N-03, FR-NOT-14. */
definePageMeta({ middleware: 'auth' });

const api = useApi();
const ui = useUiStore();
const { setLocale, t } = useI18n();

const { data: profile } = await useAsyncData('settings-profile', () =>
  api.get<CustomerProfile>('/auth/profile'),
);

const form = reactive({ notifySms: true, notifyEmail: false, language: 'ja' as LanguageCode });
const saving = ref(false);

watchEffect(() => {
  if (!profile.value) return;
  form.notifySms = profile.value.notifySms;
  form.notifyEmail = profile.value.notifyEmail;
  form.language = profile.value.language;
});

async function save(): Promise<void> {
  saving.value = true;
  try {
    await api.put('/auth/profile', { ...form });
    setLocale(form.language);
    ui.success(t('sc34.saved'));
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    saving.value = false;
  }
}

const LANGS: { code: LanguageCode; label: string }[] = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
];

useHead({ title: () => t('sc34.title') });
</script>

<template>
  <div class="flex flex-col gap-5">
    <AyPageHeader code="SC-34" :title="$t('sc34.title')" />
    <AccountNav />

    <form class="card flex max-w-2xl flex-col gap-4" @submit.prevent="save">
      <fieldset class="flex flex-col gap-2">
        <legend class="label">{{ $t('sc34.channels') }}</legend>
        <label class="flex items-start gap-2.5 text-[14px]">
          <input v-model="form.notifySms" type="checkbox" class="mt-1 h-4 w-4 accent-[var(--color-accent)]">
          <span>
            <strong>SMS</strong>
            <span class="block text-[12.5px] text-muted">
              {{ $t('sc34.smsHint') }}
            </span>
          </span>
        </label>
        <label class="flex items-start gap-2.5 text-[14px]">
          <input v-model="form.notifyEmail" type="checkbox" class="mt-1 h-4 w-4 accent-[var(--color-accent)]">
          <span>
            <strong>Email</strong>
            <span class="block text-[12.5px] text-muted">{{ $t('sc34.emailHint') }}</span>
          </span>
        </label>
      </fieldset>

      <AyField :label="$t('sc34.language')">
        <template #default="{ id }">
          <select :id="id" v-model="form.language" class="input">
            <option v-for="lang in LANGS" :key="lang.code" :value="lang.code">{{ lang.label }}</option>
          </select>
        </template>
      </AyField>

      <AyButton type="submit" class="self-start" :loading="saving">{{ $t('sc34.save') }}</AyButton>
    </form>
  </div>
</template>
