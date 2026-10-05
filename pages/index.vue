<script setup lang="ts">
import type { Booking, Page, ServiceItem } from '~/types/models';

/**
 * SC-01 Trang chu (khach) va SC-01a (thanh vien).
 * Hai ban chi khac nhau o khoi cuoi: thanh vien thay lich hen sap toi, khach
 * thay loi moi tra cuu bang ma.
 */
const api = useApi();
const auth = useAuthStore();
const { t } = useI18n();
const { i18n, money } = useFormat();

const { data } = await useAsyncData('home-services', () =>
  api.get<ServiceItem[]>('/services/featured'),
);

/**
 * Lich hen sap toi chi co y nghia voi thanh vien, nen goi rieng.
 *
 * Chi goi tu phia trinh duyet. Phien dang nhap nam trong localStorage nen
 * may chu dung trang khong biet khach la ai: no tra ve null, roi ban null
 * do di kem trang va duoc dung lai khi trang song day — thanh vien tai lai
 * trang chu se khong bao gio thay lich cua minh.
 */
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
  { server: false, lazy: true, watch: [() => auth.isCustomer] },
);

const upcoming = computed(() => upcomingData.value?.booking ?? null);

useHead({ title: 'AOYAMA Service' });

/** Dong phu duoi ten dich vu: ten tieng Anh neu co, kem thoi luong. */
function subtitle(service: ServiceItem): string {
  const en = service.name.en ?? '';
  const duration = service.quoteOnly
    ? t('sc02.quoteAtStore')
    : t('common.minutes', { n: service.durationMinutes });
  return [en, duration].filter(Boolean).join(' · ');
}

function priceLabel(service: ServiceItem): string {
  return service.quoteOnly ? t('common.quoteOnly') : `~ ${money(service.basePrice)}`;
}
</script>

<template>
  <div class="flex flex-col gap-4 pb-4">
    <!-- Anh mo dau tran ra sat mep cot noi dung -->
    <div class="-mx-4 -mt-4 px-3 pb-3 pt-2" style="background: var(--color-accent-200)">
      <img
        :src="'/design/hero-bike.jpg'"
        :alt="$t('sc01.heroAlt')"
        class="block h-auto w-full"
        style="mix-blend-mode: multiply"
      />
    </div>

    <div>
      <p
        class="mb-1.5 text-[10px] font-semibold uppercase"
        style="letter-spacing: 0.1em; color: var(--color-accent-700)"
      >
        {{ $t('sc01.kicker') }}
      </p>
      <h2 class="text-[27px]">{{ $t('sc01.title') }}</h2>
      <p class="mt-2 text-[13px]" style="color: var(--color-neutral-700)">
        {{ $t('sc01.lead') }}
      </p>
    </div>

    <div class="flex flex-col gap-2.5">
      <NuxtLink to="/booking/step1" class="btn btn-primary btn-cta">
        {{ $t('sc01.bookCta') }}
      </NuxtLink>
      <NuxtLink to="/chat" class="btn btn-secondary btn-cta gap-2">
        <svg
          width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.75" stroke-linecap="round" aria-hidden="true"
        >
          <path d="M21 12a8 8 0 0 1-8 8H7l-4 3 1-5a8 8 0 1 1 17-6Z" />
        </svg>
        {{ $t('sc01.askAi') }}
      </NuxtLink>
    </div>

    <!--
      Mot cho ngay duoi hai nut lon, hai ban tuy nguoi dang xem.
      Truoc day ca hai deu nam cuoi trang, duoi danh sach nam dich vu:
      nguoi vua nhan tin nhan xac nhan mo trang len la de xem lich cua
      minh, ho khong phai cuon qua het moi thu moi thay.
    -->

    <!-- SC-01a — thanh vien: lich hen gan den nhat -->
    <AyBookingCard
      v-if="auth.isCustomer && upcoming"
      :booking="upcoming"
      :kicker="$t('sc01.upcomingKicker')"
    >
      <template #actions>
        <NuxtLink
          to="/account/bookings"
          class="btn btn-ghost px-1 text-[12.5px]"
          style="color: var(--color-accent-700)"
        >
          {{ $t('nav.myBookings') }} →
        </NuxtLink>
      </template>
    </AyBookingCard>

    <!-- SC-01 — khach chua dang nhap: tra cuu bang ma hoac so dien thoai -->
    <NuxtLink
      v-else-if="!auth.isCustomer"
      to="/booking/lookup"
      class="card flex-row items-center gap-3"
      style="color: inherit; text-decoration: none"
    >
      <svg
        width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-700)"
        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
        class="flex-none" aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <span class="min-w-0 flex-1">
        <span class="block font-heading text-[14.5px]">{{ $t('sc01.lookupCta') }}</span>
        <span class="text-muted block text-[12px] leading-[1.45]">{{ $t('sc01.haveCodeLead') }}</span>
      </span>
      <span class="flex-none text-[15px]" style="color: var(--color-accent-700)" aria-hidden="true">→</span>
    </NuxtLink>

    <!-- Danh sach dich vu dang hang -->
    <section class="flex flex-col gap-2.5">
      <div class="flex items-baseline justify-between gap-2.5">
        <h5>{{ $t('sc01.servicesTitle') }}</h5>
        <NuxtLink to="/services" class="btn btn-ghost text-[12px]">
          {{ $t('common.viewAll') }}
        </NuxtLink>
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
  </div>
</template>
