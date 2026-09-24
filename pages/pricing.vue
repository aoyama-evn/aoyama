<script setup lang="ts">
import type { ServiceItem } from '~/types/models';

/** SC-04 Bang gia tham khao — FR-PUB-04, FR-SVC-06. */
const api = useApi();
const { i18n, money } = useFormat();

const { data: services } = await useAsyncData('pricing', () => api.get<ServiceItem[]>('/services'));

const grouped = computed(() => {
  const list = services.value ?? [];
  return [
    { label: 'Bảo dưỡng', items: list.filter((s) => s.type === 'MAINTENANCE') },
    { label: 'Sửa chữa', items: list.filter((s) => s.type === 'REPAIR') },
  ].filter((g) => g.items.length > 0);
});

useHead({ title: 'Bảng giá tham khảo — AOYAMA Service' });
</script>

<template>
  <div class="flex flex-col gap-5">
    <AyPageHeader
      code="SC-04" title="Bảng giá tham khảo"
      description="Giá dưới đây áp dụng cho xe dưới 125cc. Xe dung tích lớn hơn tính theo phân khúc, giá cuối cùng ghi trong báo giá trước khi thi công."
    />

    <section v-for="group in grouped" :key="group.label">
      <h2 class="mb-2 font-heading text-[17px]">{{ group.label }}</h2>
      <div class="ay-table-wrap">
        <table class="ay-table">
          <thead>
            <tr>
              <th scope="col">Dịch vụ</th>
              <th scope="col" class="hidden sm:table-cell">Nội dung</th>
              <th scope="col" class="text-center">Thời gian</th>
              <th scope="col" class="text-right">Giá tham khảo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="service in group.items" :key="service.id">
              <td>
                <NuxtLink :to="`/services/${service.slug}`" class="font-semibold hover:underline">
                  {{ i18n(service.name) }}
                </NuxtLink>
              </td>
              <td class="hidden text-[13px] ay-muted sm:table-cell">
                {{ i18n(service.shortDescription) }}
              </td>
              <td class="text-center whitespace-nowrap">{{ service.durationMinutes }} phút</td>
              <td class="text-right font-heading whitespace-nowrap">
                {{ service.quoteOnly ? 'Báo giá riêng' : `~ ${money(service.basePrice)}` }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <p class="text-[12.5px] ay-muted">
      Giá chưa bao gồm phụ tùng thay thế. Mọi hạng mục phát sinh đều được báo giá và chờ bạn đồng ý
      trước khi thực hiện.
    </p>

    <AyButton to="/booking/step1" class="self-start">Đặt lịch ngay</AyButton>
  </div>
</template>
