<script setup lang="ts">
import type { AdminUser, ApiError, Store } from '~/types/models';
import { AdminRole } from '~/types/enums';

/** SA-40 Them hoac sua tai khoan quan tri — FR-USR-02..04. */
definePageMeta({ layout: 'admin', middleware: ['admin', 'admin-only'] });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
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
    ui.warning('Cần tên đăng nhập, họ tên và mật khẩu tối thiểu 8 ký tự');
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
      ui.success('Đã tạo tài khoản', 'Người dùng phải đổi mật khẩu ở lần đăng nhập đầu tiên.');
    } else {
      await api.put(`/admin/users/${id}`, body);
      ui.success('Đã lưu tài khoản');
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
    ui.warning('Mật khẩu mới cần tối thiểu 8 ký tự');
    return;
  }
  resetting.value = true;
  try {
    await api.put(`/admin/users/${id}/reset-password`, { newPassword: resetPassword.value });
    ui.success('Đã đặt lại mật khẩu', 'Người dùng phải đổi mật khẩu khi đăng nhập lần tới.');
    resetPassword.value = '';
  } catch (err) {
    ui.error(normalizeError(err).message);
  } finally {
    resetting.value = false;
  }
}

useHead({ title: isNew ? 'Thêm tài khoản' : 'Sửa tài khoản' });
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-4">
    <AyPageHeader
      code="SA-40" :title="isNew ? 'Thêm tài khoản quản trị' : 'Sửa tài khoản quản trị'"
      back-to="/admin/users"
    />

    <section class="card grid gap-3 sm:grid-cols-2">
      <AyField label="Tên đăng nhập" :required="isNew" hint="Không đổi được sau khi tạo">
        <template #default="{ id: fid }">
          <input
            :id="fid" v-model="form.username" class="input font-mono" type="text"
            :disabled="!isNew" :class="!isNew ? 'bg-neutral-200' : ''"
          >
        </template>
      </AyField>

      <AyField v-if="isNew" label="Mật khẩu" required hint="Tối thiểu 8 ký tự">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.password" class="input" type="password" autocomplete="new-password">
        </template>
      </AyField>

      <AyField label="Họ tên" required>
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.fullName" class="input" type="text">
        </template>
      </AyField>

      <AyField label="Email">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.email" class="input" type="email">
        </template>
      </AyField>

      <AyField label="Điện thoại">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.phone" class="input" type="tel">
        </template>
      </AyField>

      <AyField label="Vai trò" required hint="Quản trị được vào cấu hình, nhật ký và quản lý tài khoản">
        <template #default="{ id: fid }">
          <select :id="fid" v-model="form.role" class="input">
            <option :value="AdminRole.STAFF">Nhân viên</option>
            <option :value="AdminRole.ADMIN">Quản trị</option>
          </select>
        </template>
      </AyField>

      <AyField label="Cửa hàng phụ trách" hint="Bỏ trống = làm việc với mọi cửa hàng">
        <template #default="{ id: fid }">
          <select :id="fid" v-model="form.storeId" class="input">
            <option value="">Mọi cửa hàng</option>
            <option v-for="store in stores ?? []" :key="store.id" :value="store.id">
              {{ i18n(store.name) }}
            </option>
          </select>
        </template>
      </AyField>

      <AyField label="Ngôn ngữ giao diện">
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

    <div class="flex gap-2">
      <AyButton :loading="saving" @click="save">Lưu</AyButton>
      <AyButton to="/admin/users" variant="secondary">Hủy</AyButton>
    </div>

    <section v-if="!isNew" class="card">
      <h2 class="mb-2 font-heading text-[16px]">Đặt lại mật khẩu</h2>
      <p class="mb-2 text-[12.5px] text-muted">
        Người dùng sẽ bị buộc đổi mật khẩu ở lần đăng nhập kế tiếp, và mọi phiên đang mở bị thu hồi.
      </p>
      <div class="flex flex-wrap gap-2">
        <input
          v-model="resetPassword" class="input max-w-xs flex-1" type="password"
          placeholder="Mật khẩu mới" autocomplete="new-password" aria-label="Mật khẩu mới"
        >
        <AyButton variant="secondary" :loading="resetting" @click="doResetPassword">Đặt lại</AyButton>
      </div>
    </section>
  </div>
</template>
