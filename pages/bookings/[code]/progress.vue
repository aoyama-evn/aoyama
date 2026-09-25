<script setup lang="ts">
import type { ProgressStep } from '~/components/ui/AyProgressSteps.vue';
import type { PublicProgress } from '~/types/models';

/**
 * SC-26 Theo doi tien do (khach) va SC-26a (thanh vien) — FR-WO-09, FR-WO-10.
 * Ban thiet ke gop chang lich hen va chang phieu dich vu thanh mot dong thoi
 * gian bay moc, tu "Cho xac nhan" den "Da ban giao".
 */
const route = useRoute();
const api = useApi();
const auth = useAuthStore();
const { dateTime, money, number } = useFormat();

const code = route.params.code as string;
const { data: progress, refresh } = await useAsyncData(`progress-${code}`, () =>
  api.get<PublicProgress>(`/bookings/${code}/progress`),
);

const qrOpen = ref(false);
const { data: qr } = await useAsyncData(`progress-qr-${code}`, () =>
  api
    .get<{ available: boolean; dataUrl?: string }>(`/bookings/${code}/qr`)
    .catch(() => ({ available: false }) as { available: boolean; dataUrl?: string }),
);

/**
 * Tu lam moi moi phut khi xe con o xuong. WebSocket la ban nang cap ve sau;
 * hoi dinh ky du dung va khong giu ket noi mo tren dien thoai cua khach.
 */
let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  timer = setInterval(() => {
    const done = progress.value?.status && ['DELIVERED', 'CANCELLED'].includes(progress.value.status);
    if (!done) refresh();
  }, 60_000);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

/** Bay moc cua ban thiet ke, theo dung thu tu. */
const FLOW = [
  { key: 'PENDING', label: 'Chờ xác nhận', kind: 'booking' as const },
  { key: 'CONFIRMED', label: 'Đã xác nhận', kind: 'booking' as const },
  { key: 'RECEIVED', label: 'Đã tiếp nhận', kind: 'work' as const },
  { key: 'QUOTED', label: 'Đang báo giá', kind: 'work' as const },
  { key: 'IN_PROGRESS', label: 'Đang tiến hành', kind: 'work' as const },
  { key: 'COMPLETED', label: 'Đã xong', kind: 'work' as const },
  { key: 'DELIVERED', label: 'Đã bàn giao', kind: 'work' as const },
];

const cancelled = computed(
  () => progress.value?.bookingStatus === 'CANCELLED' || progress.value?.status === 'CANCELLED',
);

const steps = computed<ProgressStep[]>(() => {
  const data = progress.value;
  if (!data) return [];

  const stamps = new Map<string, { at: string; note: string | null }>();
  for (const entry of data.bookingTimeline ?? []) {
    stamps.set(entry.status, { at: entry.at, note: entry.note });
  }
  for (const entry of data.timeline ?? []) {
    stamps.set(entry.status, { at: entry.at, note: entry.note });
  }

  // Moc hien tai la moc cuoi cung co dau thoi gian.
  const reached = FLOW.map((step) => stamps.has(step.key));
  const currentIndex = reached.lastIndexOf(true);

  return FLOW.map((step, index) => {
    const stamp = stamps.get(step.key);
    return {
      key: step.key,
      label: step.label,
      at: stamp ? dateTime(stamp.at) : null,
      note: stamp?.note ?? null,
      state: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo',
    };
  });
});

const fuelLabel = computed(() => {
  const level = progress.value?.intakeFuelLevel;
  if (level === null || level === undefined) return null;
  return `nhiên liệu ${level}/4`;
});

useHead({ title: `Tiến độ ${code}` });
</script>

<template>
  <div v-if="progress" class="flex flex-col gap-4 pb-4 pt-1">
    <div>
      <h4 class="mb-1.5">Theo dõi tiến độ</h4>
      <p class="text-muted text-[11px]">Mã lịch hẹn</p>
      <p class="font-heading text-[19px]">{{ progress.bookingCode }}</p>
    </div>

    <div v-if="progress.vehicle" class="card gap-1.5" style="background: var(--color-neutral-100)">
      <div class="card-kicker">Xe của bạn</div>
      <p class="text-[13px]">
        {{ progress.vehicle.maker }} {{ progress.vehicle.model }} ·
        {{ progress.vehicle.plateNumber }}
      </p>
      <p v-if="progress.intakeOdometer" class="text-muted text-[11.5px]">
        Tiếp nhận {{ number(progress.intakeOdometer) }} km
        <template v-if="fuelLabel"> · {{ fuelLabel }}</template>
      </p>
    </div>

    <div v-if="cancelled" class="card flex-row items-center gap-2">
      <AyStatusTag status="CANCELLED" />
      <p class="text-muted text-[13.5px]">Lịch hẹn này đã bị hủy.</p>
    </div>

    <AyProgressSteps v-else :steps="steps">
      <template #after-PENDING>
        <button
          v-if="qr?.available"
          type="button"
          class="btn btn-secondary mt-3 gap-[7px] text-[12px]"
          style="min-height: 40px"
          @click="qrOpen = true"
        >
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.75" stroke-linecap="round" aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" rx="2" />
            <rect x="14" y="3" width="7" height="7" rx="2" />
            <rect x="3" y="14" width="7" height="7" rx="2" />
            <path d="M14 14h3v3M21 21h.01M17 21h.01M21 17h.01" />
          </svg>
          Xem mã QR
        </button>
      </template>

      <template #after-QUOTED>
        <span v-if="progress.totalAmount" class="text-muted text-[11.5px]">
          {{ money(progress.totalAmount) }} — chờ bạn phản hồi
        </span>
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

    <div
      v-if="progress.progressNote"
      class="card gap-1.5"
      style="background: var(--color-neutral-100)"
    >
      <div class="card-kicker">Cập nhật từ xưởng</div>
      <p class="text-[13px]">{{ progress.progressNote }}</p>
      <p v-if="progress.estimatedCompletionAt" class="text-muted text-[11.5px]">
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
          />
        </li>
      </ul>
    </section>

    <NuxtLink
      :to="auth.isCustomer ? '/account/bookings' : '/'"
      class="btn btn-ghost self-center text-[13px]"
    >
      {{ auth.isCustomer ? '← Lịch hẹn của tôi' : 'Trở về trang chủ' }}
    </NuxtLink>

    <p class="text-muted text-center text-[11px]">
      Trang tự cập nhật mỗi phút. Có thắc mắc, hãy gọi trực tiếp cửa hàng.
    </p>

    <!-- Lop phu ma QR -->
    <AyConfirmDialog
      :open="qrOpen && Boolean(qr?.dataUrl)"
      title="Mã QR lịch hẹn"
      confirm-label="Đóng"
      hide-cancel
      @confirm="qrOpen = false"
      @cancel="qrOpen = false"
    >
      <div class="flex flex-col items-center gap-2.5">
        <img
          :src="qr?.dataUrl"
          :alt="`Mã QR ${progress.bookingCode}`"
          class="bg-white"
          style="width: 190px; height: 190px; border-radius: 16px"
        />
        <p class="font-heading text-[16px]">{{ progress.bookingCode }}</p>
        <p class="text-muted text-center text-[11.5px]">
          Đưa mã này cho lễ tân khi đến cửa hàng.
        </p>
      </div>
    </AyConfirmDialog>
  </div>
</template>
