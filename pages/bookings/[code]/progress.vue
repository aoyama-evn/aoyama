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
const { t } = useI18n();
const { dateTime, money, number } = useFormat();

const code = route.params.code as string;
const { data: progress, refresh } = await useAsyncData(`progress-${code}`, () =>
  api.get<PublicProgress>(`/bookings/${code}/progress`),
);

/** Anh chup luc tiep nhan — cac giai doan sau co anh rieng, khong tron vao. */
const intakePhotos = computed(() =>
  (progress.value?.photos ?? []).filter((photo) => photo.stage === 'INTAKE'),
);

/** Xe da vao giai doan sua chua? Truoc do danh sach hang muc chua co y nghia. */
const workStarted = computed(() =>
  ['IN_PROGRESS', 'COMPLETED', 'DELIVERED'].includes(progress.value?.status ?? '') &&
  (progress.value?.items ?? []).length > 0,
);

const qrOpen = ref(false);
const { saveQr } = useSaveQr();
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
/**
 * Chin moc khach nhin thay, dung bang voi cac buoc o trang quan tri —
 * hai site phai noi cung mot thu, khong moi ben mot cach goi.
 *
 * DIAGNOSING hien thanh "Da chan doan" va QUOTE_ACCEPTED thanh "Da chot
 * bao gia": ca hai la moc da qua, khong phai viec dang lam.
 */
const FLOW = [
  { key: 'PENDING', kind: 'booking' as const },
  { key: 'CONFIRMED', kind: 'booking' as const },
  { key: 'RECEIVED', kind: 'work' as const },
  { key: 'DIAGNOSING', kind: 'work' as const },
  { key: 'QUOTED', kind: 'work' as const },
  { key: 'QUOTE_ACCEPTED', kind: 'work' as const },
  { key: 'IN_PROGRESS', kind: 'work' as const },
  { key: 'COMPLETED', kind: 'work' as const },
  { key: 'DELIVERED', kind: 'work' as const },
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
  // Luc chot bao gia khong nam trong lich su trang thai phieu — no la
  // viec cua ban bao gia, may chu tra ve rieng.
  if (data.quoteAcceptedAt) {
    stamps.set('QUOTE_ACCEPTED', { at: data.quoteAcceptedAt, note: null });
  }

  // Moc hien tai la moc cuoi cung co dau thoi gian.
  const reached = FLOW.map((step) => stamps.has(step.key));
  const currentIndex = reached.lastIndexOf(true);

  return FLOW.map((step, index) => {
    const stamp = stamps.get(step.key);
    return {
      key: step.key,
      label: t(`flow.${step.key}`),
      at: stamp ? dateTime(stamp.at) : null,
      note: stamp?.note ?? null,
      state: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo',
    };
  });
});

const fuelLabel = computed(() => {
  const level = progress.value?.intakeFuelLevel;
  if (level === null || level === undefined) return null;
  return t('sc26.fuel', { n: level });
});

useHead({ title: () => t('sc26.headTitle', { code }) });
</script>

<template>
  <div v-if="progress" class="flex flex-col gap-4 pb-4 pt-1">
    <div>
      <h4 class="mb-1.5">{{ $t('sc26.title') }}</h4>
      <p class="text-muted text-[11px]">{{ $t('sc16.codeLabel') }}</p>
      <p class="font-heading text-[19px]">{{ progress.bookingCode }}</p>
    </div>

    <div v-if="progress.vehicle" class="card gap-1.5" style="background: var(--color-neutral-100)">
      <div class="card-kicker">{{ $t('sc26.yourVehicle') }}</div>
      <p class="text-[13px]">
        {{ progress.vehicle.maker }} {{ progress.vehicle.model }} ·
        {{ progress.vehicle.plateNumber }}
      </p>
      <p v-if="progress.intakeOdometer" class="text-muted text-[11.5px]">
        {{ $t('sc26.intake', { km: number(progress.intakeOdometer) }) }}
        <template v-if="fuelLabel"> · {{ fuelLabel }}</template>
      </p>
    </div>

    <div v-if="cancelled" class="card flex-row items-center gap-2">
      <AyStatusTag status="CANCELLED" />
      <p class="text-muted text-[13.5px]">{{ $t('sc26.cancelled') }}</p>
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
          {{ $t('sc26.showQr') }}
        </button>
      </template>

      <!--
        Da qua buoc nao thi ke ro buoc do, chu khong chi danh dau mot cham
        xanh. Khach khong o xuong nen day la tat ca nhung gi ho biet.
      -->
      <template #after-RECEIVED>
        <div class="mt-1.5 flex flex-col gap-0.5 text-[11.5px]">
          <span v-if="progress.intakeOdometer" class="text-muted">
            {{ $t('sc26.intake', { km: number(progress.intakeOdometer) }) }}
            <template v-if="fuelLabel"> · {{ fuelLabel }}</template>
          </span>
          <span v-if="progress.intakeAccessories" class="text-muted">
            {{ $t('sc26.accessories', { list: progress.intakeAccessories }) }}
          </span>
          <span v-if="progress.customerSymptom" class="text-muted">
            {{ $t('sc26.symptom', { text: progress.customerSymptom }) }}
          </span>
          <span v-if="intakePhotos.length" class="text-muted">
            {{ $t('sc26.photoCount', { n: intakePhotos.length }) }}
          </span>
        </div>
      </template>

      <!--
        Khach khong o xuong nen moc "da chan doan" ma trong khong thi ho
        van khong biet tho tim ra gi. Ke ket luan va ten nguoi da kham xe.
      -->
      <template #after-DIAGNOSING>
        <div class="mt-1.5 flex flex-col gap-0.5 text-[11.5px]">
          <span v-if="progress.diagnosisNote" class="text-muted">
            {{ $t('sc26.finding', { text: progress.diagnosisNote }) }}
          </span>
          <span v-if="progress.diagnosisCause" class="text-muted">
            {{ $t('sc26.cause', { text: progress.diagnosisCause }) }}
          </span>
          <span v-if="progress.diagnosedByName" class="text-muted">
            {{ $t('sc26.diagnosedBy', { name: progress.diagnosedByName }) }}
          </span>
        </div>
      </template>

      <template #after-IN_PROGRESS>
        <!--
          Chi ke hang muc khi xe that su da duoc dong vao. Hien som hon thi
          ca danh sach deu "Cho lam" — khong noi them duoc gi, lai lam khach
          tuong tho dang lam trong khi ho con chua duyet bao gia.
        -->
        <ul v-if="workStarted" class="mt-1.5 flex flex-col gap-1">
          <li
            v-for="(item, index) in progress.items ?? []"
            :key="index"
            class="flex items-start gap-1.5 text-[12px]"
          >
            <!-- Dau hieu bang hinh, khong chi bang mau: NFR-UX-09. -->
            <span class="flex-none" aria-hidden="true">
              {{ item.state === 'DONE' ? '✓' : item.state === 'IN_PROGRESS' ? '▸' : '·' }}
            </span>
            <span :class="item.state === 'DONE' ? 'text-muted' : ''">
              {{ item.name }}
              <span class="text-muted">— {{ $t(`workItem.${item.state}`) }}</span>
            </span>
          </li>
        </ul>
      </template>

      <template #after-QUOTED>
        <!--
          Lay tong cua chinh ban bao gia, khong phai tong cua phieu dich vu.
          Hai con so nay khac nhau: bao gia niem yet gia chua thue, con phieu
          da cong 10% thue vao. Khach dang duoc hoi co dong y BAN BAO GIA
          khong, nen phai thay dung con so trong ban do.
        -->
        <span
          v-if="progress.pendingQuotation?.totalAmount"
          class="text-muted text-[11.5px]"
        >
          {{ $t('sc26.awaitingYou', { amount: money(progress.pendingQuotation.totalAmount) }) }}
        </span>
        <!--
          Dan thang toi ban bao gia. Truoc day nut nay tro ve man chi tiet
          lich hen, khach bam vao chi thay mot cai ma QR chu khong phai bao
          gia nao ca.

          Dung `quotation` chu khong phai `pendingQuotation`: chot xong roi
          khach van muon mo lai xem minh da dong y nhung gi va het bao nhieu.
          Man bao gia tu an cac nut dong y, tu choi, xem lai khi ban do
          khong con cho tra loi, nen o day khong phai chan them.
        -->
        <NuxtLink
          v-if="progress.quotation"
          :to="`/quotations/${progress.quotation.token}`"
          class="mt-2 text-[12px]"
          :class="progress.pendingQuotation ? 'btn btn-primary' : 'btn btn-secondary'"
          style="min-height: 34px"
        >
          {{ $t('sc26.viewQuote') }}
        </NuxtLink>
      </template>
    </AyProgressSteps>

    <div
      v-if="progress.progressNote"
      class="card gap-1.5"
      style="background: var(--color-neutral-100)"
    >
      <div class="card-kicker">{{ $t('sc26.shopUpdate') }}</div>
      <p class="text-[13px]">{{ progress.progressNote }}</p>
      <p v-if="progress.estimatedCompletionAt" class="text-muted text-[11.5px]">
        {{ $t('sc26.eta', { at: dateTime(progress.estimatedCompletionAt) }) }}
      </p>
    </div>

    <section v-if="(progress.photos ?? []).length">
      <h5 class="mb-2">{{ $t('sc26.photos') }}</h5>
      <ul class="grid grid-cols-3 gap-2">
        <li v-for="(photo, index) in progress.photos" :key="index">
          <img
            :src="photo.url"
            :alt="photo.caption ?? $t('sc26.photoAlt')"
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
      {{ auth.isCustomer ? $t('sc21.backToList') : $t('common.backHome') }}
    </NuxtLink>

    <p class="text-muted text-center text-[11px]">
      {{ $t('sc26.autoRefresh') }}
    </p>

    <!-- Lop phu ma QR -->
    <AyConfirmDialog
      :open="qrOpen && Boolean(qr?.dataUrl)"
      :title="$t('sc26.qrTitle')"
      :confirm-label="$t('common.close')"
      hide-cancel
      @confirm="qrOpen = false"
      @cancel="qrOpen = false"
    >
      <div class="flex flex-col items-center gap-2.5">
        <img
          :src="qr?.dataUrl"
          :alt="$t('sc26.qrAlt', { code: progress.bookingCode })"
          class="bg-white"
          style="width: 190px; height: 190px; border-radius: 16px"
        />
        <p class="font-heading text-[16px]">{{ progress.bookingCode }}</p>
        <button
          type="button"
          class="btn btn-secondary gap-[7px] text-[12.5px]"
          style="min-height: 42px"
          @click="saveQr(qr?.dataUrl, progress.bookingCode)"
        >
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
          >
            <path d="M12 4v11M7.5 11 12 15.5 16.5 11M5 20h14" />
          </svg>
          {{ $t('sc16.saveQr') }}
        </button>
        <p class="text-muted text-center text-[11.5px]">
          {{ $t('sc26.qrHint') }}
        </p>
      </div>
    </AyConfirmDialog>
  </div>
</template>
