<script setup lang="ts">
import type { ApiError } from '~/types/models';

/** SA-40 (phan doi mat khau cua chinh minh) — NFR-SE-02. */
definePageMeta({ layout: 'auth', middleware: 'admin' });

const api = useApi();
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
    ui.success('Đã đổi mật khẩu', 'Vui lòng đăng nhập lại bằng mật khẩu mới.');
    // Doi mat khau thi backend thu hoi moi phien — buoc dang nhap lai.
    auth.clear();
    await navigateTo('/admin/login');
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    loading.value = false;
  }
}

useHead({ title: 'Đổi mật khẩu' });
</script>

<template>
  <div class="ay-card flex flex-col gap-4">
    <div>
      <h1 class="font-heading text-[19px]">Đổi mật khẩu</h1>
      <p v-if="auth.user?.mustChangePassword" class="mt-1 text-[13px] text-warning">
        Tài khoản mới cần đổi mật khẩu trước khi sử dụng.
      </p>
    </div>

    <form class="flex flex-col gap-3" @submit.prevent="submit">
      <AyField label="Mật khẩu hiện tại" required>
        <template #default="{ id }">
          <input :id="id" v-model="form.currentPassword" class="ay-input" type="password" autocomplete="current-password" required>
        </template>
      </AyField>

      <AyField label="Mật khẩu mới" required hint="Tối thiểu 8 ký tự">
        <template #default="{ id }">
          <input :id="id" v-model="form.newPassword" class="ay-input" type="password" autocomplete="new-password" minlength="8" required>
        </template>
      </AyField>

      <AyField label="Nhập lại mật khẩu mới" required :error="mismatch ? 'Hai mật khẩu chưa khớp' : undefined">
        <template #default="{ id, invalid }">
          <input :id="id" v-model="form.confirmPassword" class="ay-input" type="password" autocomplete="new-password" :aria-invalid="invalid" required>
        </template>
      </AyField>

      <AyErrorNote :error="error" />

      <AyButton type="submit" block :loading="loading" :disabled="mismatch || form.newPassword.length < 8">
        Đổi mật khẩu
      </AyButton>
    </form>
  </div>
</template>
