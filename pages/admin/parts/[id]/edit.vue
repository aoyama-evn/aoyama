<script setup lang="ts">
import type { ApiError, I18nText, Part } from '~/types/models';

/** SA-26 Them hoac sua phu tung — FR-PRT-01..03. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const { t, locale } = useI18n();
const api = useApi();
const ui = useUiStore();

const id = route.params.id as string;
const isNew = id === 'new';

const form = reactive({
  code: '', maker: '', makerPartNo: '', category: '',
  specification: '', unit: 'pcs', costPrice: 0, sellPrice: 0,
  createdSource: 'MANUAL', isActive: true,
});

/**
 * Ten phu tung chi go MOT lan, bang thu tieng nhan vien dang dung.
 *
 * Truoc day la ba tab JA / EN / VI. Nguoi nhap kho khong biet tieng Nhat
 * lan tieng Anh nen gan nhu lan nao cung chi dien mot tab, va khach xem
 * bang hai thu tieng kia thay o trong. Gio may chu dich not khi luu.
 */
const nameText = ref('');
/** Ten o thu tieng khac, de nguoi sua con doi chieu duoc khi o nay trong. */
const nameOther = ref('');

function readName(value: I18nText | null | undefined): void {
  const name = value ?? {};
  nameText.value = name[locale.value as keyof I18nText] ?? '';
  nameOther.value = nameText.value
    ? ''
    : (['ja', 'en', 'vi'] as const).map((lang) => name[lang]).find(Boolean) ?? '';
}
const compatible = ref<string[]>([]);
const compatibleInput = ref('');
const images = ref<string[]>([]);
const saving = ref(false);
const error = ref<ApiError | null>(null);

if (!isNew) {
  const { data } = await useAsyncData(`admin-part-${id}`, () => api.get<Part>(`/admin/parts/${id}`));
  if (data.value) {
    readName(data.value.name);
    Object.assign(form, {
      code: data.value.code,
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
    // SA-27 goi AI kem ngon ngu dang dung, nen ten tra ve da dung thu tieng nay.
    nameText.value = prefill.name ?? '';
    Object.assign(form, {
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
  if (!nameText.value.trim()) {
    ui.warning(t('sa26.needFields'));
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    const { code, ...rest } = form;
    const body = {
      ...rest,
      /**
       * Gui dung mot o. May chu dien not hai thu tieng con lai; gui ca ba
       * thi no hieu la nguoi dung da tu dich va giu nguyen.
       */
      name: { [locale.value]: nameText.value.trim() } as I18nText,
      maker: form.maker || undefined,
      makerPartNo: form.makerPartNo || undefined,
      category: form.category || undefined,
      specification: form.specification || undefined,
      compatibleVehicles: compatible.value,
      imageUrls: images.value,
    };
    if (isNew) await api.post('/admin/parts', body);
    else await api.put(`/admin/parts/${id}`, body);
    ui.success(isNew ? t('sa26.added') : t('sa26.saved'));
    await navigateTo('/admin/parts');
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    saving.value = false;
  }
}

setScreenTitle(() => (isNew ? t('sa26.addTitle') : t('sa26.editTitle')));
useHead({ title: () => (isNew ? t('sa26.addTitle') : t('sa26.editTitle')) });
</script>

<template>
  <div class="admin-form">
    <AyPageHeader
      code="SA-26"
      :title="isNew ? $t('sa26.addTitle') : $t('sa26.editTitle')"
      back-to="/admin/parts"
    >
      <template #actions>
        <AyAiBadge v-if="form.createdSource === 'AI_IMAGE'" />
      </template>
    </AyPageHeader>

    <p
      v-if="form.createdSource === 'AI_IMAGE' && isNew"
      class="rounded-xl bg-olive-100 px-3 py-2.5 text-[13px] text-olive-800"
    >
      {{ $t('sa26.aiPrefill') }}
    </p>

    <section class="card admin-grid" style="background: #fff">
      <!-- Ma do he thong sinh khi luu, khong cho sua: xem formatPartCode ben may chu. -->
      <AyField :label="$t('sa26.code')">
        <template #default="{ id: fid }">
          <input
            :id="fid" class="input font-mono" type="text" readonly disabled
            :value="form.code" :placeholder="$t('sa26.codeAuto')"
          >
        </template>
      </AyField>

      <AyField :label="$t('sa26.makerPartNo')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.makerPartNo" class="input font-mono" type="text">
        </template>
      </AyField>

      <AyField
        class="ay-col-full"
        :label="$t('sa26.nameLabel')"
        required
        :hint="nameOther ? $t('sa26.nameOther', { text: nameOther }) : $t('sa26.nameAutoTranslate')"
      >
        <template #default="{ id: fid }">
          <input :id="fid" v-model="nameText" class="input" type="text" :placeholder="nameOther">
        </template>
      </AyField>

      <AyField :label="$t('sa26.maker')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.maker" class="input" type="text">
        </template>
      </AyField>

      <AyField :label="$t('sa25.colCategory')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.category" class="input" type="text" placeholder="OIL / BRAKE / TYRE">
        </template>
      </AyField>

      <AyField :label="$t('sa26.spec')" class="ay-col-full">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.specification" class="input" type="text">
        </template>
      </AyField>

      <AyField :label="$t('sa26.unit')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.unit" class="input" type="text">
        </template>
      </AyField>

      <AyField :label="$t('sa26.costPrice')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="form.costPrice" class="input" type="number" min="0">
        </template>
      </AyField>

      <AyField :label="$t('sa26.sellPrice')" :hint="$t('sa26.margin', { n: margin })">
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="form.sellPrice" class="input" type="number" min="0">
        </template>
      </AyField>

      <label class="flex items-center gap-2.5 self-end text-[14px]">
        <input v-model="form.isActive" type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]">
        {{ $t('sa26.inUse') }}
      </label>
    </section>

    <section class="card" style="background: #fff">
      <h2 class="mb-2 font-heading text-[16px]">{{ $t('sa26.compatible') }}</h2>
      <div class="flex gap-2">
        <input
          v-model="compatibleInput" class="input flex-1" type="text"
          placeholder="Honda PCX 125" :aria-label="$t('sa26.addCompatible')"
          @keyup.enter="addCompatible"
        >
        <AyButton variant="secondary" @click="addCompatible">{{ $t('sa26.add') }}</AyButton>
      </div>
      <ul v-if="compatible.length" class="mt-2 flex flex-wrap gap-1.5">
        <li v-for="(item, index) in compatible" :key="item" class="tag bg-neutral-200 text-neutral-700">
          {{ item }}
          <button type="button" :aria-label="$t('sa26.removeItem', { name: item })" @click="compatible.splice(index, 1)">×</button>
        </li>
      </ul>
    </section>

    <section class="card" style="background: #fff">
      <AyImageUpload v-model="images" :label="$t('sa26.photos')" :max="4" />
    </section>

    <AyErrorNote :error="error" />

    <div class="admin-actions">
      <AyButton to="/admin/parts" variant="secondary">{{ $t('common.cancel') }}</AyButton>
      <AyButton :loading="saving" @click="save">{{ $t('common.save') }}</AyButton>
    </div>
  </div>
</template>
