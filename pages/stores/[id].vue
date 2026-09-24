<script setup lang="ts">
import type { Store } from '~/types/models';

/** SC-06 Chi tiet cua hang — FR-STO-02. */
const route = useRoute();
const api = useApi();
const { i18n, clock } = useFormat();

const id = route.params.id as string;
const { data: store } = await useAsyncData(`store-${id}`, () => api.get<Store>(`/stores/${id}`));

if (!store.value) throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy cửa hàng' });

useHead({ title: `${i18n(store.value.name)} — AOYAMA Service` });

const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

const hours = computed(() =>
  [...(store.value?.businessHours ?? [])].sort((a, b) => a.weekday - b.weekday),
);

const upcomingHolidays = computed(() => {
  const today = new Date().toISOString().slice(0, 10);
  return (store.value?.holidays ?? []).filter((h) => h.date >= today).slice(0, 5);
});
</script>

<template>
  <div v-if="store" class="flex flex-col gap-5">
    <AyPageHeader code="SC-06" :title="i18n(store.name)" back-to="/stores">
      <template #actions>
        <AyButton :to="`/booking/step1?storeId=${store.id}`">Đặt lịch tại đây</AyButton>
      </template>
    </AyPageHeader>

    <div class="grid gap-4 lg:grid-cols-3">
      <section class="ay-card lg:col-span-2">
        <h2 class="mb-2 font-heading text-[16px]">Thông tin cửa hàng</h2>
        <dl class="flex flex-col gap-2 text-[14px]">
          <div class="flex gap-3"><dt class="w-28 flex-none ay-muted">Địa chỉ</dt><dd>{{ i18n(store.address) }}</dd></div>
          <div class="flex gap-3"><dt class="w-28 flex-none ay-muted">Điện thoại</dt><dd><a :href="`tel:${store.phone}`" class="hover:underline">{{ store.phone }}</a></dd></div>
          <div v-if="store.email" class="flex gap-3"><dt class="w-28 flex-none ay-muted">Email</dt><dd>{{ store.email }}</dd></div>
          <div class="flex gap-3"><dt class="w-28 flex-none ay-muted">Sức tiếp nhận</dt><dd>{{ store.defaultCapacity }} xe / khung giờ</dd></div>
        </dl>
        <p v-if="i18n(store.description)" class="mt-3 text-[13.5px] ay-muted">{{ i18n(store.description) }}</p>
      </section>

      <section class="ay-card">
        <h2 class="mb-2 font-heading text-[16px]">Giờ làm việc</h2>
        <dl class="flex flex-col gap-1 text-[13.5px]">
          <div v-for="hour in hours" :key="hour.id" class="flex justify-between">
            <dt :class="hour.isClosed ? 'ay-muted' : ''">{{ WEEKDAYS[hour.weekday] }}</dt>
            <dd :class="hour.isClosed ? 'text-danger' : ''">
              {{ hour.isClosed ? 'Nghỉ' : `${clock(hour.openTime)}–${clock(hour.closeTime)}` }}
            </dd>
          </div>
        </dl>

        <template v-if="upcomingHolidays.length">
          <h3 class="mb-1 mt-4 text-[13px] font-semibold">Ngày nghỉ sắp tới</h3>
          <ul class="flex flex-col gap-0.5 text-[13px] ay-muted">
            <li v-for="holiday in upcomingHolidays" :key="holiday.id">
              {{ holiday.date }}<template v-if="holiday.reason"> · {{ holiday.reason }}</template>
            </li>
          </ul>
        </template>
      </section>
    </div>
  </div>
</template>
