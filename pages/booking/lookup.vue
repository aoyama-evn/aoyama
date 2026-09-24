<script setup lang="ts">
import type { ApiError, Booking } from '~/types/models';

/** SC-20 Tra cuu lich hen cho Guest — FR-BOOK-15. */
const api = useApi();
const route = useRoute();

const code = ref((route.query.code as string) ?? '');
const phone = ref('');
const loading = ref(false);
const error = ref<ApiError | null>(null);

async function lookup(): Promise<void> {
  error.value = null;
  loading.value = true;
  try {
    const booking = await api.post<Booking>('/bookings/lookup', {
      code: code.value.trim().toUpperCase(),
      phone: phone.value.trim(),
    });
    await navigateTo(`/bookings/${booking.code}`);
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    loading.value = false;
  }
}

useHead({ title: 'Tra cứu lịch hẹn' });
</script>

<template>
  <div class="mx-auto flex max-w-md flex-col gap-5">
    <AyPageHeader
      code="SC-20" title="Tra cứu lịch hẹn"
      description="Nhập mã lịch hẹn cùng số điện thoại đã dùng khi đặt. Không cần đăng nhập."
    />

    <form class="card flex flex-col gap-3" @submit.prevent="lookup">
      <AyField label="Mã lịch hẹn" required>
        <template #default="{ id }">
          <input
            :id="id" v-model="code" class="input font-heading tracking-widest"
            type="text" placeholder="AY-XXXXXXXX" autocomplete="off" required
          >
        </template>
      </AyField>

      <AyField label="Số điện thoại" required hint="Đúng số đã dùng khi đặt lịch">
        <template #default="{ id }">
          <input :id="id" v-model="phone" class="input" type="tel" placeholder="090-1234-5678" required>
        </template>
      </AyField>

      <AyErrorNote :error="error" />

      <AyButton type="submit" block :loading="loading">Tra cứu</AyButton>
    </form>

    <p class="text-center text-[13px] text-muted">
      Có tài khoản?
      <NuxtLink to="/login" class="underline">Đăng nhập</NuxtLink>
      để xem toàn bộ lịch hẹn và lịch sử bảo dưỡng.
    </p>
  </div>
</template>
