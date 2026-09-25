<script setup lang="ts">
import type { Vehicle } from '~/types/models';

/**
 * SC-29 Xe cua toi — FR-VEH-01, FR-VEH-07.
 * Ban thiet ke: moi xe mot the mat the, than the bam vao xem lich su, chan the
 * co nut tron sua xe va nut dat lich cho chinh xe do.
 */
definePageMeta({ middleware: 'auth' });

const api = useApi();
const booking = useBookingStore();
const { number, date } = useFormat();

const { data: vehicles } = await useAsyncData('my-vehicles', () =>
  api.get<Vehicle[]>('/account/vehicles'),
);

/** Dong phu thu nhat: bien so, ten goi nho va so km. */
function subtitle(vehicle: Vehicle): string {
  const parts = [vehicle.plateNumber];
  if (vehicle.nickname) parts.push(`“${vehicle.nickname}”`);
  if (vehicle.currentOdometer !== null) parts.push(`${number(vehicle.currentOdometer)} km`);
  return parts.join(' · ');
}

/** SC-29 — bam nut dat lich thi mang san xe do sang buoc 1. */
async function bookFor(vehicle: Vehicle): Promise<void> {
  booking.restore();
  booking.setVehicle(vehicle);
  await navigateTo('/booking/step1');
}

useHead({ title: 'Xe của tôi' });
</script>

<template>
  <div class="flex flex-col gap-3 pb-4 pt-1">
    <div class="flex items-baseline justify-between gap-2.5">
      <h4>Xe của tôi</h4>
      <NuxtLink to="/account/vehicles/new/edit" class="btn btn-ghost p-0 text-[12.5px]">
        + Thêm xe
      </NuxtLink>
    </div>

    <AyEmptyState
      v-if="(vehicles ?? []).length === 0"
      title="Bạn chưa đăng ký xe nào"
      hint="Thêm xe để hệ thống lưu lịch sử bảo dưỡng và nhắc bạn đến kỳ kiểm tra."
    >
      <NuxtLink to="/account/vehicles/new/edit" class="btn btn-primary text-[12.5px]">
        Thêm xe đầu tiên
      </NuxtLink>
    </AyEmptyState>

    <div
      v-for="vehicle in vehicles ?? []"
      :key="vehicle.id"
      style="background: var(--color-surface); border-radius: 24px; overflow: hidden"
    >
      <NuxtLink
        :to="`/account/vehicles/${vehicle.id}/history`"
        class="flex w-full flex-col gap-1.5 p-3.5 text-left"
      >
        <span class="flex items-center justify-between gap-2.5">
          <span class="text-[14.5px] font-semibold">{{ vehicle.maker }} {{ vehicle.model }}</span>
          <span
            v-if="vehicle.modelYear"
            class="text-[11px] font-bold"
            style="color: var(--color-accent-700)"
          >
            đời {{ vehicle.modelYear }}
          </span>
        </span>
        <span class="text-muted text-[11.5px]">{{ subtitle(vehicle) }}</span>
        <span v-if="vehicle.lastServicedAt" class="text-muted text-[11.5px]">
          Gần nhất {{ date(vehicle.lastServicedAt) }}
          <template v-if="vehicle.nextServiceDueDate">
            · đề xuất tiếp theo {{ date(vehicle.nextServiceDueDate, 'yyyy/MM') }}
          </template>
          <template v-if="vehicle.nextServiceDueOdometer">
            hoặc {{ number(vehicle.nextServiceDueOdometer) }} km
          </template>
        </span>
      </NuxtLink>

      <div
        class="flex items-center justify-end gap-2 px-3.5 pb-3 pt-2.5"
        style="border-top: 1px solid var(--color-divider)"
      >
        <NuxtLink
          :to="`/account/vehicles/${vehicle.id}/edit`"
          class="ay-round-btn"
          :aria-label="`Sửa xe ${vehicle.maker} ${vehicle.model}`"
          :title="`Sửa xe ${vehicle.maker} ${vehicle.model}`"
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
          >
            <path d="M18 3 21 6l-9.5 9.5H8v-3.5L18 3Z" />
            <path d="M4 20h16" />
          </svg>
        </NuxtLink>
        <button
          type="button"
          class="btn btn-primary"
          style="min-height: 38px; min-width: 38px; padding: 8px"
          aria-label="Đặt lịch cho xe này"
          title="Đặt lịch cho xe này"
          @click="bookFor(vehicle)"
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
          >
            <rect x="3.5" y="5" width="17" height="16" rx="3" />
            <path d="M8 3v4M16 3v4M3.5 10h17M12 14v4M10 16h4" />
          </svg>
        </button>
      </div>
    </div>

    <NuxtLink to="/" class="btn btn-ghost self-center text-[13px]">Trở về trang chủ</NuxtLink>
  </div>
</template>

<style scoped>
.ay-round-btn {
  display: inline-grid;
  min-width: 38px;
  min-height: 38px;
  place-items: center;
  border-radius: 999px;
  background: var(--color-neutral-200);
  color: var(--color-neutral-800);
  padding: 8px;
}
.ay-round-btn:hover {
  background: var(--color-neutral-300);
  text-decoration: none;
}
</style>
