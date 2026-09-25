<script setup lang="ts">
import type { Booking, Page, ServiceItem } from '~/types/models';

/**
 * SC-01 Trang chu (khach) va SC-01a (thanh vien).
 * Hai ban chi khac nhau o khoi cuoi: thanh vien thay lich hen sap toi, khach
 * thay loi moi tra cuu bang ma.
 */
const api = useApi();
const auth = useAuthStore();
const { i18n, money } = useFormat();

const { data } = await useAsyncData('home-services', () =>
  api.get<ServiceItem[]>('/services/featured'),
);

/** Lich hen sap toi chi co y nghia voi thanh vien, nen goi rieng. */
const { data: upcomingData } = await useAsyncData(
  'home-upcoming',
  async () => {
    if (!auth.isCustomer) return { booking: null as Booking | null };
    const page = await api.get<Page<Booking>>('/account/bookings', {
      upcoming: true,
      limit: 1,
      sortOrder: 'ASC',
    });
    return { booking: page.items[0] ?? null };
  },
  { watch: [() => auth.isCustomer] },
);

const upcoming = computed(() => upcomingData.value?.booking ?? null);

useHead({ title: 'AOYAMA Service — Bảo dưỡng & sửa chữa xe máy' });

/** Dong phu duoi ten dich vu: ten tieng Anh neu co, kem thoi luong. */
function subtitle(service: ServiceItem): string {
  const en = service.name.en ?? '';
  const duration = service.quoteOnly ? 'báo giá riêng' : `${service.durationMinutes} phút`;
  return [en, duration].filter(Boolean).join(' · ');
}

function priceLabel(service: ServiceItem): string {
  return service.quoteOnly ? 'báo giá' : `~ ${money(service.basePrice)}`;
}
</script>

<template>
  <div class="flex flex-col gap-4 pb-4">
    <!-- Anh mo dau tran ra sat mep cot noi dung -->
    <div class="-mx-4 -mt-4 px-3 pb-3 pt-2" style="background: var(--color-accent-200)">
      <img
        :src="'/design/hero-bike.jpg'"
        alt="Xe máy tại AOYAMA"
        class="block h-auto w-full"
        style="mix-blend-mode: multiply"
      />
    </div>

    <div>
      <p
        class="mb-1.5 text-[10px] font-semibold uppercase"
        style="letter-spacing: 0.1em; color: var(--color-accent-700)"
      >
        Bảo dưỡng &amp; sửa chữa xe máy
      </p>
      <h2 class="text-[27px]">Hỗ trợ toàn diện cho cuộc sống xe máy của bạn</h2>
      <p class="mt-2 text-[13px]" style="color: var(--color-neutral-700)">
        Aoyama Motorcycle xử lý mọi dịch vụ từ bảo dưỡng đến kiểm tra, sửa chữa vỏ, sơn, phụ tùng
        các dòng xe máy. Hãy để mọi thứ liên quan đến xe của bạn cho chúng tôi!
      </p>
    </div>

    <div class="flex flex-col gap-2.5">
      <NuxtLink to="/booking/step1" class="btn btn-primary btn-cta">
        Đặt lịch ngay · Book now
      </NuxtLink>
      <NuxtLink to="/chat" class="btn btn-secondary btn-cta gap-2">
        <svg
          width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.75" stroke-linecap="round" aria-hidden="true"
        >
          <path d="M21 12a8 8 0 0 1-8 8H7l-4 3 1-5a8 8 0 1 1 17-6Z" />
        </svg>
        Xe đang gặp vấn đề? Hỏi trợ lý AI
      </NuxtLink>
    </div>

    <!-- Danh sach dich vu dang hang -->
    <section class="flex flex-col gap-2.5">
      <div class="flex items-baseline justify-between gap-2.5">
        <h5>Dịch vụ · Services</h5>
        <NuxtLink to="/services" class="btn btn-ghost text-[12px]">Xem tất cả →</NuxtLink>
      </div>

      <NuxtLink
        v-for="service in data ?? []"
        :key="service.id"
        :to="`/services/${service.slug}`"
        class="ay-row"
      >
        <AyServiceIcon :icon-key="service.iconKey" />
        <span class="min-w-0 flex-1">
          <span class="block text-[14px] font-semibold">{{ i18n(service.name) }}</span>
          <span class="text-muted block truncate text-[11.5px]">{{ subtitle(service) }}</span>
        </span>
        <span class="whitespace-nowrap font-heading text-[13.5px]">{{ priceLabel(service) }}</span>
      </NuxtLink>
    </section>

    <!-- SC-01a: lich hen sap toi cua thanh vien -->
    <AyBookingCard v-if="auth.isCustomer && upcoming" :booking="upcoming" kicker="Lịch hẹn sắp tới">
      <template #actions>
        <NuxtLink
          to="/account/bookings"
          class="btn btn-ghost px-1 text-[12.5px]"
          style="color: var(--color-accent-700)"
        >
          Lịch hẹn của tôi →
        </NuxtLink>
      </template>
    </AyBookingCard>

    <!-- SC-01: khach chua dang nhap tra cuu bang ma -->
    <div v-if="!auth.isCustomer" class="card gap-1.5">
      <div class="card-kicker">Đã có mã lịch hẹn?</div>
      <p class="text-[13px]" style="color: var(--color-neutral-700)">
        Tra cứu bằng mã lịch hẹn và số điện thoại — không cần đăng nhập.
      </p>
      <NuxtLink to="/booking/lookup" class="btn btn-ghost self-start px-1 text-[13px]">
        Tra cứu lịch hẹn →
      </NuxtLink>
    </div>
  </div>
</template>
