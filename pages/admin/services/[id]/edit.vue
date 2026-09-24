<script setup lang="ts">
import type { ApiError, I18nText, ServiceItem } from '~/types/models';
import { ServiceType } from '~/types/enums';

/** SA-23 Them hoac sua dich vu — FR-SVC-01..03, FR-SVC-07, FR-I18N-04. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();

const id = route.params.id as string;
const isNew = id === 'new';

const form = reactive({
  code: '',
  slug: '',
  type: ServiceType.MAINTENANCE as string,
  name: {} as I18nText,
  shortDescription: {} as I18nText,
  description: {} as I18nText,
  durationMinutes: 60,
  basePrice: 0,
  quoteOnly: false,
  iconKey: '',
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
  maintenanceIntervalMonths: null as number | null,
  maintenanceIntervalKm: null as number | null,
});
const checklist = ref<I18nText[]>([]);
const saving = ref(false);
const error = ref<ApiError | null>(null);

if (!isNew) {
  const { data } = await useAsyncData(`admin-service-${id}`, () =>
    api.get<ServiceItem>(`/admin/services/${id}`),
  );
  if (data.value) {
    Object.assign(form, {
      code: data.value.code,
      slug: data.value.slug,
      type: data.value.type,
      name: data.value.name ?? {},
      shortDescription: data.value.shortDescription ?? {},
      description: data.value.description ?? {},
      durationMinutes: data.value.durationMinutes,
      basePrice: data.value.basePrice,
      quoteOnly: data.value.quoteOnly,
      iconKey: data.value.iconKey ?? '',
      isActive: data.value.isActive,
      isFeatured: data.value.isFeatured,
      sortOrder: data.value.sortOrder,
      maintenanceIntervalMonths: data.value.maintenanceIntervalMonths,
      maintenanceIntervalKm: data.value.maintenanceIntervalKm,
    });
    checklist.value = data.value.checklistItems ?? [];
  }
}

/** Sinh slug tu ma dich vu de nguoi nhap khong phai go hai lan. */
watch(
  () => form.code,
  (code) => {
    if (isNew && !form.slug) {
      form.slug = code.toLowerCase().replace(/^svc-/, '').replace(/[^a-z0-9]+/g, '-');
    }
  },
);

const ICONS = ['leaf', 'clock', 'target', 'wrench', 'brush', 'shield'];

async function save(): Promise<void> {
  if (!form.code.trim() || !form.slug.trim() || !(form.name.ja || form.name.en || form.name.vi)) {
    ui.warning('Cần mã, đường dẫn và ít nhất một bản dịch tên dịch vụ');
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    const body = {
      ...form,
      iconKey: form.iconKey || undefined,
      checklistItems: checklist.value.filter((c) => c.ja || c.en || c.vi),
    };
    if (isNew) await api.post('/admin/services', body);
    else await api.put(`/admin/services/${id}`, body);
    ui.success(isNew ? 'Đã thêm dịch vụ' : 'Đã lưu dịch vụ');
    await navigateTo('/admin/services');
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    saving.value = false;
  }
}

useHead({ title: isNew ? 'Thêm dịch vụ' : 'Sửa dịch vụ' });
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <AyPageHeader
      code="SA-23" :title="isNew ? 'Thêm dịch vụ' : 'Sửa dịch vụ'" back-to="/admin/services"
      description="Tên và mô tả nhập cho cả ba ngôn ngữ — thiếu bản dịch nào, hệ thống lùi về tiếng Nhật."
    />

    <section class="card grid gap-3 sm:grid-cols-2">
      <AyField label="Mã dịch vụ" required>
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.code" class="input font-mono" type="text" placeholder="SVC-MAINT-PERIODIC">
        </template>
      </AyField>

      <AyField label="Đường dẫn (slug)" required hint="Dùng cho địa chỉ trang dịch vụ">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.slug" class="input font-mono" type="text">
        </template>
      </AyField>

      <AyField label="Phân loại" required>
        <template #default="{ id: fid }">
          <select :id="fid" v-model="form.type" class="input">
            <option :value="ServiceType.MAINTENANCE">Bảo dưỡng</option>
            <option :value="ServiceType.REPAIR">Sửa chữa</option>
          </select>
        </template>
      </AyField>

      <AyField label="Biểu tượng">
        <template #default="{ id: fid }">
          <select :id="fid" v-model="form.iconKey" class="input">
            <option value="">— Không —</option>
            <option v-for="icon in ICONS" :key="icon" :value="icon">{{ icon }}</option>
          </select>
        </template>
      </AyField>

      <div class="sm:col-span-2">
        <AyI18nInput v-model="form.name" label="Tên dịch vụ" required />
      </div>
      <div class="sm:col-span-2">
        <AyI18nInput v-model="form.shortDescription" label="Mô tả ngắn" />
      </div>
      <div class="sm:col-span-2">
        <AyI18nInput v-model="form.description" label="Mô tả chi tiết" multiline />
      </div>
    </section>

    <section class="card">
      <div class="mb-2 flex items-baseline justify-between">
        <h2 class="font-heading text-[16px]">Hạng mục kiểm tra</h2>
        <AyButton variant="ghost" size="sm" @click="checklist.push({})">+ Thêm hạng mục</AyButton>
      </div>
      <div v-for="(item, index) in checklist" :key="index" class="mb-2 flex items-end gap-2">
        <AyI18nInput v-model="checklist[index]" class="flex-1" />
        <button type="button" class="btn btn-ghost text-[12.5px] text-danger" @click="checklist.splice(index, 1)">
          Xóa
        </button>
      </div>
      <p v-if="checklist.length === 0" class="text-[13px] text-muted">
        Chưa có hạng mục nào. Danh sách này hiện trên trang chi tiết dịch vụ của khách.
      </p>
    </section>

    <section class="card grid gap-3 sm:grid-cols-2">
      <h2 class="font-heading text-[16px] sm:col-span-2">Thời gian &amp; giá</h2>

      <AyField label="Thời gian ước tính (phút)" required>
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="form.durationMinutes" class="input" type="number" min="5">
        </template>
      </AyField>

      <AyField label="Giá cơ sở (JPY)" hint="Giá cho xe dưới 125cc; phân khúc khác đặt ở bảng giá">
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="form.basePrice" class="input" type="number" min="0" :disabled="form.quoteOnly">
        </template>
      </AyField>

      <AyField label="Chu kỳ bảo dưỡng (tháng)" hint="Nguồn để hệ thống nhắc khách đến kỳ">
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="form.maintenanceIntervalMonths" class="input" type="number" min="1">
        </template>
      </AyField>

      <AyField label="Chu kỳ bảo dưỡng (km)">
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="form.maintenanceIntervalKm" class="input" type="number" min="1">
        </template>
      </AyField>

      <label class="flex items-center gap-2.5 text-[14px]">
        <input v-model="form.quoteOnly" type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]">
        Chỉ báo giá riêng (không hiện giá cố định)
      </label>
      <label class="flex items-center gap-2.5 text-[14px]">
        <input v-model="form.isFeatured" type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]">
        Hiện trên trang chủ
      </label>
      <label class="flex items-center gap-2.5 text-[14px]">
        <input v-model="form.isActive" type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]">
        Đang bán
      </label>

      <AyField label="Thứ tự hiển thị">
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="form.sortOrder" class="input" type="number">
        </template>
      </AyField>
    </section>

    <AyErrorNote :error="error" />

    <div class="flex gap-2">
      <AyButton :loading="saving" @click="save">Lưu</AyButton>
      <AyButton to="/admin/services" variant="secondary">Hủy</AyButton>
    </div>
  </div>
</template>
