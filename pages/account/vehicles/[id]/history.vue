<script setup lang="ts">
import type { Page, ServiceHistory, Vehicle } from '~/types/models';

/** SC-31 Lich su dich vu cua xe — FR-VEH-04, FR-VEH-05. */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const api = useApi();
const { date, money, number } = useFormat();

const id = route.params.id as string;
const page = ref(1);

const { data: vehicle } = await useAsyncData(`veh-${id}`, () =>
  api.get<Vehicle>(`/account/vehicles/${id}`),
);
const { data: history, pending } = await useAsyncData(
  `veh-history-${id}`,
  () =>
    api.get<Page<ServiceHistory>>(`/account/vehicles/${id}/history`, {
      page: page.value,
      limit: 10,
    }),
  { watch: [page] },
);

useHead({ title: 'Lịch sử dịch vụ' });
</script>

<template>
  <div class="flex flex-col gap-5">
    <AyPageHeader
      code="SC-31"
      :title="`Lịch sử dịch vụ — ${vehicle?.plateNumber ?? ''}`"
      :description="vehicle ? `${vehicle.maker} ${vehicle.model} · số km hiện tại ${number(vehicle.currentOdometer)}` : undefined"
      back-to="/account/vehicles"
    />

    <AyLoading v-if="pending" />

    <AyEmptyState
      v-else-if="(history?.items ?? []).length === 0"
      title="Xe chưa có lịch sử dịch vụ tại AOYAMA"
      hint="Lịch sử được ghi tự động sau mỗi lần bảo dưỡng hoặc sửa chữa tại cửa hàng."
    >
      <AyButton to="/booking/step1" size="sm">Đặt lịch bảo dưỡng</AyButton>
    </AyEmptyState>

    <ol v-else class="flex flex-col gap-2.5">
      <li v-for="record in history?.items ?? []" :key="record.id">
        <component
          :is="record.workOrderId ? 'NuxtLink' : 'div'"
          :to="record.workOrderId ? `/service-records/${record.workOrderId}` : undefined"
          class="card flex flex-wrap items-start gap-3"
          :class="record.workOrderId ? 'transition-colors hover:bg-accent-100' : ''"
        >
          <div class="min-w-0 flex-1">
            <p class="font-heading text-[15.5px]">{{ record.summary }}</p>
            <p class="text-[12.5px] text-muted">
              {{ date(record.servicedAt) }}
              <template v-if="record.odometer"> · {{ number(record.odometer) }} km</template>
              · {{ record.type === 'MAINTENANCE' ? 'Bảo dưỡng' : 'Sửa chữa' }}
            </p>
            <ul v-if="record.itemNames.length" class="mt-1.5 flex flex-wrap gap-1">
              <li
                v-for="name in record.itemNames" :key="name"
                class="tag bg-neutral-200 text-neutral-700"
              >
                {{ name }}
              </li>
            </ul>
          </div>
          <p class="font-heading text-[15px] whitespace-nowrap">{{ money(record.totalAmount) }}</p>
        </component>
      </li>
    </ol>

    <div v-if="history?.meta && history.meta.totalPages > 1" class="flex justify-center gap-2">
      <AyButton variant="secondary" size="sm" :disabled="!history.meta.hasPrev" @click="page -= 1">
        Trước
      </AyButton>
      <span class="self-center text-[13px] text-muted">
        {{ history.meta.page }} / {{ history.meta.totalPages }}
      </span>
      <AyButton variant="secondary" size="sm" :disabled="!history.meta.hasNext" @click="page += 1">
        Sau
      </AyButton>
    </div>
  </div>
</template>
