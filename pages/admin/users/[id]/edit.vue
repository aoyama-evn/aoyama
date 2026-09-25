<script setup lang="ts">
import type { AdminUser, ApiError, Store } from '~/types/models';
import { AdminRole } from '~/types/enums';

/** SA-40 Them hoac sua tai khoan quan tri — FR-USR-02..04. */
definePageMeta({ layout: 'admin', middleware: ['admin', 'admin-only'] });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { i18n } = useFormat();

const id = route.params.id as string;
const isNew = id === 'new';

const { data: stores } = await useAsyncData('user-stores', () => api.get<Store[]>('/admin/stores'));

const form = reactive({
  username: '',
  password: '',
  fullName: '',
  email: '',
  phone: '',
  role: AdminRole.STAFF as string,
  storeId: '',
  language: 'ja',
});
const saving = ref(false);
const error = ref<ApiError | null>(null);
const resetPassword = ref('');
const resetting = ref(false);

if (!isNew) {
  const { data } = await useAsyncData(`admin-user-${id}`, () =>
    api.get<AdminUser>(`/admin/users/${id}`),
  );
  if (data.value) {
    Object.assign(form, {
      username: data.value.username,
      fullName: data.value.fullName,
      email: data.value.email ?? '',
      phone: data.value.phone ?? '',
      role: data.value.role,
      storeId: data.value.storeId ?? '',
      language: data.value.language,
    });
  }
}

async function save(): Promise<void> {
  if (!form.fullName.trim() || (isNew && (!form.username.trim() || form.password.length < 8))) {
    ui.warning(t('sa40.needFields'));
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    const body = {
      fullName: form.fullName.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      role: form.role,
      storeId: form.storeId || undefined,
      language: form.language,
    };
    if (isNew) {
      await api.post('/admin/users', {
        ...body,
        username: form.username.trim(),
        password: form.password,
      });
      ui.success(t('sa40.created'), t('sa40.createdSub'));
    } else {
      await api.put(`/admin/users/${id}`, body);
      ui.success(t('sa40.saved'));
    }
    await navigateTo('/admin/users');
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    saving.value = false;
  }
}

async function doResetPassword(): Promise<void> {
  if (resetPassword.value.length < 8) {
    ui.warning(t('sa40.pwTooShort'));
    return;
  }
  resetting.value = true;
  try {
    await api.put(`/admin/users/${id}/reset-password`, { newPassword: resetPassword.value });
    ui.success(t('sa40.resetDone'), t('sa40.resetDoneSub'));
    resetPassword.value = '';
  } catch (err) {
    ui.error(normalizeError(err).message);
  } finally {
    resetting.value = false;
  }
}

setScreenTitle(() => (isNew ? t('sa40.headAdd') : t('sa40.headEdit')));
useHead({ title: () => (isNew ? t('sa40.headAdd') : t('sa40.headEdit')) });
</script>

<template>
  <div class="admin-form">
    <AyPageHeader
      code="SA-40" :title="isNew ? $t('sa40.addTitle') : $t('sa40.editTitle')"
      back-to="/admin/users"
    />

    <section class="card admin-grid" style="background: #fff">
      <AyField :label="$t('sa39.colUsername')" :required="isNew" :hint="$t('sa40.usernameHint')">
        <template #default="{ id: fid }">
          <input
            :id="fid" v-model="form.username" class="input font-mono" type="text"
            :disabled="!isNew" :class="!isNew ? 'bg-neutral-200' : ''"
          >
        </template>
      </AyField>

      <AyField v-if="isNew" :label="$t('sa01.password')" required :hint="$t('sa40.passwordHint')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.password" class="input" type="password" autocomplete="new-password">
        </template>
      </AyField>

      <AyField :label="$t('sa39.colName')" required>
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.fullName" class="input" type="text">
        </template>
      </AyField>

      <AyField :label="$t('sc14.email')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.email" class="input" type="email">
        </template>
      </AyField>

      <AyField :label="$t('sa15.colPhone')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.phone" class="input" type="tel">
        </template>
      </AyField>

      <AyField :label="$t('sa39.colRole')" required :hint="$t('sa40.roleHint')">
        <template #default="{ id: fid }">
          <select :id="fid" v-model="form.role" class="input">
            <option :value="AdminRole.STAFF">{{ $t('sa39.roleStaff') }}</option>
            <option :value="AdminRole.ADMIN">{{ $t('sa39.roleAdmin') }}</option>
          </select>
        </template>
      </AyField>

      <AyField :label="$t('sa40.storeLabel')" :hint="$t('sa40.storeHint')">
        <template #default="{ id: fid }">
          <select :id="fid" v-model="form.storeId" class="input">
            <option value="">{{ $t('sa39.allStores') }}</option>
            <option v-for="store in stores ?? []" :key="store.id" :value="store.id">
              {{ i18n(store.name) }}
            </option>
          </select>
        </template>
      </AyField>

      <AyField :label="$t('sa40.uiLang')">
        <template #default="{ id: fid }">
          <select :id="fid" v-model="form.language" class="input">
            <option value="ja">日本語</option>
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </template>
      </AyField>
    </section>

    <AyErrorNote :error="error" />

    <div class="admin-actions">
      <AyButton to="/admin/users" variant="secondary">{{ $t('common.cancel') }}</AyButton>
      <AyButton :loading="saving" @click="save">{{ $t('common.save') }}</AyButton>
    </div>

    <section v-if="!isNew" class="card">
      <h2 class="mb-2 font-heading text-[16px]">{{ $t('sa40.resetTitle') }}</h2>
      <p class="mb-2 text-[12.5px] text-muted">
        {{ $t('sa40.resetLead') }}
      </p>
      <div class="flex flex-wrap gap-2">
        <input
          v-model="resetPassword" class="input max-w-xs flex-1" type="password"
          :placeholder="$t('sa40.newPwPlaceholder')" autocomplete="new-password"
          :aria-label="$t('sa40.newPwPlaceholder')"
        >
        <AyButton variant="secondary" :loading="resetting" @click="doResetPassword">{{ $t('sa40.resetCta') }}</AyButton>
      </div>
    </section>
  </div>
</template>
