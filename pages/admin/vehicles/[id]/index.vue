<script setup lang="ts">
import type { Page, ServiceHistory, Vehicle } from '~/types/models';

/** SA-20 Chi tiet phuong tien va lich su — FR-VEH-10. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const { date, money, number } = useFormat();

const id = route.params.id as string;
const page = ref(1);

const { data: vehicle } = await useAsyncData(`admin-vehicle-${id}`, () =>
  api.get<Vehicle>(`/admin/vehicles/${id}`),
);
if (!vehicle.value) throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy xe' });

const { data: history, pending } = await useAsyncData(
  `admin-vehicle-history-${id}`,
  () => api.get<Page<ServiceHistory>>(`/admin/vehicles/${id}/history`, { page: page.value, limit: 15 }),
  { watch: [page] },
);

useHead({ title: `${vehicle.value.plateNumber} — AOYAMA Admin` });
</script>

<template>
  <div v-if="vehicle" class="flex flex-col gap-4">
    <AyPageHeader code="SA-20" :title="vehicle.plateNumber" back-to="/admin/vehicles">
      <template #actions>
        <AyButton :to="`/admin/vehicles/${id}/edit`" variant="secondary" size="sm">Sửa</AyButton>
        <AyButton :to="`/admin/customers/${vehicle.customerId}`" variant="secondary" size="sm">
          Hồ sơ chủ xe
        </AyButton>
      </template>
    </AyPageHeader>

    <section class="ay-card">
      <dl class="grid gap-2 text-[14px] sm:grid-cols-3">
        <div><dt class="ay-muted">Hãng / dòng</dt><dd>{{ vehicle.maker }} {{ vehicle.model }}</dd></div>
        <div><dt class="ay-muted">Dung tích</dt><dd>{{ vehicle.engineCc ? `${vehicle.engineCc}cc` : '—' }}</dd></div>
        <div><dt class="ay-muted">Số km hiện tại</dt><dd>{{ number(vehicle.currentOdometer) }} km</dd></div>
        <div><dt class="ay-muted">Năm sản xuất</dt><dd>{{ vehicle.modelYear ?? '—' }}</dd></div>
        <div><dt class="ay-muted">Màu</dt><dd>{{ vehicle.color ?? '—' }}</dd></div>
        <div><dt class="ay-muted">Số khung</dt><dd>{{ vehicle.vinNumber ?? '—' }}</dd></div>
        <div class="sm:col-span-3"><dt class="ay-muted">Chủ xe</dt><dd>{{ vehicle.customer?.name }} · {{ vehicle.customer?.phone }}</dd></div>
        <div v-if="vehicle.note" class="sm:col-span-3">
          <dt class="ay-muted">Ghi chú</dt><dd class="whitespace-pre-line">{{ vehicle.note }}</dd>
        </div>
      </dl>
    </section>

    <section class="ay-card">
      <h2 class="mb-3 font-heading text-[16px]">Lịch sử dịch vụ</h2>

      <AyLoading v-if="pending" />

      <AyEmptyState
        v-else-if="(history?.items ?? []).length === 0"
        title="Xe chưa có lịch sử dịch vụ"
        hint="Lịch sử được ghi tự động khi phiếu dịch vụ chuyển sang hoàn tất."
      />

      <ol v-else class="flex flex-col gap-2">
        <li
          v-for="record in history?.items ?? []" :key="record.id"
          class="flex flex-wrap items-start gap-3 border-b border-divider pb-2 last:border-0"
        >
          <div class="min-w-0 flex-1">
            <p class="text-[14px] font-semibold">{{ record.summary }}</p>
            <p class="text-[12.5px] ay-muted">
              {{ date(record.servicedAt) }}
              <template v-if="record.odometer"> · {{ number(record.odometer) }} km</template>
              · {{ record.type === 'MAINTENANCE' ? 'Bảo dưỡng' : 'Sửa chữa' }}
            </p>
          </div>
          <NuxtLink
            v-if="record.workOrderId"
            :to="`/admin/work-orders/${record.workOrderId}`"
            class="text-[12.5px] underline"
          >
            Mở phiếu
          </NuxtLink>
          <span class="font-heading text-[14px] whitespace-nowrap">{{ money(record.totalAmount) }}</span>
        </li>
      </ol>

      <div v-if="history?.meta && history.meta.totalPages > 1" class="mt-3 flex justify-center gap-2">
        <AyButton variant="secondary" size="sm" :disabled="!history.meta.hasPrev" @click="page -= 1">Trước</AyButton>
        <span class="self-center text-[13px] ay-muted">{{ history.meta.page }} / {{ history.meta.totalPages }}</span>
        <AyButton variant="secondary" size="sm" :disabled="!history.meta.hasNext" @click="page += 1">Sau</AyButton>
      </div>
    </section>
  </div>
</template>
