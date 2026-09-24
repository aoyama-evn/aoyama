<script setup lang="ts">
import type { ApiError, I18nText, Store } from '~/types/models';

/** SA-33 Them hoac sua cua hang — FR-STO-01, FR-STO-02, FR-I18N-04. */
definePageMeta({ layout: 'admin', middleware: ['admin', 'admin-only'] });

const route = useRoute();
const api = useApi();
const ui = useUiStore();

const id = route.params.id as string;
const isNew = id === 'new';

const form = reactive({
  code: '',
  name: {} as I18nText,
  description: {} as I18nText,
  address: {} as I18nText,
  phone: '',
  email: '',
  latitude: '',
  longitude: '',
  defaultCapacity: 3,
  isActive: true,
  sortOrder: 0,
});
const saving = ref(false);
const error = ref<ApiError | null>(null);

if (!isNew) {
  const { data } = await useAsyncData(`admin-store-${id}`, () => api.get<Store>(`/admin/stores/${id}`));
  if (data.value) {
    Object.assign(form, {
      code: data.value.code,
      name: data.value.name ?? {},
      description: data.value.description ?? {},
      address: data.value.address ?? {},
      phone: data.value.phone,
      email: data.value.email ?? '',
      latitude: data.value.latitude ?? '',
      longitude: data.value.longitude ?? '',
      defaultCapacity: data.value.defaultCapacity,
      isActive: data.value.isActive,
      sortOrder: data.value.sortOrder,
    });
  }
}

async function save(): Promise<void> {
  if (!form.code.trim() || !form.phone.trim() || !(form.name.ja || form.name.en || form.name.vi)) {
    ui.warning('Cần mã cửa hàng, số điện thoại và ít nhất một bản dịch tên');
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    const body = {
      ...form,
      email: form.email || undefined,
      latitude: form.latitude || undefined,
      longitude: form.longitude || undefined,
    };
    if (isNew) {
      const created = await api.post<Store>('/admin/stores', body);
      ui.success('Đã thêm cửa hàng', 'Hãy cấu hình giờ làm việc và khung giờ nhận xe.');
      await navigateTo(`/admin/stores/${created.id}/hours`);
    } else {
      await api.put(`/admin/stores/${id}`, body);
      ui.success('Đã lưu cửa hàng');
      await navigateTo('/admin/stores');
    }
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    saving.value = false;
  }
}

useHead({ title: isNew ? 'Thêm cửa hàng' : 'Sửa cửa hàng' });
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <AyPageHeader
      code="SA-33" :title="isNew ? 'Thêm cửa hàng' : 'Sửa cửa hàng'" back-to="/admin/stores"
    />

    <section class="card grid gap-3 sm:grid-cols-2">
      <AyField label="Mã cửa hàng" required>
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.code" class="input font-mono" type="text" placeholder="AY-HAMAMATSU">
        </template>
      </AyField>

      <AyField label="Số điện thoại" required>
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.phone" class="input" type="tel">
        </template>
      </AyField>

      <div class="sm:col-span-2"><AyI18nInput v-model="form.name" label="Tên cửa hàng" required /></div>
      <div class="sm:col-span-2"><AyI18nInput v-model="form.address" label="Địa chỉ" required /></div>
      <div class="sm:col-span-2"><AyI18nInput v-model="form.description" label="Giới thiệu" multiline /></div>

      <AyField label="Email">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.email" class="input" type="email">
        </template>
      </AyField>

      <AyField label="Sức tiếp nhận mặc định" hint="Số xe tối đa mỗi khung giờ khi chưa cấu hình riêng">
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="form.defaultCapacity" class="input" type="number" min="1">
        </template>
      </AyField>

      <AyField label="Vĩ độ">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.latitude" class="input" type="text" placeholder="34.7108000">
        </template>
      </AyField>

      <AyField label="Kinh độ">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.longitude" class="input" type="text" placeholder="137.7261000">
        </template>
      </AyField>

      <AyField label="Thứ tự hiển thị">
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="form.sortOrder" class="input" type="number">
        </template>
      </AyField>

      <label class="flex items-center gap-2.5 self-end text-[14px]">
        <input v-model="form.isActive" type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]">
        Đang hoạt động
      </label>
    </section>

    <AyErrorNote :error="error" />

    <div class="flex gap-2">
      <AyButton :loading="saving" @click="save">Lưu</AyButton>
      <AyButton to="/admin/stores" variant="secondary">Hủy</AyButton>
    </div>
  </div>
</template>
