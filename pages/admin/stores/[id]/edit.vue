<script setup lang="ts">
import type { ApiError, I18nText, Store } from '~/types/models';

/** SA-33 Them hoac sua cua hang — FR-STO-01, FR-STO-02, FR-I18N-04. */
definePageMeta({ layout: 'admin', middleware: ['admin', 'admin-only'] });

const route = useRoute();
const { t } = useI18n();
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
  fax: '',
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
      fax: data.value.fax ?? '',
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
    ui.warning(t('sa33.needFields'));
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    const body = {
      ...form,
      fax: form.fax || undefined,
      email: form.email || undefined,
      latitude: form.latitude || undefined,
      longitude: form.longitude || undefined,
    };
    if (isNew) {
      const created = await api.post<Store>('/admin/stores', body);
      ui.success(t('sa33.added'), t('sa33.addedSub'));
      await navigateTo(`/admin/stores/${created.id}/hours`);
    } else {
      await api.put(`/admin/stores/${id}`, body);
      ui.success(t('sa33.saved'));
      await navigateTo('/admin/stores');
    }
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    saving.value = false;
  }
}

setScreenTitle(() => (isNew ? t('sa33.addTitle') : t('sa33.editTitle')));
useHead({ title: () => (isNew ? t('sa33.addTitle') : t('sa33.editTitle')) });
</script>

<template>
  <div class="admin-form">
    <AyPageHeader
      code="SA-33"
      :title="isNew ? $t('sa33.addTitle') : $t('sa33.editTitle')"
      back-to="/admin/stores"
    />

    <section class="card admin-grid" style="background: #fff">
      <AyField :label="$t('sa33.code')" required>
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.code" class="input font-mono" type="text" placeholder="AY-HAMAMATSU">
        </template>
      </AyField>

      <AyField :label="$t('sc14.phone')" required>
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.phone" class="input" type="tel">
        </template>
      </AyField>

      <div class="ay-col-full"><AyI18nInput v-model="form.name" :label="$t('sa33.nameLabel')" required /></div>
      <div class="ay-col-full"><AyI18nInput v-model="form.address" :label="$t('sa17.address')" required /></div>
      <div class="ay-col-full"><AyI18nInput v-model="form.description" :label="$t('sa33.intro')" multiline /></div>

      <!-- So fax in tren bang hieu; he thong khong quay so nay. -->
      <AyField :label="$t('sa33.fax')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.fax" class="input" type="text" placeholder="055-921-8020">
        </template>
      </AyField>

      <AyField :label="$t('sc14.email')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.email" class="input" type="email">
        </template>
      </AyField>

      <AyField :label="$t('sa33.capacity')" :hint="$t('sa33.capacityHint')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="form.defaultCapacity" class="input" type="number" min="1">
        </template>
      </AyField>

      <AyField :label="$t('sa33.lat')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.latitude" class="input" type="text" placeholder="34.7108000">
        </template>
      </AyField>

      <AyField :label="$t('sa33.lng')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.longitude" class="input" type="text" placeholder="137.7261000">
        </template>
      </AyField>

      <AyField :label="$t('sa23.sortOrder')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="form.sortOrder" class="input" type="number">
        </template>
      </AyField>

      <label class="flex items-center gap-2.5 self-end text-[14px]">
        <input v-model="form.isActive" type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]">
        {{ $t('sa33.isActive') }}
      </label>
    </section>

    <AyErrorNote :error="error" />

    <div class="admin-actions">
      <AyButton to="/admin/stores" variant="secondary">{{ $t('common.cancel') }}</AyButton>
      <AyButton :loading="saving" @click="save">{{ $t('common.save') }}</AyButton>
    </div>
  </div>
</template>
