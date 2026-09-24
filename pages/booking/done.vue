<script setup lang="ts">
import type { Booking } from '~/types/models';

/** SC-16 Dat lich — hoan tat. FR-BOOK-10, FR-BOOK-11. */
const route = useRoute();
const api = useApi();
const { i18n, dateTime } = useFormat();

const code = route.query.code as string | undefined;
const { data: booking } = await useAsyncData(
  `booking-done-${code}`,
  () => (code ? api.get<Booking>(`/bookings/${code}`) : Promise.resolve(null)),
);

useHead({ title: 'Đã nhận yêu cầu đặt lịch' });
</script>

<template>
  <div class="mx-auto flex max-w-xl flex-col gap-5">
    <div class="ay-card flex flex-col items-center gap-3 text-center">
      <span class="grid h-14 w-14 place-items-center rounded-full bg-success-bg text-[26px] text-success" aria-hidden="true">✓</span>
      <h1 class="font-heading text-[21px]">Đã nhận yêu cầu đặt lịch</h1>
      <p class="max-w-prose text-[14px] ay-muted">
        Cửa hàng sẽ xác nhận và gửi mã QR cho bạn qua SMS. Hãy lưu lại mã lịch hẹn bên dưới.
      </p>

      <div class="my-1 rounded-2xl bg-accent-100 px-6 py-4">
        <p class="text-[12.5px] ay-muted">Mã lịch hẹn</p>
        <p class="select-all font-heading text-[26px] tracking-widest text-accent-800">
          {{ booking?.code ?? code }}
        </p>
      </div>
    </div>

    <section v-if="booking" class="ay-card flex flex-col gap-2">
      <h2 class="font-heading text-[16px]">Chi tiết</h2>
      <dl class="flex flex-col gap-2 text-[14px]">
        <div class="flex gap-3"><dt class="w-28 flex-none ay-muted">Cửa hàng</dt><dd>{{ i18n(booking.store?.name ?? null) }}</dd></div>
        <div class="flex gap-3"><dt class="w-28 flex-none ay-muted">Thời gian</dt><dd class="font-semibold">{{ dateTime(booking.scheduledAt) }}</dd></div>
        <div class="flex gap-3"><dt class="w-28 flex-none ay-muted">Trạng thái</dt><dd><AyStatusTag :status="booking.status" /></dd></div>
      </dl>
    </section>

    <div class="flex flex-col gap-2 sm:flex-row">
      <AyButton :to="`/bookings/${booking?.code ?? code}`" class="sm:flex-1">Xem lịch hẹn &amp; mã QR</AyButton>
      <AyButton to="/" variant="secondary" class="sm:flex-1">Về trang chủ</AyButton>
    </div>

    <p class="text-center text-[12.5px] ay-muted">
      Chưa nhận được SMS? Bạn vẫn tra cứu được lịch hẹn bằng mã ở trên và số điện thoại đã đăng ký.
    </p>
  </div>
</template>
