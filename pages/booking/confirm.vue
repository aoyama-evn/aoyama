<script setup lang="ts">
import type { ApiError, Booking, Store } from '~/types/models';

/** SC-15 Dat lich — xac nhan. FR-BOOK-09. */
const api = useApi();
const booking = useBookingStore();
const ui = useUiStore();
const { i18n, money, date: fmtDate } = useFormat();

const store = ref<Store | null>(null);
const submitting = ref(false);
const error = ref<ApiError | null>(null);
const agreed = ref(false);

onMounted(async () => {
  booking.restore();
  if (!booking.step3Complete) {
    await navigateTo('/booking/step3');
    return;
  }
  if (booking.storeId) {
    store.value = await api.get<Store>(`/stores/${booking.storeId}`);
  }
});

async function submit(): Promise<void> {
  submitting.value = true;
  error.value = null;
  try {
    const created = await api.post<Booking>('/bookings', booking.toPayload());
    // Xoa ban nhap ngay sau khi tao thanh cong, tranh dat trung khi bam lai.
    const code = created.code;
    booking.reset();
    await navigateTo(`/booking/done?code=${encodeURIComponent(code)}`);
  } catch (err) {
    error.value = normalizeError(err);
    // Khung gio vua bi nguoi khac dat mat thi phai quay lai buoc chon gio.
    if (error.value.code === 'SLOT_FULL' || error.value.code === 'SLOT_IN_PAST') {
      ui.warning('Khung giờ vừa hết chỗ', 'Vui lòng chọn khung giờ khác.');
      await navigateTo('/booking/step2');
    }
  } finally {
    submitting.value = false;
  }
}

const serviceTypeLabel = computed(() => {
  if (booking.serviceType === 'BOTH') return 'Bảo dưỡng và sửa chữa';
  return booking.serviceType === 'REPAIR' ? 'Sửa chữa' : 'Bảo dưỡng';
});

useHead({ title: 'Đặt lịch — Xác nhận' });
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-5">
    <AyPageHeader
      code="SC-15" title="Xác nhận đặt lịch" back-to="/booking/step3"
      description="Kiểm tra lại thông tin trước khi gửi. Cửa hàng sẽ xác nhận và gửi mã QR qua SMS."
    />
    <BookingSteps :current="4" />

    <section class="ay-card flex flex-col gap-3">
      <h2 class="font-heading text-[16px]">Lịch hẹn</h2>
      <dl class="flex flex-col gap-2 text-[14px]">
        <div class="flex gap-3">
          <dt class="w-32 flex-none ay-muted">Cửa hàng</dt>
          <dd>{{ store ? i18n(store.name) : '—' }}</dd>
        </div>
        <div class="flex gap-3">
          <dt class="w-32 flex-none ay-muted">Thời gian</dt>
          <dd class="font-semibold">
            {{ booking.slot ? `${fmtDate(booking.slot.date, 'yyyy/MM/dd (EEE)')} · ${booking.slot.startTime}` : '—' }}
          </dd>
        </div>
        <div class="flex gap-3">
          <dt class="w-32 flex-none ay-muted">Loại dịch vụ</dt>
          <dd>{{ serviceTypeLabel }}</dd>
        </div>
      </dl>
    </section>

    <section class="ay-card flex flex-col gap-2">
      <h2 class="font-heading text-[16px]">Dịch vụ đã chọn</h2>
      <ul class="flex flex-col gap-1.5">
        <li
          v-for="service in booking.selectedServices" :key="service.id"
          class="flex justify-between gap-3 text-[14px]"
        >
          <span>{{ i18n(service.name) }}</span>
          <span class="whitespace-nowrap">
            {{ service.quoteOnly ? 'báo giá riêng' : money(service.basePrice) }}
          </span>
        </li>
      </ul>
      <div class="mt-1 flex justify-between border-t border-divider pt-2 font-heading text-[16px]">
        <span>Tạm tính</span>
        <span>{{ money(booking.estimatedTotal) }}</span>
      </div>
      <p class="text-[12px] ay-muted">
        Đây là giá tham khảo. Hạng mục phát sinh sẽ được báo giá và chờ bạn đồng ý trước khi làm.
      </p>
    </section>

    <section class="ay-card flex flex-col gap-3">
      <h2 class="font-heading text-[16px]">Thông tin của bạn</h2>
      <dl class="flex flex-col gap-2 text-[14px]">
        <div class="flex gap-3"><dt class="w-32 flex-none ay-muted">Họ tên</dt><dd>{{ booking.contactName }}</dd></div>
        <div class="flex gap-3"><dt class="w-32 flex-none ay-muted">Điện thoại</dt><dd>{{ booking.contactPhone }}</dd></div>
        <div v-if="booking.contactEmail" class="flex gap-3"><dt class="w-32 flex-none ay-muted">Email</dt><dd>{{ booking.contactEmail }}</dd></div>
        <div v-if="booking.vehicle.plateNumber" class="flex gap-3">
          <dt class="w-32 flex-none ay-muted">Xe</dt>
          <dd>{{ booking.vehicle.plateNumber }} · {{ booking.vehicle.maker }} {{ booking.vehicle.model }}</dd>
        </div>
        <div v-if="booking.symptomDescription" class="flex gap-3">
          <dt class="w-32 flex-none ay-muted">Mô tả</dt>
          <dd class="whitespace-pre-line">{{ booking.symptomDescription }}</dd>
        </div>
      </dl>
    </section>

    <AyErrorNote :error="error" />

    <label class="flex items-start gap-2.5 text-[13.5px]">
      <input v-model="agreed" type="checkbox" class="mt-1 h-4 w-4 accent-[var(--color-accent)]">
      <span>
        Tôi đồng ý với
        <NuxtLink to="/terms" class="underline" target="_blank">Điều khoản sử dụng</NuxtLink>
        và
        <NuxtLink to="/privacy" class="underline" target="_blank">Chính sách dữ liệu</NuxtLink>.
      </span>
    </label>

    <div class="sticky bottom-0 -mx-4 border-t border-divider bg-surface px-4 py-3 ay-safe-bottom">
      <AyButton block :disabled="!agreed" :loading="submitting" @click="submit">
        Gửi yêu cầu đặt lịch
      </AyButton>
    </div>
  </div>
</template>
