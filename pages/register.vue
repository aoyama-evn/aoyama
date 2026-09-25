<script setup lang="ts">
/**
 * SC-17 Dang ky khach hang — FR-AUTH-01.
 * Ban thiet ke chi hoi ho ten, so dien thoai, email va o dong y dieu khoan;
 * xac thuc bang OTP o SC-19.
 */
const api = useApi();

const form = reactive({ name: '', phone: '', email: '' });
const agreed = ref(true);
const loading = ref(false);
const errors = reactive<Record<string, string>>({});

async function submit(): Promise<void> {
  Object.keys(errors).forEach((key) => delete errors[key]);
  if (!form.name.trim()) errors.name = 'Vui lòng nhập họ tên';
  if (!form.phone.trim()) errors.phone = 'Vui lòng nhập số điện thoại';
  if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    errors.email = 'Email không hợp lệ';
  }
  if (!agreed.value) errors.agreed = 'Bạn cần đồng ý với điều khoản để tiếp tục';
  if (Object.keys(errors).length > 0) return;

  loading.value = true;
  try {
    await api.post('/auth/otp/request', { phone: form.phone.trim(), purpose: 'REGISTER' });
    const query = new URLSearchParams({
      phone: form.phone.trim(),
      purpose: 'REGISTER',
      name: form.name.trim(),
    });
    if (form.email.trim()) query.set('email', form.email.trim());
    await navigateTo(`/verify-otp?${query}`);
  } catch (caught) {
    errors.phone = normalizeError(caught).message;
  } finally {
    loading.value = false;
  }
}

useHead({ title: 'Đăng ký — AOYAMA Service' });
</script>

<template>
  <form class="flex flex-col gap-3 pb-4 pt-2" @submit.prevent="submit">
    <h3>Đăng ký</h3>

    <AyField for="name" label="Họ tên" required :error="errors.name">
      <input id="name" v-model="form.name" class="input" autocomplete="name" placeholder="Nguyễn Văn A" />
    </AyField>

    <AyField for="phone" label="Số điện thoại" required :error="errors.phone">
      <input
        id="phone"
        v-model="form.phone"
        class="input"
        type="tel"
        inputmode="tel"
        autocomplete="tel"
        placeholder="090-1234-5678"
      />
    </AyField>

    <AyField for="email" label="Email" :error="errors.email">
      <input
        id="email"
        v-model="form.email"
        class="input"
        type="email"
        autocomplete="email"
        placeholder="nguyenvana@example.com"
      />
    </AyField>

    <label class="flex cursor-pointer items-start gap-2.5 text-[12.5px]">
      <input v-model="agreed" type="checkbox" class="mt-[3px]" />
      <span>
        Tôi đồng ý với <NuxtLink to="/terms">điều khoản sử dụng</NuxtLink> và
        <NuxtLink to="/privacy">chính sách dữ liệu</NuxtLink>.
      </span>
    </label>
    <p v-if="errors.agreed" class="field-error">{{ errors.agreed }}</p>

    <button
      type="submit"
      class="btn btn-primary btn-block"
      style="min-height: 48px; font-size: 15px; margin: 0"
      :disabled="loading"
    >
      {{ loading ? 'Đang gửi…' : 'Đăng ký & nhận mã OTP' }}
    </button>

    <NuxtLink to="/login" class="btn btn-ghost self-center text-[13px]">
      Đã có tài khoản? Đăng nhập
    </NuxtLink>
  </form>
</template>
