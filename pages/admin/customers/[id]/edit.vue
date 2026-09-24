<script setup lang="ts">
import type { ApiError, CustomerProfile } from '~/types/models';

/** SA-17 Them hoac sua khach hang — FR-CUS-04, FR-CUS-08. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();

const id = route.params.id as string;
const isNew = id === 'new';

const form = reactive({
  phone: '', name: '', nameKana: '', email: '', address: '',
  language: 'ja', internalNote: '',
});
const saving = ref(false);
const error = ref<ApiError | null>(null);

if (!isNew) {
  const { data } = await useAsyncData(`admin-customer-edit-${id}`, () =>
    api.get<CustomerProfile>(`/admin/customers/${id}`),
  );
  if (data.value) {
    Object.assign(form, {
      phone: data.value.phone,
      name: data.value.name,
      nameKana: data.value.nameKana ?? '',
      email: data.value.email ?? '',
      address: data.value.address ?? '',
      language: data.value.language,
      internalNote: data.value.internalNote ?? '',
    });
  }
}

async function save(): Promise<void> {
  saving.value = true;
  error.value = null;
  try {
    const body = {
      phone: form.phone.trim(),
      name: form.name.trim(),
      nameKana: form.nameKana.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      language: form.language,
      internalNote: form.internalNote.trim() || undefined,
    };
    if (isNew) {
      const created = await api.post<CustomerProfile>('/admin/customers', body);
      ui.success('Đã tạo hồ sơ khách hàng');
      await navigateTo(`/admin/customers/${created.id}`);
    } else {
      await api.put(`/admin/customers/${id}`, body);
      ui.success('Đã lưu hồ sơ');
      await navigateTo(`/admin/customers/${id}`);
    }
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    saving.value = false;
  }
}

useHead({ title: isNew ? 'Thêm khách hàng' : 'Sửa khách hàng' });
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-4">
    <AyPageHeader
      code="SA-17" :title="isNew ? 'Thêm khách hàng' : 'Sửa hồ sơ khách hàng'"
      :back-to="isNew ? '/admin/customers' : `/admin/customers/${id}`"
    />

    <form class="ay-card grid gap-3 sm:grid-cols-2" @submit.prevent="save">
      <AyField label="Số điện thoại" required hint="Là khóa định danh khách hàng (BR-01)">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.phone" class="ay-input" type="tel" required>
        </template>
      </AyField>

      <AyField label="Họ tên" required>
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.name" class="ay-input" type="text" required>
        </template>
      </AyField>

      <AyField label="Tên kana">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.nameKana" class="ay-input" type="text">
        </template>
      </AyField>

      <AyField label="Email">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.email" class="ay-input" type="email">
        </template>
      </AyField>

      <AyField label="Địa chỉ" class="sm:col-span-2">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.address" class="ay-input" type="text">
        </template>
      </AyField>

      <AyField label="Ngôn ngữ liên lạc">
        <template #default="{ id: fid }">
          <select :id="fid" v-model="form.language" class="ay-input">
            <option value="ja">日本語</option>
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </template>
      </AyField>

      <AyField label="Ghi chú nội bộ" class="sm:col-span-2">
        <template #default="{ id: fid }">
          <textarea :id="fid" v-model="form.internalNote" class="ay-input min-h-[90px]" />
        </template>
      </AyField>

      <div class="sm:col-span-2"><AyErrorNote :error="error" /></div>

      <div class="flex gap-2 sm:col-span-2">
        <AyButton type="submit" :loading="saving">Lưu</AyButton>
        <AyButton :to="isNew ? '/admin/customers' : `/admin/customers/${id}`" variant="secondary">
          Hủy
        </AyButton>
      </div>
    </form>
  </div>
</template>
