<script setup lang="ts">
import type { ServiceItem, Store } from '~/types/models';

/** SC-01 Trang chu. */
const api = useApi();
const { i18n, money } = useFormat();

const { data } = await useAsyncData('home', async () => {
  const [services, stores] = await Promise.all([
    api.get<ServiceItem[]>('/services/featured'),
    api.get<Store[]>('/stores'),
  ]);
  return { services, stores };
});

useHead({ title: 'AOYAMA Service — Bảo dưỡng & sửa chữa xe máy' });

const lookupCode = ref('');
</script>

<template>
  <div class="flex flex-col gap-10">
    <!-- Khoi mo dau -->
    <section class="grid gap-6 lg:grid-cols-2 lg:items-center">
      <div>
        <p class="ay-kicker">Bảo dưỡng &amp; sửa chữa xe máy</p>
        <h1 class="mt-1.5 font-heading text-[32px] leading-tight sm:text-[38px]">
          Hỗ trợ toàn diện cho cuộc sống xe máy của bạn
        </h1>
        <p class="mt-3 max-w-prose text-[15px] ay-muted">
          AOYAMA xử lý mọi dịch vụ từ kiểm tra xe, sửa phanh và lốp, sơn đồng đến tư vấn bảo hiểm.
          Đặt lịch trực tuyến 24/7, không cần gọi điện.
        </p>

        <div class="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <AyButton to="/booking/step1" class="sm:flex-1">Đặt lịch ngay · Book now</AyButton>
          <AyButton to="/chat" variant="secondary" class="sm:flex-1">
            <template #icon>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                <path d="M21 12a8 8 0 0 1-8 8H7l-4 3 1-5a8 8 0 1 1 17-6Z" />
              </svg>
            </template>
            Xe đang gặp vấn đề? Hỏi trợ lý AI
          </AyButton>
        </div>
      </div>

      <div class="overflow-hidden rounded-2xl bg-accent-200 p-3">
        <div class="grid aspect-[4/3] place-items-center rounded-xl bg-accent-100 text-center">
          <div class="px-6">
            <p class="font-heading text-[19px] text-accent-800">遠鉄グループ AOYAMA</p>
            <p class="mt-1 text-[13px] ay-muted">
              Chuỗi cửa hàng xe máy tại Shizuoka — {{ data?.stores.length ?? 0 }} cửa hàng đang phục vụ
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Dich vu noi bat -->
    <section>
      <div class="mb-3 flex items-baseline justify-between gap-3">
        <h2 class="font-heading text-[20px]">Dịch vụ · Services</h2>
        <NuxtLink to="/services" class="ay-btn ay-btn-ghost ay-btn-sm">Xem tất cả →</NuxtLink>
      </div>

      <div class="grid gap-2.5 md:grid-cols-2">
        <AyServiceCard
          v-for="service in data?.services ?? []"
          :key="service.id"
          :service="service"
          :to="`/services/${service.slug}`"
        />
      </div>
    </section>

    <!-- Tra cuu lich hen -->
    <section class="ay-card flex flex-col gap-2">
      <p class="ay-kicker">Đã có mã lịch hẹn?</p>
      <p class="text-[14px] ay-muted">
        Tra cứu bằng mã lịch hẹn và số điện thoại — không cần đăng nhập.
      </p>
      <form class="mt-1 flex flex-col gap-2 sm:flex-row" @submit.prevent="navigateTo(`/booking/lookup?code=${encodeURIComponent(lookupCode)}`)">
        <input
          v-model="lookupCode"
          class="ay-input font-heading tracking-widest sm:flex-1"
          type="text"
          placeholder="AY-XXXXXXXX"
          aria-label="Mã lịch hẹn"
        >
        <AyButton type="submit" variant="secondary">Tra cứu lịch hẹn</AyButton>
      </form>
    </section>

    <!-- Cua hang -->
    <section>
      <div class="mb-3 flex items-baseline justify-between gap-3">
        <h2 class="font-heading text-[20px]">Cửa hàng · Stores</h2>
        <NuxtLink to="/stores" class="ay-btn ay-btn-ghost ay-btn-sm">Xem tất cả →</NuxtLink>
      </div>

      <div class="grid gap-2.5 md:grid-cols-3">
        <NuxtLink
          v-for="store in data?.stores ?? []"
          :key="store.id"
          :to="`/stores/${store.id}`"
          class="ay-card transition-colors hover:bg-accent-100"
        >
          <p class="font-heading text-[15.5px]">{{ i18n(store.name) }}</p>
          <p class="mt-1 text-[12.5px] ay-muted">{{ i18n(store.address) }}</p>
          <p class="mt-1.5 text-[13px]">{{ store.phone }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
