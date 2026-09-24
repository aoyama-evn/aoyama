<script setup lang="ts">
import type { Booking } from '~/types/models';

/** SC-16 Dat lich — hoan tat. FR-BOOK-10, FR-BOOK-11. */
const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { i18n, date: fmtDate, clock } = useFormat();

const code = route.query.code as string | undefined;
const { data: booking } = await useAsyncData(`booking-done-${code}`, () =>
  code ? api.get<Booking>(`/bookings/${code}`) : Promise.resolve(null),
);

async function copyCode(): Promise<void> {
  const value = booking.value?.code ?? code ?? '';
  try {
    await navigator.clipboard.writeText(value);
    ui.success('Đã sao chép mã lịch hẹn');
  } catch {
    ui.warning('Trình duyệt không cho sao chép', `Mã của bạn là ${value}`);
  }
}

useHead({ title: 'Đã nhận yêu cầu đặt lịch' });
</script>

<template>
  <div class="flex flex-col items-center gap-4 px-1 pb-4 pt-6 text-center">
    <span
      class="grid place-items-center rounded-full text-white"
      style="width: 64px; height: 64px; background: var(--color-accent-2-500)"
      aria-hidden="true"
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round">
        <path d="M4 12.5 9.5 18 20 6.5" />
      </svg>
    </span>

    <div>
      <h3>Đặt lịch thành công</h3>
      <p class="mt-1 text-[12.5px] text-muted">Booking received</p>
    </div>

    <div class="w-full px-5 py-4" style="background: var(--color-surface); border-radius: 24px">
      <div class="mb-1 text-[11px] text-muted">Mã lịch hẹn · Booking code</div>
      <div class="font-heading text-[25px]" style="letter-spacing: 0.02em">
        {{ booking?.code ?? code }}
      </div>
      <button type="button" class="btn btn-ghost mt-1 text-[12px]" @click="copyCode">
        Sao chép mã
      </button>
    </div>

    <dl v-if="booking" class="flex w-full flex-col gap-2 text-left text-[13.5px]">
      <div class="flex gap-2.5">
        <dt class="w-[78px] flex-none text-[12px] text-muted">Thời gian</dt>
        <dd>
          {{ fmtDate(booking.scheduledAt, 'yyyy/MM/dd (EEE)') }} ·
          {{ clock(booking.slotStartTime) }}–{{ clock(booking.slotEndTime) }}
        </dd>
      </div>
      <div class="flex gap-2.5">
        <dt class="w-[78px] flex-none text-[12px] text-muted">Cửa hàng</dt>
        <dd>{{ i18n(booking.store?.name ?? null) }}</dd>
      </div>
      <div class="flex gap-2.5">
        <dt class="w-[78px] flex-none text-[12px] text-muted">Dịch vụ</dt>
        <dd>{{ (booking.services ?? []).map((s) => s.serviceName).join(', ') }}</dd>
      </div>
    </dl>

    <p
      class="w-full px-3.5 py-3 text-left text-[12.5px] leading-relaxed"
      style="background: var(--color-accent-100); border-radius: 20px"
    >
      Cửa hàng sẽ xác nhận và <strong>gửi mã QR</strong> cho bạn sớm nhất có thể — hãy ghi lại mã
      lịch hẹn để tra cứu.
    </p>

    <NuxtLink :to="`/bookings/${booking?.code ?? code}`" class="btn btn-primary btn-cta">
      Xem chi tiết lịch hẹn
    </NuxtLink>
    <NuxtLink to="/" class="btn btn-secondary btn-block" style="min-height: 44px">
      Về trang chủ
    </NuxtLink>
  </div>
</template>
