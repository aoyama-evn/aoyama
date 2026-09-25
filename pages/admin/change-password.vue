<script setup lang="ts">
import type { ApiError } from '~/types/models';

/** SA-40 (phan doi mat khau cua chinh minh) — NFR-SE-02. */
definePageMeta({ layout: 'auth', middleware: 'admin' });

const api = useApi();
const { t } = useI18n();
const auth = useAuthStore();
const ui = useUiStore();

const form = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' });
const loading = ref(false);
const error = ref<ApiError | null>(null);
const mismatch = computed(
  () => form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword,
);

async function submit(): Promise<void> {
  if (mismatch.value) return;
  error.value = null;
  loading.value = true;
  try {
    await api.put('/auth/admin/password', {
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
    ui.success(t('sa01d.done'), t('sa01d.doneSub'));
    // Doi mat khau thi backend thu hoi moi phien — buoc dang nhap lai.
    auth.clear();
    await navigateTo('/admin/login');
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    loading.value = false;
  }
}

useHead({ title: () => t('sa01d.title') });
</script>

<template>
  <div class="card flex flex-col gap-4">
    <div>
      <h1 class="font-heading text-[19px]">{{ $t('sa01d.title') }}</h1>
      <p v-if="auth.user?.mustChangePassword" class="mt-1 text-[13px] text-warning">
        {{ $t('sa01d.mustChange') }}
      </p>
    </div>

    <form class="flex flex-col gap-3" @submit.prevent="submit">
      <AyField :label="$t('sa01d.currentPw')" required>
        <template #default="{ id }">
          <input :id="id" v-model="form.currentPassword" class="input" type="password" autocomplete="current-password" required>
        </template>
      </AyField>

      <AyField :label="$t('sa01c.newPw')" required :hint="$t('sa01d.newPwHint')">
        <template #default="{ id }">
          <input :id="id" v-model="form.newPassword" class="input" type="password" autocomplete="new-password" minlength="8" required>
        </template>
      </AyField>

      <AyField
        :label="$t('sa01d.repeatNew')"
        required
        :error="mismatch ? $t('sa01d.mismatch') : undefined"
      >
        <template #default="{ id, invalid }">
          <input :id="id" v-model="form.confirmPassword" class="input" type="password" autocomplete="new-password" :aria-invalid="invalid" required>
        </template>
      </AyField>

      <AyErrorNote :error="error" />

      <AyButton type="submit" block :loading="loading" :disabled="mismatch || form.newPassword.length < 8">
        {{ $t('sa01d.title') }}
      </AyButton>
    </form>
  </div>
</template>
