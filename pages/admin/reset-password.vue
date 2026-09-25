<script setup lang="ts">
/**
 * Dat mat khau moi tu duong dan trong email — buoc sau cua SA-01b.
 * Ban thiet ke khong ve rieng man hinh nay; giu dung phong cach the toi cua
 * SA-01 de lien mach.
 */
definePageMeta({ layout: 'auth' });

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
    errorText.value = 'Mật khẩu cần ít nhất 10 ký tự';
    return;
  }
  if (password.value !== confirm.value) {
    errorText.value = 'Hai lần nhập mật khẩu chưa khớp';
    return;
  }
  saving.value = true;
  try {
    await api.post('/auth/admin/reset-password', {
      adminId,
      token,
      newPassword: password.value,
    });
    ui.success('Đã đặt mật khẩu mới', 'Hãy đăng nhập lại bằng mật khẩu vừa đặt.');
    await navigateTo('/admin/login');
  } catch (caught) {
    errorText.value = normalizeError(caught).message;
  } finally {
    saving.value = false;
  }
}

useHead({ title: 'Đặt mật khẩu mới — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <p class="font-heading text-[20px]" style="color: var(--color-accent-300)">Đặt mật khẩu mới</p>

    <p
      v-if="!adminId || !token"
      class="text-[12.5px] leading-[1.55]"
      style="color: var(--color-neutral-300)"
    >
      Đường dẫn không hợp lệ. Hãy yêu cầu lại từ màn hình quên mật khẩu.
    </p>

    <form v-else class="flex flex-col gap-3.5" @submit.prevent="submit">
      <AyField for="pw" label="Mật khẩu mới" required hint="ít nhất 10 ký tự">
        <input
          id="pw"
          v-model="password"
          class="input"
          type="password"
          autocomplete="new-password"
        />
      </AyField>

      <AyField for="pw2" label="Nhập lại mật khẩu" required :error="errorText ?? undefined">
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
        {{ saving ? 'Đang lưu…' : 'Đặt mật khẩu' }}
      </button>
    </form>

    <NuxtLink
      to="/admin/login"
      class="btn btn-ghost self-center text-[13px]"
      style="color: var(--color-accent-300)"
    >
      ← Quay lại đăng nhập
    </NuxtLink>
  </div>
</template>
