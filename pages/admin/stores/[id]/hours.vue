<script setup lang="ts">
import type { Store, StoreHoliday } from '~/types/models';

/** SA-34 Gio lam viec va ngay nghi — FR-STO-03, FR-STO-04. */
definePageMeta({ layout: 'admin', middleware: ['admin', 'admin-only'] });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { i18n } = useFormat();

const id = route.params.id as string;
const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

const { data: store, refresh } = await useAsyncData(`store-hours-${id}`, () =>
  api.get<Store>(`/admin/stores/${id}`),
);
if (!store.value) throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy cửa hàng' });

/** Luon dung du 7 dong, ke ca khi CSDL chua co ban ghi cho thu do. */
const hours = ref(
  WEEKDAYS.map((_, weekday) => {
    const existing = store.value?.businessHours?.find((h) => h.weekday === weekday);
    return {
      weekday,
      openTime: existing?.openTime?.slice(0, 5) ?? '09:00',
      closeTime: existing?.closeTime?.slice(0, 5) ?? '18:00',
      isClosed: existing?.isClosed ?? false,
    };
  }),
);

const savingHours = ref(false);

async function saveHours(): Promise<void> {
  savingHours.value = true;
  try {
    await api.put(`/admin/stores/${id}/business-hours`, {
      hours: hours.value.map((h) => ({
        weekday: h.weekday,
        openTime: h.isClosed ? undefined : h.openTime,
        closeTime: h.isClosed ? undefined : h.closeTime,
        isClosed: h.isClosed,
      })),
    });
    ui.success('Đã lưu giờ làm việc');
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    savingHours.value = false;
  }
}

// ---- Ngay nghi ----
const holidayDate = ref('');
const holidayReason = ref('');

const { data: holidays, refresh: refreshHolidays } = await useAsyncData(`store-holidays-${id}`, () =>
  api.get<StoreHoliday[]>(`/admin/stores/${id}/holidays`, {
    from: new Date().toISOString().slice(0, 10),
  }),
);

async function addHoliday(): Promise<void> {
  if (!holidayDate.value) return;
  try {
    await api.post(`/admin/stores/${id}/holidays`, {
      date: holidayDate.value,
      reason: holidayReason.value || undefined,
    });
    ui.success('Đã thêm ngày nghỉ', 'Khách không đặt được lịch vào ngày này.');
    holidayDate.value = '';
    holidayReason.value = '';
    await refreshHolidays();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

async function removeHoliday(holidayId: string): Promise<void> {
  try {
    await api.del(`/admin/stores/${id}/holidays/${holidayId}`);
    await refreshHolidays();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

useHead({ title: 'Giờ làm việc — AOYAMA Admin' });
</script>

<template>
  <div v-if="store" class="mx-auto flex max-w-3xl flex-col gap-4">
    <AyPageHeader
      code="SA-34" title="Giờ làm việc &amp; ngày nghỉ" back-to="/admin/stores"
      :description="i18n(store.name)"
    >
      <template #actions>
        <AyButton :to="`/admin/stores/${id}/slots`" variant="secondary" size="sm">Khung giờ</AyButton>
      </template>
    </AyPageHeader>

    <section class="ay-card">
      <h2 class="mb-3 font-heading text-[16px]">Giờ làm việc theo thứ</h2>

      <ul class="flex flex-col gap-2">
        <li v-for="hour in hours" :key="hour.weekday" class="flex flex-wrap items-center gap-3">
          <span class="w-24 text-[14px]">{{ WEEKDAYS[hour.weekday] }}</span>

          <label class="flex items-center gap-2 text-[13px]">
            <input v-model="hour.isClosed" type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]">
            Nghỉ
          </label>

          <template v-if="!hour.isClosed">
            <input
              v-model="hour.openTime" class="ay-input h-10 min-h-0 w-auto py-1" type="time"
              :aria-label="`Giờ mở cửa ${WEEKDAYS[hour.weekday]}`"
            >
            <span class="ay-muted">–</span>
            <input
              v-model="hour.closeTime" class="ay-input h-10 min-h-0 w-auto py-1" type="time"
              :aria-label="`Giờ đóng cửa ${WEEKDAYS[hour.weekday]}`"
            >
          </template>
        </li>
      </ul>

      <AyButton class="mt-3" :loading="savingHours" @click="saveHours">Lưu giờ làm việc</AyButton>
    </section>

    <section class="ay-card">
      <h2 class="mb-3 font-heading text-[16px]">Ngày nghỉ</h2>

      <div class="flex flex-wrap items-end gap-2">
        <AyField label="Ngày">
          <template #default="{ id: fid }">
            <input :id="fid" v-model="holidayDate" class="ay-input" type="date">
          </template>
        </AyField>
        <AyField label="Lý do" class="min-w-[200px] flex-1">
          <template #default="{ id: fid }">
            <input :id="fid" v-model="holidayReason" class="ay-input" type="text" placeholder="Nghỉ lễ, kiểm kê…">
          </template>
        </AyField>
        <AyButton :disabled="!holidayDate" @click="addHoliday">Thêm</AyButton>
      </div>

      <AyEmptyState
        v-if="(holidays ?? []).length === 0"
        title="Chưa có ngày nghỉ nào sắp tới"
        hint="Thêm ngày nghỉ để hệ thống tự chặn khách đặt lịch vào ngày đó."
      />

      <ul v-else class="mt-3 flex flex-col gap-1.5">
        <li
          v-for="holiday in holidays ?? []" :key="holiday.id"
          class="flex items-center gap-3 border-b border-divider pb-1.5 text-[13.5px] last:border-0"
        >
          <span class="font-heading">{{ holiday.date }}</span>
          <span class="flex-1 ay-muted">{{ holiday.reason ?? '—' }}</span>
          <button type="button" class="text-[12.5px] text-danger underline" @click="removeHoliday(holiday.id)">
            Xóa
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
