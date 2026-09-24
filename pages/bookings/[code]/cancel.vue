<script setup lang="ts">
import type { ApiError, Booking } from '~/types/models';

/** SC-24 Huy lich hen — FR-BOOK-13, BR-04, BR-06. */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { dateTime } = useFormat();

const code = route.params.code as string;
const { data: booking } = await useAsyncData(`cancel-${code}`, () =>
  api.get<Booking>(`/bookings/${code}`),
);

const reason = ref('');
const submitting = ref(false);
const error = ref<ApiError | null>(null);
const confirmOpen = ref(false);

const REASONS = [
  'Bận việc đột xuất',
  'Đã sửa ở nơi khác',
  'Muốn đổi sang ngày khác',
  'Lý do khác',
];

async function cancel(): Promise<void> {
  if (!booking.value) return;
  submitting.value = true;
  error.value = null;
  try {
    await api.put(`/bookings/${booking.value.id}/cancel`, { reason: reason.value || undefined });
    ui.success('Đã hủy lịch hẹn');
    await navigateTo('/account/bookings');
  } catch (err) {
    error.value = normalizeError(err);
    confirmOpen.value = false;
  } finally {
    submitting.value = false;
  }
}

useHead({ title: `Hủy lịch hẹn ${code}` });
</script>

<template>
  <div v-if="booking" class="mx-auto flex max-w-md flex-col gap-5">
    <AyPageHeader code="SC-24" title="Hủy lịch hẹn" :back-to="`/bookings/${code}`" />

    <section class="ay-card flex flex-col gap-2">
      <p class="text-[14px]">
        Bạn đang hủy lịch hẹn <strong>{{ booking.code }}</strong>
        vào <strong>{{ dateTime(booking.scheduledAt) }}</strong>.
      </p>
      <p class="text-[12.5px] ay-muted">
        Chỉ hủy trực tuyến được đến trước giờ hẹn 2 tiếng. Sau mốc đó vui lòng gọi cửa hàng.
      </p>
    </section>

    <section class="ay-card flex flex-col gap-3">
      <AyField label="Lý do hủy" hint="Giúp cửa hàng cải thiện dịch vụ">
        <template #default="{ id }">
          <select :id="id" v-model="reason" class="ay-input">
            <option value="">— Không nêu lý do —</option>
            <option v-for="item in REASONS" :key="item" :value="item">{{ item }}</option>
          </select>
        </template>
      </AyField>

      <AyErrorNote :error="error" />

      <div class="flex gap-2">
        <AyButton :to="`/bookings/${code}`" variant="secondary" class="flex-1">Giữ lịch hẹn</AyButton>
        <AyButton variant="danger" class="flex-1" @click="confirmOpen = true">Hủy lịch hẹn</AyButton>
      </div>
    </section>

    <AyConfirmDialog
      :open="confirmOpen"
      title="Xác nhận hủy lịch hẹn"
      message="Lịch hẹn sẽ bị hủy và không khôi phục được. Bạn cần đặt lại nếu đổi ý."
      confirm-label="Hủy lịch hẹn"
      cancel-label="Quay lại"
      danger
      :loading="submitting"
      @confirm="cancel"
      @cancel="confirmOpen = false"
    />
  </div>
</template>
