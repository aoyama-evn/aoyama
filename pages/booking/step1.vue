<script setup lang="ts">
import type { ServiceItem, Store } from '~/types/models';

/** SC-12 Dat lich buoc 1 — FR-BOOK-02, FR-BOOK-03. Bo cuc theo ban thiet ke. */
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

/** Bo loc hai nut o dau man: Bao duong / Sua chua. Bo chon ca hai = xem tat ca. */
const kinds = ref<Set<'MAINTENANCE' | 'REPAIR'>>(new Set());

onMounted(() => {
  booking.restore();
  const fromQuery = route.query.storeId as string | undefined;
  if (fromQuery) booking.storeId = fromQuery;
  if (!booking.storeId && data.value?.stores.length === 1) {
    booking.storeId = data.value.stores[0].id;
  }
  // Dan tu chan doan AI sang thi mo san nhom sua chua.
  if (booking.aiDiagnosisId) kinds.value.add('REPAIR');
});

watch(() => booking.storeId, () => booking.persist());

function toggleKind(kind: 'MAINTENANCE' | 'REPAIR'): void {
  const next = new Set(kinds.value);
  if (next.has(kind)) next.delete(kind);
  else next.add(kind);
  kinds.value = next;
}

const visibleServices = computed(() => {
  const all = data.value?.services ?? [];
  if (kinds.value.size === 0) return all;
  return all.filter((s) => kinds.value.has(s.type as 'MAINTENANCE' | 'REPAIR'));
});

function subtitle(service: ServiceItem): string {
  const en = service.name.en ?? '';
  const duration = service.quoteOnly ? 'báo giá riêng' : `${service.durationMinutes} phút`;
  return [en, duration].filter(Boolean).join(' · ');
}

const selectedStore = computed(() =>
  (data.value?.stores ?? []).find((s) => s.id === booking.storeId) ?? null,
);

useHead({ title: 'Đặt lịch — Bước 1' });
</script>

<template>
  <div class="flex flex-col gap-4 pb-24">
    <BookingSteps :current="1" />

    <!-- Dan tu chan doan AI -->
    <div
      v-if="booking.aiDiagnosisId"
      class="flex gap-2 px-3.5 py-2.5 text-[12px]"
      style="
        background: var(--color-accent-2-100);
        border-radius: 18px;
        color: var(--color-accent-2-800);
      "
    >
      <span aria-hidden="true">✦</span>
      <span>Đến từ chẩn đoán AI — dịch vụ gợi ý đã được chọn sẵn.</span>
    </div>

    <section>
      <h5 class="mb-2.5">Bạn cần dịch vụ nào?</h5>
      <div class="flex gap-2.5">
        <button
          type="button"
          class="btn btn-secondary flex-1 gap-2 text-[13.5px]"
          :style="
            kinds.has('MAINTENANCE')
              ? 'border-color: var(--color-accent); color: var(--color-accent-700)'
              : ''
          "
          :aria-pressed="kinds.has('MAINTENANCE')"
          @click="toggleKind('MAINTENANCE')"
        >
          Bảo dưỡng
        </button>
        <button
          type="button"
          class="btn btn-secondary flex-1 gap-2 text-[13.5px]"
          :style="
            kinds.has('REPAIR')
              ? 'border-color: var(--color-accent); color: var(--color-accent-700)'
              : ''
          "
          :aria-pressed="kinds.has('REPAIR')"
          @click="toggleKind('REPAIR')"
        >
          Sửa chữa
        </button>
      </div>
    </section>

    <section class="flex flex-col gap-2.5">
      <h5>Chọn hạng mục</h5>

      <label
        v-for="service in visibleServices"
        :key="service.id"
        class="flex cursor-pointer items-start gap-3 px-3.5 py-3"
        style="border-radius: 20px"
        :style="
          booking.selectedServiceIds.includes(service.id)
            ? 'background: var(--color-surface)'
            : 'background: var(--color-neutral-100)'
        "
      >
        <input
          type="checkbox"
          class="mt-0.5 h-4 w-4 flex-none"
          style="accent-color: var(--color-accent)"
          :checked="booking.selectedServiceIds.includes(service.id)"
          @change="booking.toggleService(service)"
        >
        <span class="min-w-0 flex-1">
          <span
            class="block text-[14px]"
            :class="booking.selectedServiceIds.includes(service.id) ? 'font-semibold' : ''"
          >
            {{ i18n(service.name) }}
          </span>
          <span class="block truncate text-[11.5px] text-muted">{{ subtitle(service) }}</span>
        </span>
        <span class="whitespace-nowrap font-heading text-[14px]">
          {{ service.quoteOnly ? 'báo giá' : money(service.basePrice) }}
        </span>
      </label>

      <p v-if="visibleServices.length === 0" class="text-[13px] text-muted">
        Không có hạng mục nào trong nhóm đã chọn.
      </p>
    </section>

    <section class="flex flex-col gap-2.5">
      <h5>Chọn cửa hàng</h5>

      <label
        v-for="store in data?.stores ?? []"
        :key="store.id"
        class="radio gap-3 px-3.5 py-3"
        style="border-radius: 20px"
        :style="
          booking.storeId === store.id
            ? 'background: var(--color-surface)'
            : 'background: var(--color-neutral-100)'
        "
      >
        <input
          type="radio"
          name="store"
          :value="store.id"
          :checked="booking.storeId === store.id"
          @change="booking.storeId = store.id"
        >
        <span class="dot" />
        <span class="min-w-0 flex-1">
          <span
            class="block text-[14px]"
            :class="booking.storeId === store.id ? 'font-semibold' : ''"
          >
            {{ i18n(store.name) }}
          </span>
          <span class="block truncate text-[11.5px] text-muted">{{ i18n(store.address) }}</span>
        </span>
      </label>
    </section>
  </div>

  <!-- Thanh tong tien va nut tiep theo, ghim duoi man -->
  <div
    class="fixed inset-x-0 bottom-0 z-30 ay-safe-bottom"
    style="background: var(--color-bg); border-top: 1px solid var(--color-divider)"
  >
    <div class="sp-shell flex flex-col gap-2 px-4 py-3">
      <div class="flex items-baseline justify-between">
        <span class="text-[12px] text-muted">
          Tổng giá tham khảo · tạm tính
          <template v-if="booking.estimatedMinutes"> · {{ booking.estimatedMinutes }} phút</template>
        </span>
        <span class="font-heading text-[21px]">
          {{
            booking.hasQuoteOnly && booking.estimatedTotal === 0
              ? 'báo giá'
              : money(booking.estimatedTotal)
          }}
        </span>
      </div>

      <NuxtLink
        to="/booking/step2"
        class="btn btn-primary btn-cta"
        :class="booking.step1Complete ? '' : 'pointer-events-none opacity-50'"
        :aria-disabled="!booking.step1Complete"
      >
        Tiếp theo →
      </NuxtLink>

      <p v-if="!booking.step1Complete" class="text-[11.5px]" style="color: var(--color-danger)">
        Hãy chọn ít nhất một hạng mục và một cửa hàng.
      </p>
      <p v-else-if="selectedStore" class="text-[11.5px] text-muted">
        {{ booking.selectedServiceIds.length }} hạng mục · {{ i18n(selectedStore.name) }}
      </p>
    </div>
  </div>
</template>
