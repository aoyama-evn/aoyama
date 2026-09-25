<script setup lang="ts">
import type { ApiError, CustomerProfile } from '~/types/models';

/** SA-17 Them hoac sua khach hang — FR-CUS-04, FR-CUS-08. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const { t } = useI18n();
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
      ui.success(t('sa17.created'));
      await navigateTo(`/admin/customers/${created.id}`);
    } else {
      await api.put(`/admin/customers/${id}`, body);
      ui.success(t('sa17.saved'));
      await navigateTo(`/admin/customers/${id}`);
    }
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    saving.value = false;
  }
}

setScreenTitle(() => (isNew ? t('sa17.addTitle') : t('sa17.headEdit')));
useHead({ title: () => (isNew ? t('sa17.addTitle') : t('sa17.headEdit')) });
</script>

<template>
  <div class="admin-form">
    <AyPageHeader
      code="SA-17" :title="isNew ? $t('sa17.addTitle') : $t('sa17.editTitle')"
      :back-to="isNew ? '/admin/customers' : `/admin/customers/${id}`"
    />

    <form class="card admin-grid" style="background: #fff" @submit.prevent="save">
      <AyField :label="$t('sc14.phone')" required :hint="$t('sa17.phoneHint')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.phone" class="input" type="tel" required>
        </template>
      </AyField>

      <AyField :label="$t('sc14.fullName')" required>
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.name" class="input" type="text" required>
        </template>
      </AyField>

      <AyField :label="$t('sa17.kana')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.nameKana" class="input" type="text">
        </template>
      </AyField>

      <AyField :label="$t('sc14.email')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.email" class="input" type="email">
        </template>
      </AyField>

      <AyField :label="$t('sa17.address')" class="ay-col-full">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.address" class="input" type="text">
        </template>
      </AyField>

      <AyField :label="$t('sa17.contactLang')">
        <template #default="{ id: fid }">
          <select :id="fid" v-model="form.language" class="input">
            <option value="ja">日本語</option>
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </template>
      </AyField>

      <AyField :label="$t('sa05.internalNote')" class="ay-col-full">
        <template #default="{ id: fid }">
          <textarea :id="fid" v-model="form.internalNote" class="input min-h-[90px]" />
        </template>
      </AyField>

      <div class="ay-col-full"><AyErrorNote :error="error" /></div>

      <div class="admin-actions ay-col-full">
        <AyButton :to="isNew ? '/admin/customers' : `/admin/customers/${id}`" variant="secondary">
          {{ $t('common.cancel') }}
        </AyButton>
        <AyButton type="submit" :loading="saving">{{ $t('sa17.save') }}</AyButton>
      </div>
    </form>
  </div>
</template>
