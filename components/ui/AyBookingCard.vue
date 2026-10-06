<script setup lang="ts">
import type { Booking } from '~/types/models';

/**
 * The lich hen cua khach — SC-01a va SC-21.
 *
 * Than the bam duoc de xem tien do. Chan the la hang nut co chu: chi mot cai
 * bieu tuong thi khach phai doan y nghia, ma doi lich voi huy lich la hai viec
 * khong the nham. Lich con hieu luc thi cho sua va huy; lich da dong thi cho
 * dat lai. SC-01a thay ca hang nut nay bang khe cam actions cua rieng no.
 */
const props = withDefaults(
  defineProps<{
    booking: Booking;
    /** SC-01a chi hien mot the, co them dong dan sang danh sach day du. */
    kicker?: string;
    showActions?: boolean;
  }>(),
  { showActions: true },
);

/**
 * Nut Huy bao len cho man hinh cha xu ly, vi SC-21 mo popup xac nhan ngay tai
 * cho chu khong roi danh sach. SC-01a khong dung hang nut nay — trang chu thay
 * ca khe cam actions.
 */
const emit = defineEmits<{ (e: 'cancel', booking: Booking): void }>();

const { i18n, slotRange, money } = useFormat();

/** BR-04, BR-05 — chi lich chua dien ra va chua tiep nhan moi doi hoac huy duoc. */
const ACTIVE: string[] = ['PENDING', 'CONFIRMED'];
const CLOSED: string[] = ['CANCELLED', 'DONE', 'NO_SHOW'];

const active = computed(() => ACTIVE.includes(props.booking.status));
const closed = computed(() => CLOSED.includes(props.booking.status));

const serviceNames = computed(() =>
  (props.booking.services ?? []).map((line) => line.serviceName).join(', '),
);

/**
 * Cua hang da gui bao gia va dang cho khach tra loi.
 *
 * Lich hen khong co trang thai rieng cho viec nay — ca giai doan sua xe deu
 * nam duoi RECEIVED "Da tiep nhan". Nhung day lai la luc duy nhat KHACH phai
 * lam gi do, nen the phai noi ro bang nhan rieng va mot dong tien.
 *
 * Than the van di den man tien do nhu moi lich khac: bam vao mot the ma
 * nhay sang man khac han cac the con lai thi khach khong doan duoc dieu gi
 * se xay ra. Duong sang ban bao gia nam o nut rieng duoi chan the.
 */
const awaitingQuote = computed(() => props.booking.pendingQuotation ?? null);

/**
 * Nhan tren the phai doc giong het dong thoi gian o man theo doi tien do.
 *
 * Truoc day the lay thang `booking.status`, ma ca giai doan sua xe deu
 * nam duoi RECEIVED — nen mot chiec xe sap duoc giao van ghi "Da tiep
 * nhan" trong khi man tien do da di den "Cho ban giao".
 *
 * Buoc va moc tren dong thoi gian dat ten khac nhau o hai cho, nen phai
 * bac cau: DIAGNOSED la moc "da chan doan", QUOTING la moc "dang bao
 * gia". Huy va khong den khong co moc nao, de nguyen nhan cu.
 */
const STAGE_FLOW: Record<string, string> = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  RECEIVED: 'RECEIVED',
  DIAGNOSED: 'DIAGNOSING',
  QUOTING: 'QUOTED',
  QUOTE_ACCEPTED: 'QUOTE_ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  DELIVERED: 'DELIVERED',
};

const { t, te } = useI18n();

const tagStatus = computed(
  () => props.booking.stage ?? (awaitingQuote.value ? 'QUOTED' : props.booking.status),
);

const tagLabel = computed(() => {
  const key = STAGE_FLOW[tagStatus.value as string];
  return key && te(`flow.${key}`) ? t(`flow.${key}`) : undefined;
});
</script>

<template>
  <div style="background: var(--color-surface); border-radius: 24px; overflow: hidden">
    <NuxtLink
      :to="`/bookings/${booking.code}/progress`"
      class="flex w-full flex-col gap-[7px] p-3.5 text-left"
    >
      <span class="flex items-center justify-between gap-2.5">
        <span v-if="kicker" class="card-kicker">{{ kicker }}</span>
        <span v-else class="font-heading text-[14px]">{{ booking.code }}</span>
        <AyStatusTag :status="tagStatus as string" :label="tagLabel" />
      </span>
      <span class="text-[13.5px] font-semibold">{{ slotRange(booking) }}</span>
      <span
        v-if="awaitingQuote"
        class="text-[12px] font-semibold"
        style="color: var(--color-accent-800)"
      >
        {{ $t('sc21.quoteWaiting', { amount: money(awaitingQuote.totalAmount) }) }}
      </span>
      <span class="text-muted text-[11.5px]">
        {{ i18n(booking.store?.name ?? null) }}
        <template v-if="serviceNames"> · {{ serviceNames }}</template>
      </span>
      <span v-if="booking.vehicle" class="text-muted text-[11.5px]">
        {{ booking.vehicle.maker }} {{ booking.vehicle.model }} · {{ booking.vehicle.plateNumber }}
      </span>
    </NuxtLink>

    <div
      v-if="showActions || $slots.actions"
      class="flex justify-end gap-2 px-3.5 pb-3 pt-2.5"
      style="border-top: 1px solid var(--color-divider)"
    >
      <slot name="actions">
        <!-- Viec dang cho khach lam, dat truoc cac nut khac. -->
        <NuxtLink
          v-if="awaitingQuote"
          :to="`/quotations/${awaitingQuote.token}`"
          class="ay-card-btn ay-card-btn-accent"
          :aria-label="$t('card.viewQuote', { code: booking.code })"
        >
          {{ $t('sc26.viewQuote') }}
        </NuxtLink>

        <template v-if="active">
          <NuxtLink
            :to="`/bookings/${booking.code}/reschedule`"
            class="ay-card-btn"
            :aria-label="$t('card.reschedule', { code: booking.code })"
          >
            {{ $t('common.edit') }}
          </NuxtLink>
          <button
            type="button"
            class="ay-card-btn ay-card-btn-danger"
            :aria-label="$t('card.cancel', { code: booking.code })"
            @click="emit('cancel', booking)"
          >
            {{ $t('common.cancel') }}
          </button>
        </template>

        <NuxtLink
          v-else-if="closed"
          :to="`/bookings/${booking.code}/rebook`"
          class="ay-card-btn ay-card-btn-accent"
          :aria-label="$t('card.rebook', { code: booking.code })"
        >
          {{ $t('card.rebookShort') }}
        </NuxtLink>
      </slot>
    </div>
  </div>
</template>

<style scoped>
/* Giu chieu cao 38px nhu hang nut tron cu de chan the khong xo lech. */
.ay-card-btn {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  border-radius: 999px;
  background: var(--color-neutral-200);
  padding: 0 16px;
  color: var(--color-neutral-800);
  font-size: 12.5px;
  font-weight: 600;
}
.ay-card-btn:hover {
  background: var(--color-neutral-300);
  text-decoration: none;
}
.ay-card-btn-danger {
  color: var(--color-danger);
}
.ay-card-btn-accent {
  background: var(--color-accent-200);
  color: var(--color-accent-800);
}
.ay-card-btn-accent:hover {
  background: var(--color-accent-300);
}
</style>
