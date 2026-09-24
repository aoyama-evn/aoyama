<script setup lang="ts">
import type { PublicProgress } from '~/types/models';

/** SC-26 Theo doi tien do sua chua — FR-WO-09, FR-WO-10. */
const route = useRoute();
const api = useApi();
const { dateTime } = useFormat();

const code = route.params.code as string;
const { data: progress, refresh } = await useAsyncData(`progress-${code}`, () =>
  api.get<PublicProgress>(`/bookings/${code}/progress`),
);

/**
 * Tu lam moi moi 60 giay khi xe con dang o xuong.
 * WebSocket la ban nang cap o giai doan sau; hoi dinh ky du cho muc dich hien tai
 * va khong giu ket noi mo tren dien thoai cua khach.
 */
let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  timer = setInterval(() => {
    if (progress.value?.status && !['DELIVERED', 'CANCELLED'].includes(progress.value.status)) {
      refresh();
    }
  }, 60_000);
});

onBeforeUnmount(() => { if (timer) clearInterval(timer); });

useHead({ title: `Tiến độ ${code}` });
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-5">
    <AyPageHeader code="SC-26" title="Theo dõi tiến độ" :back-to="`/bookings/${code}`" />

    <AyEmptyState
      v-if="!progress?.hasWorkOrder"
      title="Xe chưa vào xưởng"
      hint="Tiến độ sẽ hiển thị sau khi cửa hàng tiếp nhận xe của bạn."
    >
      <AyButton :to="`/bookings/${code}`" variant="secondary" size="sm">Xem lịch hẹn</AyButton>
    </AyEmptyState>

    <template v-else>
      <section class="ay-card flex flex-col gap-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <AyStatusTag :status="progress.status ?? 'RECEIVED'" />
          <p v-if="progress.estimatedCompletionAt" class="text-[13px] ay-muted">
            Dự kiến xong: {{ dateTime(progress.estimatedCompletionAt) }}
          </p>
        </div>

        <div>
          <div class="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              class="h-full rounded-full bg-accent transition-[width] duration-500"
              :style="{ width: `${progress.progressPercent ?? 0}%` }"
              role="progressbar"
              :aria-valuenow="progress.progressPercent ?? 0"
              aria-valuemin="0" aria-valuemax="100"
            />
          </div>
          <p class="mt-1 text-[12.5px] ay-muted">Hoàn thành {{ progress.progressPercent ?? 0 }}%</p>
        </div>

        <p v-if="progress.progressNote" class="text-[14px]">{{ progress.progressNote }}</p>

        <AyProgressSteps :current="progress.status ?? 'RECEIVED'" />
      </section>

      <section v-if="(progress.timeline ?? []).length" class="ay-card">
        <h2 class="mb-3 font-heading text-[16px]">Diễn biến</h2>
        <AyChangeLog
          :entries="(progress.timeline ?? []).map((t, i) => ({
            id: String(i),
            createdAt: t.at,
            actorType: 'ADMIN',
            action: t.status,
            detail: t.note,
          }))"
        />
      </section>

      <section v-if="(progress.photos ?? []).length" class="ay-card">
        <h2 class="mb-3 font-heading text-[16px]">Hình ảnh từ xưởng</h2>
        <ul class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <li v-for="(photo, index) in progress.photos" :key="index">
            <img :src="photo.url" :alt="photo.caption ?? 'Ảnh tiến độ'" class="aspect-square w-full rounded-xl object-cover">
            <p v-if="photo.caption" class="mt-1 text-[12px] ay-muted">{{ photo.caption }}</p>
          </li>
        </ul>
      </section>

      <p class="text-center text-[12.5px] ay-muted">
        Trang tự cập nhật mỗi phút. Có thắc mắc, hãy gọi trực tiếp cửa hàng.
      </p>
    </template>
  </div>
</template>
