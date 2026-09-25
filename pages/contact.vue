<script setup lang="ts">
import type { Store } from '~/types/models';

/** SC-08 Lien he — FR-PUB-07. */
const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { i18n } = useFormat();

const { data: stores } = await useAsyncData('contact-stores', () => api.get<Store[]>('/stores'));

const form = reactive({ name: '', phone: '', email: '', storeId: '', subject: '', message: '' });
const errors = reactive<Record<string, string>>({});
const submitting = ref(false);
const sent = ref(false);

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k]);
  if (!form.name.trim()) errors.name = t('validate.name');
  if (!form.phone.trim() && !form.email.trim()) {
    errors.phone = t('sc08.needReach');
  }
  if (!form.message.trim()) errors.message = t('sc08.needMessage');
  return Object.keys(errors).length === 0;
}

async function submit(): Promise<void> {
  if (!validate()) return;
  submitting.value = true;
  try {
    await api.post('/contact', {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      storeId: form.storeId || undefined,
      subject: form.subject.trim() || undefined,
      message: form.message.trim(),
    });
    sent.value = true;
    ui.success(t('sc08.sentToast'), t('sc08.sentToastSub'));
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    submitting.value = false;
  }
}

useHead({ title: () => `${t('sc08.title')} — AOYAMA Service` });
</script>

<template>
  <div class="flex flex-col gap-5">
    <AyPageHeader
      code="SC-08"
      :title="$t('sc08.title')"
      :description="$t('sc08.lead')"
    />

    <div v-if="sent" class="card text-center">
      <p class="font-heading text-[18px]">{{ $t('sc08.sentTitle') }}</p>
      <p class="mt-1.5 text-[14px] text-muted">{{ $t('sc08.sentLead') }}</p>
      <AyButton to="/" variant="secondary" size="sm" class="mt-4">{{ $t('common.backHome') }}</AyButton>
    </div>

    <form v-else class="card grid gap-3 sm:grid-cols-2" @submit.prevent="submit">
      <AyField :label="$t('sc14.fullName')" required :error="errors.name">
        <template #default="{ id, invalid }">
          <input :id="id" v-model="form.name" class="input" type="text" :aria-invalid="invalid">
        </template>
      </AyField>

      <AyField :label="$t('sc14.phone')" :error="errors.phone">
        <template #default="{ id }">
          <input :id="id" v-model="form.phone" class="input" type="tel" placeholder="090-1234-5678">
        </template>
      </AyField>

      <AyField :label="$t('sc14.email')">
        <template #default="{ id }">
          <input :id="id" v-model="form.email" class="input" type="email">
        </template>
      </AyField>

      <AyField :label="$t('sc08.storeLabel')">
        <template #default="{ id }">
          <select :id="id" v-model="form.storeId" class="input">
            <option value="">{{ $t('sc08.storeAny') }}</option>
            <option v-for="store in stores ?? []" :key="store.id" :value="store.id">{{ i18n(store.name) }}</option>
          </select>
        </template>
      </AyField>

      <AyField :label="$t('sc08.subject')" class="sm:col-span-2">
        <template #default="{ id }">
          <input :id="id" v-model="form.subject" class="input" type="text">
        </template>
      </AyField>

      <AyField :label="$t('sc08.message')" required :error="errors.message" class="sm:col-span-2">
        <template #default="{ id, invalid }">
          <textarea :id="id" v-model="form.message" class="input min-h-[140px]" :aria-invalid="invalid" />
        </template>
      </AyField>

      <div class="sm:col-span-2">
        <AyButton type="submit" :loading="submitting">{{ $t('sc08.submit') }}</AyButton>
      </div>
    </form>
  </div>
</template>
