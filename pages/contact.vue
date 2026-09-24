<script setup lang="ts">
import type { Store } from '~/types/models';

/** SC-08 Lien he — FR-PUB-07. */
const api = useApi();
const ui = useUiStore();
const { i18n } = useFormat();

const { data: stores } = await useAsyncData('contact-stores', () => api.get<Store[]>('/stores'));

const form = reactive({ name: '', phone: '', email: '', storeId: '', subject: '', message: '' });
const errors = reactive<Record<string, string>>({});
const submitting = ref(false);
const sent = ref(false);

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k]);
  if (!form.name.trim()) errors.name = 'Vui lòng nhập họ tên';
  if (!form.phone.trim() && !form.email.trim()) {
    errors.phone = 'Cần số điện thoại hoặc email để chúng tôi liên hệ lại';
  }
  if (!form.message.trim()) errors.message = 'Vui lòng nhập nội dung';
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
    ui.success('Đã gửi liên hệ', 'Cửa hàng sẽ phản hồi trong thời gian sớm nhất.');
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    submitting.value = false;
  }
}

useHead({ title: 'Liên hệ — AOYAMA Service' });
</script>

<template>
  <div class="flex flex-col gap-5">
    <AyPageHeader code="SC-08" title="Liên hệ" description="Gửi câu hỏi hoặc yêu cầu tư vấn — chúng tôi phản hồi trong giờ làm việc." />

    <div v-if="sent" class="card text-center">
      <p class="font-heading text-[18px]">Đã nhận được liên hệ của bạn</p>
      <p class="mt-1.5 text-[14px] text-muted">Cửa hàng sẽ liên hệ lại qua thông tin bạn để lại.</p>
      <AyButton to="/" variant="secondary" size="sm" class="mt-4">Về trang chủ</AyButton>
    </div>

    <form v-else class="card grid gap-3 sm:grid-cols-2" @submit.prevent="submit">
      <AyField label="Họ tên" required :error="errors.name">
        <template #default="{ id, invalid }">
          <input :id="id" v-model="form.name" class="input" type="text" :aria-invalid="invalid">
        </template>
      </AyField>

      <AyField label="Số điện thoại" :error="errors.phone">
        <template #default="{ id }">
          <input :id="id" v-model="form.phone" class="input" type="tel" placeholder="090-1234-5678">
        </template>
      </AyField>

      <AyField label="Email">
        <template #default="{ id }">
          <input :id="id" v-model="form.email" class="input" type="email">
        </template>
      </AyField>

      <AyField label="Cửa hàng liên quan">
        <template #default="{ id }">
          <select :id="id" v-model="form.storeId" class="input">
            <option value="">— Không cụ thể —</option>
            <option v-for="store in stores ?? []" :key="store.id" :value="store.id">{{ i18n(store.name) }}</option>
          </select>
        </template>
      </AyField>

      <AyField label="Tiêu đề" class="sm:col-span-2">
        <template #default="{ id }">
          <input :id="id" v-model="form.subject" class="input" type="text">
        </template>
      </AyField>

      <AyField label="Nội dung" required :error="errors.message" class="sm:col-span-2">
        <template #default="{ id, invalid }">
          <textarea :id="id" v-model="form.message" class="input min-h-[140px]" :aria-invalid="invalid" />
        </template>
      </AyField>

      <div class="sm:col-span-2">
        <AyButton type="submit" :loading="submitting">Gửi liên hệ</AyButton>
      </div>
    </form>
  </div>
</template>
