<script setup lang="ts">
import type { ServiceItem } from '~/types/models';

/** SC-03 Chi tiet dich vu. */
const route = useRoute();
const api = useApi();
const booking = useBookingStore();
const { i18n, money } = useFormat();

const slug = route.params.slug as string;
const { data: service } = await useAsyncData(`service-${slug}`, () =>
  api.get<ServiceItem>(`/services/${slug}`),
);

if (!service.value) {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy dịch vụ' });
}

useHead({ title: `${i18n(service.value.name)} — AOYAMA Service` });

/** Bam dat lich tu day thi dich vu duoc chon san o buoc 1. */
function bookThis(): void {
  if (!service.value) return;
  booking.restore();
  if (!booking.selectedServiceIds.includes(service.value.id)) {
    booking.toggleService(service.value);
  }
  navigateTo('/booking/step1');
}
</script>

<template>
  <div v-if="service" class="flex flex-col gap-6">
    <AyPageHeader code="SC-03" :title="i18n(service.name)" back-to="/services">
      <template #actions>
        <AyButton @click="bookThis">Đặt lịch dịch vụ này</AyButton>
      </template>
    </AyPageHeader>

    <div class="grid gap-5 lg:grid-cols-3">
      <div class="flex flex-col gap-5 lg:col-span-2">
        <section class="card">
          <p class="text-[15px]">{{ i18n(service.shortDescription) }}</p>
          <p v-if="i18n(service.description)" class="mt-3 whitespace-pre-line text-[14px] text-muted">
            {{ i18n(service.description) }}
          </p>
        </section>

        <section v-if="service.checklistItems.length" class="card">
          <h2 class="mb-2 font-heading text-[16px]">Hạng mục kiểm tra</h2>
          <ul class="flex flex-col gap-1.5">
            <li v-for="(item, index) in service.checklistItems" :key="index" class="flex gap-2 text-[14px]">
              <span class="text-accent-700" aria-hidden="true">✓</span>
              {{ i18n(item) }}
            </li>
          </ul>
        </section>
      </div>

      <aside class="card flex h-fit flex-col gap-3">
        <div>
          <p class="text-[12.5px] text-muted">Giá tham khảo</p>
          <p class="font-heading text-[26px]">
            {{ service.quoteOnly ? 'Báo giá riêng' : `~ ${money(service.basePrice)}` }}
          </p>
          <p v-if="!service.quoteOnly" class="text-[12px] text-muted">
            Giá cuối cùng thay đổi theo dung tích xe và tình trạng thực tế.
          </p>
        </div>

        <dl class="flex flex-col gap-1.5 border-t border-divider pt-3 text-[13.5px]">
          <div class="flex justify-between">
            <dt class="text-muted">Thời gian ước tính</dt>
            <dd>{{ service.durationMinutes }} phút</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-muted">Phân loại</dt>
            <dd>{{ service.type === 'MAINTENANCE' ? 'Bảo dưỡng' : 'Sửa chữa' }}</dd>
          </div>
          <div v-if="service.maintenanceIntervalMonths" class="flex justify-between">
            <dt class="text-muted">Chu kỳ đề xuất</dt>
            <dd>{{ service.maintenanceIntervalMonths }} tháng</dd>
          </div>
        </dl>

        <AyButton block @click="bookThis">Đặt lịch</AyButton>
      </aside>
    </div>
  </div>
</template>
