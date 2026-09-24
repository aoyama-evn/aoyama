<script setup lang="ts">
import type { ApiError, I18nText, Part } from '~/types/models';

/** SA-26 Them hoac sua phu tung — FR-PRT-01..03. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();

const id = route.params.id as string;
const isNew = id === 'new';

const form = reactive({
  code: '', name: {} as I18nText, maker: '', makerPartNo: '', category: '',
  specification: '', unit: 'pcs', costPrice: 0, sellPrice: 0,
  createdSource: 'MANUAL', isActive: true,
});
const compatible = ref<string[]>([]);
const compatibleInput = ref('');
const images = ref<string[]>([]);
const saving = ref(false);
const error = ref<ApiError | null>(null);

if (!isNew) {
  const { data } = await useAsyncData(`admin-part-${id}`, () => api.get<Part>(`/admin/parts/${id}`));
  if (data.value) {
    Object.assign(form, {
      code: data.value.code,
      name: data.value.name ?? {},
      maker: data.value.maker ?? '',
      makerPartNo: data.value.makerPartNo ?? '',
      category: data.value.category ?? '',
      specification: data.value.specification ?? '',
      unit: data.value.unit,
      costPrice: data.value.costPrice,
      sellPrice: data.value.sellPrice,
      createdSource: data.value.createdSource,
      isActive: data.value.isActive,
    });
    compatible.value = data.value.compatibleVehicles ?? [];
    images.value = data.value.imageUrls ?? [];
  }
} else if (route.query.prefill) {
  /** AI-04 — du lieu do AI nhan dang chuyen sang, Admin van phai kiem tra (BR-43). */
  try {
    const prefill = JSON.parse(String(route.query.prefill));
    Object.assign(form, {
      name: prefill.name ? { ja: prefill.name } : {},
      maker: prefill.maker ?? '',
      makerPartNo: prefill.makerPartNo ?? '',
      category: prefill.category ?? '',
      specification: prefill.specification ?? '',
      createdSource: 'AI_IMAGE',
    });
    compatible.value = prefill.compatibleVehicles ?? [];
  } catch {
    // Du lieu dien san hong thi bo qua, nguoi dung nhap tay.
  }
}

function addCompatible(): void {
  const value = compatibleInput.value.trim();
  if (value && !compatible.value.includes(value)) {
    compatible.value = [...compatible.value, value];
  }
  compatibleInput.value = '';
}

const margin = computed(() =>
  form.sellPrice > 0 ? Math.round(((form.sellPrice - form.costPrice) / form.sellPrice) * 100) : 0,
);

async function save(): Promise<void> {
  if (!form.code.trim() || !(form.name.ja || form.name.en || form.name.vi)) {
    ui.warning('Cần mã phụ tùng và ít nhất một bản dịch tên');
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    const body = {
      ...form,
      maker: form.maker || undefined,
      makerPartNo: form.makerPartNo || undefined,
      category: form.category || undefined,
      specification: form.specification || undefined,
      compatibleVehicles: compatible.value,
      imageUrls: images.value,
    };
    if (isNew) await api.post('/admin/parts', body);
    else await api.put(`/admin/parts/${id}`, body);
    ui.success(isNew ? 'Đã thêm phụ tùng' : 'Đã lưu phụ tùng');
    await navigateTo('/admin/parts');
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    saving.value = false;
  }
}

useHead({ title: isNew ? 'Thêm phụ tùng' : 'Sửa phụ tùng' });
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <AyPageHeader
      code="SA-26" :title="isNew ? 'Thêm phụ tùng' : 'Sửa phụ tùng'" back-to="/admin/parts"
    >
      <template #actions>
        <AyAiBadge v-if="form.createdSource === 'AI_IMAGE'" />
      </template>
    </AyPageHeader>

    <p
      v-if="form.createdSource === 'AI_IMAGE' && isNew"
      class="rounded-xl bg-teal-100 px-3 py-2.5 text-[13px] text-teal-800"
    >
      Thông tin dưới đây do trợ lý AI điền sẵn từ ảnh. Hãy kiểm tra lại trước khi lưu.
    </p>

    <section class="card grid gap-3 sm:grid-cols-2">
      <AyField label="Mã phụ tùng" required>
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.code" class="input font-mono" type="text" placeholder="P-OIL-10W30">
        </template>
      </AyField>

      <AyField label="Mã của hãng">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.makerPartNo" class="input font-mono" type="text">
        </template>
      </AyField>

      <div class="sm:col-span-2"><AyI18nInput v-model="form.name" label="Tên phụ tùng" required /></div>

      <AyField label="Hãng sản xuất">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.maker" class="input" type="text">
        </template>
      </AyField>

      <AyField label="Nhóm">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.category" class="input" type="text" placeholder="OIL / BRAKE / TYRE">
        </template>
      </AyField>

      <AyField label="Quy cách" class="sm:col-span-2">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.specification" class="input" type="text">
        </template>
      </AyField>

      <AyField label="Đơn vị">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.unit" class="input" type="text">
        </template>
      </AyField>

      <AyField label="Giá nhập (JPY)">
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="form.costPrice" class="input" type="number" min="0">
        </template>
      </AyField>

      <AyField label="Giá bán (JPY)" :hint="`Biên lợi nhuận ${margin}%`">
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="form.sellPrice" class="input" type="number" min="0">
        </template>
      </AyField>

      <label class="flex items-center gap-2.5 self-end text-[14px]">
        <input v-model="form.isActive" type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]">
        Đang sử dụng
      </label>
    </section>

    <section class="card">
      <h2 class="mb-2 font-heading text-[16px]">Xe tương thích</h2>
      <div class="flex gap-2">
        <input
          v-model="compatibleInput" class="input flex-1" type="text"
          placeholder="Honda PCX 125" aria-label="Thêm xe tương thích"
          @keyup.enter="addCompatible"
        >
        <AyButton variant="secondary" @click="addCompatible">Thêm</AyButton>
      </div>
      <ul v-if="compatible.length" class="mt-2 flex flex-wrap gap-1.5">
        <li v-for="(item, index) in compatible" :key="item" class="tag bg-neutral-200 text-neutral-700">
          {{ item }}
          <button type="button" :aria-label="`Xóa ${item}`" @click="compatible.splice(index, 1)">×</button>
        </li>
      </ul>
    </section>

    <section class="card">
      <AyImageUpload v-model="images" label="Ảnh phụ tùng" :max="4" />
    </section>

    <AyErrorNote :error="error" />

    <div class="flex gap-2">
      <AyButton :loading="saving" @click="save">Lưu</AyButton>
      <AyButton to="/admin/parts" variant="secondary">Hủy</AyButton>
    </div>
  </div>
</template>
