<script setup lang="ts">
import type { Booking } from '~/types/models';

/** SC-22 Chi tiet lich hen va ma QR — FR-QR-02, FR-QR-03. */
const route = useRoute();
const api = useApi();
const { i18n, money, dateTime, clock } = useFormat();

const code = route.params.code as string;

const { data: booking } = await useAsyncData(`booking-${code}`, () =>
  api.get<Booking>(`/bookings/${code}`),
);

if (!booking.value) throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy lịch hẹn' });

const { data: qr } = await useAsyncData(`booking-qr-${code}`, () =>
  api.get<{ available: boolean; token?: string; dataUrl?: string; message?: string }>(
    `/bookings/${code}/qr`,
  ),
);

const canModify = computed(() =>
  booking.value ? ['PENDING', 'CONFIRMED'].includes(booking.value.status) : false,
);
const canTrack = computed(() =>
  booking.value ? ['RECEIVED', 'DONE'].includes(booking.value.status) : false,
);

useHead({ title: `Lịch hẹn ${code}` });
</script>

<template>
  <div v-if="booking" class="mx-auto flex max-w-3xl flex-col gap-5">
    <AyPageHeader code="SC-22" :title="`Lịch hẹn ${booking.code}`">
      <template #actions>
        <AyStatusTag :status="booking.status" />
      </template>
    </AyPageHeader>

    <div class="grid gap-4 lg:grid-cols-5">
      <div class="lg:col-span-3 flex flex-col gap-4">
        <section class="ay-card flex flex-col gap-2">
          <h2 class="font-heading text-[16px]">Thông tin lịch hẹn</h2>
          <dl class="flex flex-col gap-2 text-[14px]">
            <div class="flex gap-3">
              <dt class="w-28 flex-none ay-muted">Thời gian</dt>
              <dd class="font-semibold">
                {{ dateTime(booking.scheduledAt) }}
                ({{ clock(booking.slotStartTime) }}–{{ clock(booking.slotEndTime) }})
              </dd>
            </div>
            <div class="flex gap-3">
              <dt class="w-28 flex-none ay-muted">Cửa hàng</dt>
              <dd>
                {{ i18n(booking.store?.name ?? null) }}
                <NuxtLink v-if="booking.store" :to="`/stores/${booking.storeId}`" class="ml-1 text-[12.5px] underline">
                  xem
                </NuxtLink>
              </dd>
            </div>
            <div class="flex gap-3">
              <dt class="w-28 flex-none ay-muted">Người đặt</dt>
              <dd>{{ booking.contactName }} · {{ booking.contactPhone }}</dd>
            </div>
            <div v-if="booking.vehicle" class="flex gap-3">
              <dt class="w-28 flex-none ay-muted">Xe</dt>
              <dd>{{ booking.vehicle.plateNumber }} · {{ booking.vehicle.maker }} {{ booking.vehicle.model }}</dd>
            </div>
            <div v-if="booking.symptomDescription" class="flex gap-3">
              <dt class="w-28 flex-none ay-muted">Mô tả</dt>
              <dd class="whitespace-pre-line">{{ booking.symptomDescription }}</dd>
            </div>
          </dl>
        </section>

        <section class="ay-card flex flex-col gap-2">
          <h2 class="font-heading text-[16px]">Dịch vụ</h2>
          <ul class="flex flex-col gap-1.5 text-[14px]">
            <li v-for="line in booking.services ?? []" :key="line.id" class="flex justify-between gap-3">
              <span>{{ line.serviceName }}</span>
              <span class="whitespace-nowrap">{{ line.estimatedPrice ? money(line.estimatedPrice) : 'báo giá riêng' }}</span>
            </li>
          </ul>
        </section>

        <div class="flex flex-wrap gap-2">
          <AyButton v-if="canTrack" :to="`/bookings/${booking.code}/progress`" variant="secondary">
            Theo dõi tiến độ
          </AyButton>
          <AyButton v-if="canModify" :to="`/bookings/${booking.code}/reschedule`" variant="secondary">
            Đổi lịch
          </AyButton>
          <AyButton v-if="canModify" :to="`/bookings/${booking.code}/cancel`" variant="ghost">
            Hủy lịch hẹn
          </AyButton>
          <AyButton v-if="booking.status === 'DONE'" :to="`/bookings/${booking.code}/rebook`" variant="secondary">
            Đặt lại lịch bảo dưỡng
          </AyButton>
        </div>
      </div>

      <div class="lg:col-span-2">
        <AyQrDisplay
          :data-url="qr?.dataUrl ?? null"
          :code="booking.code"
          :available="Boolean(qr?.available)"
          :message="qr?.message"
        />
      </div>
    </div>
  </div>
</template>
