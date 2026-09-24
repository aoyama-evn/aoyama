<script setup lang="ts">
import type { PublicProgress } from '~/types/models';
import type { WorkOrderStatus } from '~/types/enums';

/** SC-26 Theo doi tien do sua chua — FR-WO-09, FR-WO-10. */
const route = useRoute();
const api = useApi();
const { dateTime, time } = useFormat();

const code = route.params.code as string;
const { data: progress, refresh } = await useAsyncData(`progress-${code}`, () =>
  api.get<PublicProgress>(`/bookings/${code}/progress`),
);

/**
 * Tu lam moi moi phut khi xe con o xuong. WebSocket la ban nang cap ve sau;
 * hoi dinh ky du dung va khong giu ket noi mo tren dien thoai cua khach.
 */
let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  timer = setInterval(() => {
    if (progress.value?.status && !['DELIVERED', 'CANCELLED'].includes(progress.value.status)) {
      refresh();
    }
  }, 60_000);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

/** Gom moc thoi gian theo trang thai de thanh tien do hien duoc gio va ghi chu. */
const timeline = computed(() => {
  const out: Partial<Record<WorkOrderStatus, { at?: string; note?: string | null }>> = {};
  for (const entry of progress.value?.timeline ?? []) {
    out[entry.status] = { at: time(entry.at), note: entry.note };
  }
  return out;
});

useHead({ title: `Tiến độ ${code}` });
</script>

<template>
  <div class="flex flex-col gap-4 pb-4">
    <AyEmptyState
      v-if="!progress?.hasWorkOrder"
      title="Xe chưa vào xưởng"
      hint="Tiến độ sẽ hiển thị sau khi cửa hàng tiếp nhận xe của bạn."
    >
      <NuxtLink :to="`/bookings/${code}`" class="btn btn-secondary text-[13px]">
        Xem lịch hẹn
      </NuxtLink>
    </AyEmptyState>

    <template v-else>
      <div>
        <div class="text-[11px] text-muted">Phiếu dịch vụ · Work order</div>
        <div class="font-heading text-[19px]">{{ progress.bookingCode }}</div>
      </div>

      <AyProgressSteps :current="progress.status ?? 'RECEIVED'" :timeline="timeline">
        <template #after-QUOTED>
          <NuxtLink
            v-if="progress.status === 'QUOTED'"
            :to="`/bookings/${code}`"
            class="btn btn-primary mt-2 text-[12px]"
            style="min-height: 34px"
          >
            Xem báo giá →
          </NuxtLink>
        </template>
      </AyProgressSteps>

      <div v-if="progress.progressNote" class="card gap-1.5" style="background: var(--color-neutral-100)">
        <div class="card-kicker">Cập nhật từ xưởng</div>
        <p class="text-[13px]">{{ progress.progressNote }}</p>
        <p v-if="progress.estimatedCompletionAt" class="text-[11.5px] text-muted">
          Dự kiến xong {{ dateTime(progress.estimatedCompletionAt) }}
        </p>
      </div>

      <section v-if="(progress.photos ?? []).length">
        <h5 class="mb-2">Hình ảnh từ xưởng</h5>
        <ul class="grid grid-cols-3 gap-2">
          <li v-for="(photo, index) in progress.photos" :key="index">
            <img
              :src="photo.url"
              :alt="photo.caption ?? 'Ảnh tiến độ'"
              class="aspect-square w-full object-cover"
              style="border-radius: 14px"
            >
          </li>
        </ul>
      </section>

      <p class="text-center text-[11px] text-muted">
        Trang tự cập nhật mỗi phút. Có thắc mắc, hãy gọi trực tiếp cửa hàng.
      </p>
    </template>
  </div>
</template>
