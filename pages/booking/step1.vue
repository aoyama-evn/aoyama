<script setup lang="ts">
import type { ServiceItem, Store } from '~/types/models';

/** SC-12 Dat lich buoc 1 — chon dich vu va cua hang. FR-BOOK-02, FR-BOOK-03. */
const api = useApi();
const route = useRoute();
const booking = useBookingStore();
const { i18n, money } = useFormat();

const { data } = await useAsyncData('booking-step1', async () => {
  const [services, stores] = await Promise.all([
    api.get<ServiceItem[]>('/services'),
    api.get<Store[]>('/stores'),
  ]);
  return { services, stores };
});

onMounted(() => {
  booking.restore();
  // Vao tu the cua hang o SC-05 hoac SC-06 thi chon san cua hang do.
  const fromQuery = route.query.storeId as string | undefined;
  if (fromQuery) booking.storeId = fromQuery;
  if (!booking.storeId && data.value?.stores.length === 1) {
    booking.storeId = data.value.stores[0].id;
  }
});

watch(() => booking.storeId, () => booking.persist());

const maintenance = computed(() => (data.value?.services ?? []).filter((s) => s.type === 'MAINTENANCE'));
const repair = computed(() => (data.value?.services ?? []).filter((s) => s.type === 'REPAIR'));

useHead({ title: 'Đặt lịch — Bước 1' });
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-5">
    <AyPageHeader code="SC-12" title="Đặt lịch — Bước 1" description="Chọn dịch vụ bạn cần và cửa hàng muốn đến." />
    <BookingSteps :current="1" />

    <section>
      <h2 class="mb-2 font-heading text-[16px]">Cửa hàng</h2>
      <div class="grid gap-2 sm:grid-cols-2">
        <button
          v-for="store in data?.stores ?? []"
          :key="store.id"
          type="button"
          class="flex flex-col rounded-2xl border px-4 py-3 text-left transition-colors"
          :class="booking.storeId === store.id ? 'border-accent bg-accent-100' : 'border-neutral-300 bg-surface hover:bg-accent-100'"
          style="min-height: 48px"
          :aria-pressed="booking.storeId === store.id"
          @click="booking.storeId = store.id"
        >
          <span class="text-[14.5px] font-semibold">{{ i18n(store.name) }}</span>
          <span class="text-[12.5px] ay-muted">{{ i18n(store.address) }}</span>
        </button>
      </div>
    </section>

    <section>
      <h2 class="mb-2 font-heading text-[16px]">Bảo dưỡng</h2>
      <div class="flex flex-col gap-2">
        <AyServiceCard
          v-for="service in maintenance" :key="service.id" :service="service"
          selectable :selected="booking.selectedServiceIds.includes(service.id)"
          @toggle="booking.toggleService(service)"
        />
      </div>
    </section>

    <section>
      <h2 class="mb-2 font-heading text-[16px]">Sửa chữa</h2>
      <div class="flex flex-col gap-2">
        <AyServiceCard
          v-for="service in repair" :key="service.id" :service="service"
          selectable :selected="booking.selectedServiceIds.includes(service.id)"
          @toggle="booking.toggleService(service)"
        />
      </div>
      <p class="mt-2 text-[12.5px] ay-muted">
        Chưa rõ xe bị gì?
        <NuxtLink to="/chat" class="underline">Hỏi trợ lý AI</NuxtLink>
        để được gợi ý dịch vụ phù hợp.
      </p>
    </section>

    <!-- Tom tat lua chon, luon hien o cuoi de nguoi dung thay ngay ket qua thao tac -->
    <div class="sticky bottom-0 -mx-4 border-t border-divider bg-surface px-4 py-3 ay-safe-bottom">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex-1">
          <p class="text-[12.5px] ay-muted">
            Đã chọn {{ booking.selectedServiceIds.length }} dịch vụ
            <template v-if="booking.estimatedMinutes"> · khoảng {{ booking.estimatedMinutes }} phút</template>
          </p>
          <p class="font-heading text-[18px]">
            {{ booking.hasQuoteOnly && booking.estimatedTotal === 0 ? 'Báo giá tại cửa hàng' : `~ ${money(booking.estimatedTotal)}` }}
          </p>
        </div>
        <AyButton to="/booking/step2" :disabled="!booking.step1Complete">Tiếp tục →</AyButton>
      </div>
      <p v-if="!booking.step1Complete" class="mt-1 text-[12px] text-danger">
        Hãy chọn một cửa hàng và ít nhất một dịch vụ.
      </p>
    </div>
  </div>
</template>
