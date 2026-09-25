<script setup lang="ts">
import type { ApiError, CustomerProfile } from '~/types/models';

/**
 * SC-33 Ho so ca nhan — FR-AUTH-06, FR-AUTH-07.
 * Ban thiet ke: the ho so o tren, cac o thong tin, nut luu chi hien khi co thay
 * doi, va nut dang xuat tach rieng duoi duong ke.
 */
definePageMeta({ middleware: 'auth' });

const api = useApi();
const ui = useUiStore();
const auth = useAuthStore();
const { date } = useFormat();

const { data: profile } = await useAsyncData('profile', () =>
  api.get<CustomerProfile>('/auth/profile'),
);

const form = reactive({ name: '', nameKana: '', email: '', address: '' });
const saving = ref(false);
const error = ref<ApiError | null>(null);
const logoutOpen = ref(false);

watchEffect(() => {
  if (!profile.value) return;
  form.name = profile.value.name;
  form.nameKana = profile.value.nameKana ?? '';
  form.email = profile.value.email ?? '';
  form.address = profile.value.address ?? '';
});

/** Chi hien nut luu khi that su co thay doi — dung nhu ban thiet ke. */
const dirty = computed(() => {
  const source = profile.value;
  if (!source) return false;
  return (
    form.name !== source.name ||
    form.nameKana !== (source.nameKana ?? '') ||
    form.email !== (source.email ?? '') ||
    form.address !== (source.address ?? '')
  );
});

const memberSince = computed(() =>
  profile.value?.createdAt ? date(profile.value.createdAt, 'yyyy') : null,
);

const initial = computed(() => (form.name || 'A').trim().charAt(0).toUpperCase());

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
    ui.success('Đã lưu thay đổi');
    if (profile.value) {
      profile.value = {
        ...profile.value,
        name: form.name.trim(),
        nameKana: form.nameKana.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
      };
    }
  } catch (caught) {
    error.value = normalizeError(caught);
  } finally {
    saving.value = false;
  }
}

async function logout(): Promise<void> {
  try {
    if (auth.refreshToken) await api.post('/auth/logout', { refreshToken: auth.refreshToken });
  } finally {
    auth.clear();
    await navigateTo('/');
  }
}

useHead({ title: 'Hồ sơ cá nhân' });
</script>

<template>
  <div class="flex flex-col gap-3 pb-4 pt-1">
    <div class="flex items-center gap-[11px]">
      <span
        class="grid flex-none place-items-center rounded-full font-heading text-[19px]"
        style="width: 48px; height: 48px; background: var(--color-accent); color: var(--color-bg)"
        aria-hidden="true"
      >
        {{ initial }}
      </span>
      <div class="leading-[1.3]">
        <p class="font-heading text-[17px]">{{ form.name || 'Tài khoản' }}</p>
        <p v-if="memberSince" class="text-muted text-[11.5px]">Thành viên từ {{ memberSince }}</p>
      </div>
    </div>

    <AyField for="name" label="Họ tên" required>
      <input id="name" v-model="form.name" class="input" autocomplete="name" />
    </AyField>

    <AyField for="phone" label="Số điện thoại" hint="định danh tài khoản">
      <input
        id="phone"
        class="input"
        :value="profile?.phone ?? ''"
        readonly
        aria-readonly="true"
      />
    </AyField>

    <AyField for="kana" label="Tên kana (tùy chọn)">
      <input id="kana" v-model="form.nameKana" class="input" />
    </AyField>

    <AyField for="email" label="Email (tùy chọn)">
      <input id="email" v-model="form.email" class="input" type="email" autocomplete="email" />
    </AyField>

    <AyField for="address" label="Địa chỉ (tùy chọn)">
      <input id="address" v-model="form.address" class="input" placeholder="—" />
    </AyField>

    <AyErrorNote :error="error" />

    <button
      v-if="dirty"
      type="button"
      class="btn btn-primary btn-block"
      style="min-height: 48px; font-size: 15px; margin: 0"
      :disabled="saving"
      @click="save"
    >
      {{ saving ? 'Đang lưu…' : 'Lưu thay đổi' }}
    </button>

    <div class="mt-0.5 pt-3.5" style="border-top: 1px solid var(--color-divider)">
      <button
        type="button"
        class="btn btn-secondary btn-block justify-center gap-2.5 font-body text-[13.5px]"
        style="min-height: 48px; margin: 0"
        @click="logoutOpen = true"
      >
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
        >
          <path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9" />
          <path d="M14 8l4 4-4 4M18 12H8" />
        </svg>
        Đăng xuất
      </button>
    </div>

    <AyConfirmDialog
      :open="logoutOpen"
      title="Đăng xuất khỏi tài khoản?"
      confirm-label="Đăng xuất"
      cancel-label="Đóng"
      @confirm="logout"
      @cancel="logoutOpen = false"
    />
  </div>
</template>
