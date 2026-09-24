<script setup lang="ts">
import type { ApiError, CustomerProfile } from '~/types/models';

/** SC-33 Ho so ca nhan — FR-AUTH-06, FR-AUTH-07. */
definePageMeta({ middleware: 'auth' });

const api = useApi();
const ui = useUiStore();

const { data: profile } = await useAsyncData('profile', () =>
  api.get<CustomerProfile>('/auth/profile'),
);

const form = reactive({ name: '', nameKana: '', email: '', address: '' });
const saving = ref(false);
const error = ref<ApiError | null>(null);

watchEffect(() => {
  if (!profile.value) return;
  form.name = profile.value.name;
  form.nameKana = profile.value.nameKana ?? '';
  form.email = profile.value.email ?? '';
  form.address = profile.value.address ?? '';
});

async function save(): Promise<void> {
  saving.value = true;
  error.value = null;
  try {
    await api.put('/auth/profile', {
      name: form.name.trim(),
      nameKana: form.nameKana.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
    });
    ui.success('Đã lưu hồ sơ');
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    saving.value = false;
  }
}

useHead({ title: 'Hồ sơ cá nhân' });
</script>

<template>
  <div class="flex flex-col gap-5">
    <AyPageHeader code="SC-33" title="Hồ sơ cá nhân" />
    <AccountNav />

    <form class="ay-card grid max-w-2xl gap-3 sm:grid-cols-2" @submit.prevent="save">
      <AyField label="Số điện thoại" hint="Đây là tên đăng nhập, không đổi trực tuyến được">
        <template #default="{ id }">
          <input :id="id" class="ay-input bg-neutral-200" type="tel" :value="profile?.phone" disabled>
        </template>
      </AyField>

      <AyField label="Họ tên" required>
        <template #default="{ id }">
          <input :id="id" v-model="form.name" class="ay-input" type="text" required>
        </template>
      </AyField>

      <AyField label="Họ tên (kana)" hint="フリガナ">
        <template #default="{ id }">
          <input :id="id" v-model="form.nameKana" class="ay-input" type="text">
        </template>
      </AyField>

      <AyField label="Email">
        <template #default="{ id }">
          <input :id="id" v-model="form.email" class="ay-input" type="email">
        </template>
      </AyField>

      <AyField label="Địa chỉ" class="sm:col-span-2">
        <template #default="{ id }">
          <input :id="id" v-model="form.address" class="ay-input" type="text">
        </template>
      </AyField>

      <div class="sm:col-span-2">
        <AyErrorNote :error="error" />
      </div>

      <div class="sm:col-span-2">
        <AyButton type="submit" :loading="saving">Lưu thay đổi</AyButton>
      </div>
    </form>
  </div>
</template>
