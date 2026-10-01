<script setup lang="ts">
import type { AiDiagnosis, Booking, ServiceHistory, WorkOrder } from '~/types/models';

/**
 * SA-05 Chi tiet lich hen — FR-BOOK-22..26, FR-AI-12.
 * Ban thiet ke: ba the tom tat o tren, the phieu dich vu va bao gia lien ket,
 * hai cot dich vu da dat + goi y AI, o ghi chu noi bo, va hang hanh dong can
 * phai duoi mot duong ke. Ten man hinh va trang thai nam o CP-05.
 */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { i18n, money, dateTime, dayLabel, clock, number } = useFormat();

const id = route.params.id as string;

const { data: booking, refresh } = await useAsyncData(`admin-booking-${id}`, () =>
  api.get<Booking>(`/admin/bookings/${id}`),
);

if (!booking.value) {
  throw createError({ statusCode: 404, statusMessage: t('sc22.notFound') });
}

setScreenTitle(() => t('sa05.title', { code: booking.value?.code ?? '' }));

/** FR-AI-12 — hien lai ket qua chan doan AI khach da lam truoc khi dat lich. */
const { data: diagnosis } = await useAsyncData(`admin-booking-diag-${id}`, () =>
  booking.value?.aiDiagnosisId
    ? api.get<AiDiagnosis>(`/ai/diagnosis/sessions/${booking.value.aiDiagnosisId}`)
    : Promise.resolve(null),
);

/** Lich su gan nhat cua xe — giup le tan doi chieu ngay tai quay. */
const { data: history } = await useAsyncData(`admin-booking-history-${id}`, () =>
  booking.value?.vehicleId
    ? api.get<{ items: ServiceHistory[] }>(`/admin/vehicles/${booking.value.vehicleId}/history`, {
        limit: 3,
      })
    : Promise.resolve(null),
);

/**
 * Phieu dich vu mo tu lich hen nay, neu co — chi dung de biet co nen hien nut
 * "Mo phieu dich vu" hay khong. Man nay khong trinh bay gi ve phieu nua.
 */
const { data: openOrder } = await useAsyncData(`admin-booking-order-${id}`, async () => {
  try {
    const page = await api.get<{ items: WorkOrder[] }>('/admin/work-orders', {
      bookingId: id,
      limit: 1,
    });
    return page.items[0] ?? null;
  } catch {
    return null;
  }
});

const busy = ref(false);
const confirmAction = ref<'CONFIRM' | 'CANCEL' | 'NO_SHOW' | null>(null);
const cancelReason = ref('');
const adminNote = ref('');

watchEffect(() => {
  adminNote.value = booking.value?.adminNote ?? '';
});

async function act(): Promise<void> {
  if (!confirmAction.value || !booking.value) return;
  busy.value = true;
  try {
    if (confirmAction.value === 'CONFIRM') {
      await api.put(`/admin/bookings/${id}/confirm`);
      ui.success(t('sa05.confirmed'), t('sa05.confirmedSub'));
    } else if (confirmAction.value === 'CANCEL') {
      await api.put(`/admin/bookings/${id}/cancel`, { reason: cancelReason.value || undefined });
      ui.success(t('sa05.cancelled'));
    } else {
      await api.put(`/admin/bookings/${id}/no-show`);
      ui.success(t('sa05.markedNoShow'));
    }
    confirmAction.value = null;
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    busy.value = false;
  }
}

async function saveNote(): Promise<void> {
  try {
    await api.put(`/admin/bookings/${id}/note`, { note: adminNote.value });
    ui.success(t('sa05.noteSaved'));
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

const canConfirm = computed(() => booking.value?.status === 'PENDING');
const canCancel = computed(() => ['PENDING', 'CONFIRMED'].includes(booking.value?.status ?? ''));
const canIntake = computed(() => booking.value?.status === 'CONFIRMED');

/**
 * Xe da tiep nhan thi moi nut o tren deu tat: khong xac nhan, khong tiep nhan,
 * khong doi lich, khong huy — hang hanh dong rong tron, man hinh thanh ngo
 * cut. Tu luc nay viec nam o phieu dich vu, nen dua thang nguoi dung sang do.
 *
 * Khong con viec gi lam o day nua — it nhat cho mot duong quay ra.
 */
const noActions = computed(
  () => !canCancel.value && !canConfirm.value && !canIntake.value && !openOrder.value,
);

const estimatedTotal = computed(() =>
  (booking.value?.services ?? []).reduce((sum, line) => sum + line.estimatedPrice, 0),
);

const historyEntries = computed(() =>
  (booking.value?.statusHistories ?? []).map((h) => ({
    id: h.id,
    createdAt: h.createdAt,
    actorType: h.actorType,
    action:
      h.action === 'RESCHEDULE'
        ? t('sa05.rescheduled') +
          (h.previousScheduledAt
            ? t('sa05.rescheduledFrom', { from: dateTime(h.previousScheduledAt) })
            : '')
        : `${h.fromStatus ? t(`status.${h.fromStatus}`) : t('sa05.createdLog')} → ${t(`status.${h.toStatus}`)}`,
    detail: h.note,
  })),
);

useHead({ title: () => `${t('sa05.headTitle', { code: booking.value?.code ?? '' })} — AOYAMA Admin` });
</script>

<template>
  <div v-if="booking" class="flex flex-col gap-[15px]">
    <!-- Ba the tom tat -->
    <div class="grid gap-[13px]" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))">
      <div class="card gap-1" style="background: #fff">
        <div class="card-kicker">{{ $t('sa03.colCustomer') }}</div>
        <p class="text-[14px] font-semibold">{{ booking.contactName }}</p>
        <p class="text-muted text-[12px]">
          {{ booking.contactPhone }}
          <template v-if="booking.contactEmail"> · {{ booking.contactEmail }}</template>
        </p>
        <p class="text-muted text-[12px]">
          {{ booking.createdByAdmin ? $t('sa05.byAdmin') : $t('sa05.bySelf') }}
        </p>
      </div>

      <div class="card gap-1" style="background: #fff">
        <div class="card-kicker">{{ $t('sa03.colVehicle') }}</div>
        <p class="text-[14px] font-semibold">
          <template v-if="booking.vehicle">
            {{ booking.vehicle.maker }} {{ booking.vehicle.model }}
          </template>
          <template v-else>{{ $t('common.notDeclared') }}</template>
        </p>
        <p v-if="booking.vehicle" class="text-muted text-[12px]">
          {{ booking.vehicle.plateNumber }}
          <template v-if="booking.vehicle.currentOdometer">
            · {{ number(booking.vehicle.currentOdometer) }} km
          </template>
        </p>
      </div>

      <div class="card gap-1" style="background: #fff">
        <div class="card-kicker">{{ $t('sa08.whenStore') }}</div>
        <p class="text-[14px] font-semibold">
          {{ dayLabel(booking.scheduledAt) }}
          {{ clock(booking.slotStartTime) }}–{{ clock(booking.slotEndTime) }}
        </p>
        <p class="text-muted text-[12px]">{{ i18n(booking.store?.name ?? null) }}</p>
      </div>
    </div>

    <div class="grid gap-[13px]" style="grid-template-columns: repeat(auto-fit, minmax(330px, 1fr))">
      <!-- Dich vu da dat -->
      <section class="card gap-2.5" style="background: #fff">
        <h5>{{ $t('sa08.bookedServices') }}</h5>
        <table class="table" style="min-width: 270px">
          <tbody>
            <tr v-for="line in booking.services ?? []" :key="line.id">
              <td>
                {{ line.serviceName }}
                <span class="text-muted">· {{ $t('common.minutesFull', { n: line.estimatedMinutes }) }}</span>
              </td>
              <td class="text-right">
                {{ line.estimatedPrice ? money(line.estimatedPrice) : $t('common.quotePrivate') }}
              </td>
            </tr>
          </tbody>
        </table>
        <div class="flex justify-between text-[13px]">
          <span class="text-muted">{{ $t('sa08.reference') }}</span>
          <strong>{{ money(estimatedTotal) }}</strong>
        </div>

        <div
          v-if="booking.symptomDescription"
          class="pt-2.5 text-[13px]"
          style="border-top: 1px solid var(--color-divider)"
        >
          <p class="text-muted mb-1 text-[11px]">{{ $t('sa07.symptom') }}</p>
          <p class="whitespace-pre-line">“{{ booking.symptomDescription }}”</p>
          <ul v-if="booking.symptomPhotoUrls.length" class="mt-2 flex flex-wrap gap-2">
            <li v-for="(url, index) in booking.symptomPhotoUrls" :key="index">
              <img :src="url" :alt="$t('sa05.photoAlt')" class="h-20 w-20 rounded-xl object-cover" />
            </li>
          </ul>

          <video
            v-if="booking.symptomVideoUrl"
            :src="booking.symptomVideoUrl"
            controls
            class="mt-2 w-full"
            style="border-radius: 16px; max-height: 240px"
          />
        </div>
      </section>

      <!-- Goi y AI -->
      <section
        v-if="diagnosis && diagnosis.findings.length"
        class="flex flex-col gap-[11px] p-4"
        style="
          border: 1.5px dashed var(--color-accent-2-400);
          background: var(--color-accent-2-100);
          border-radius: 26px;
        "
      >
        <div class="flex items-center gap-2">
          <span class="tag" style="background: var(--color-accent-2-500); color: #fff">
            {{ $t('ai.badgeShort') }}
          </span>
          <span class="text-[11px]" style="color: var(--color-accent-2-800)">
            {{ diagnosis.vehicleMaker }} {{ diagnosis.vehicleModel }}
          </span>
        </div>

        <div class="flex flex-col gap-2.5">
          <div v-for="(finding, index) in diagnosis.findings" :key="index">
            <div class="mb-1 flex justify-between text-[13px] font-semibold">
              <span>{{ finding.label }}</span>
              <span>{{ Math.round(finding.matchPercent) }} %</span>
            </div>
            <div
              style="height: 7px; border-radius: 999px; background: var(--color-accent-2-200)"
              role="progressbar"
              :aria-valuenow="Math.round(finding.matchPercent)"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="finding.label"
            >
              <div
                style="height: 100%; border-radius: 999px; background: var(--color-accent-2-600)"
                :style="{ width: `${Math.min(100, Math.max(0, finding.matchPercent))}%` }"
              />
            </div>
          </div>
        </div>

        <p class="text-[11.5px] leading-[1.45]" style="color: var(--color-accent-2-800)">
          {{ $t('sa08.aiNote') }}
        </p>
      </section>
    </div>

    <div class="grid gap-[13px]" style="grid-template-columns: repeat(auto-fit, minmax(330px, 1fr))">
      <section class="card gap-[7px]" style="background: #fff">
        <h5>{{ $t('sa05.internalNote') }}</h5>
        <textarea
          v-model="adminNote"
          class="input"
          style="min-height: 70px"
          :placeholder="$t('sa05.internalHint')"
        />
        <button
          type="button"
          class="btn btn-secondary self-end text-[12.5px]"
          @click="saveNote"
        >
          {{ $t('sa05.saveNote') }}
        </button>
      </section>

      <section v-if="(history?.items ?? []).length" class="card gap-2" style="background: #fff">
        <h5>{{ $t('sa05.vehicleHistory') }}</h5>
        <ul class="flex flex-col gap-1.5 text-[13.5px]">
          <li
            v-for="record in history?.items ?? []"
            :key="record.id"
            class="flex justify-between gap-3"
          >
            <span>{{ dateTime(record.servicedAt) }} · {{ record.summary }}</span>
            <span class="whitespace-nowrap">
              {{ money(record.totalAmount) }}
              <template v-if="record.odometer"> · {{ number(record.odometer) }} km</template>
            </span>
          </li>
        </ul>
      </section>

      <section class="card gap-2" style="background: #fff">
        <h5>{{ $t('sa05.changeLog') }}</h5>
        <AyChangeLog :entries="historyEntries" />
      </section>
    </div>

    <!-- Hang hanh dong -->
    <div
      class="flex flex-wrap items-center justify-end gap-2.5 pt-[15px]"
      style="border-top: 1px solid var(--color-divider)"
    >
      <NuxtLink
        v-if="canCancel"
        :to="`/admin/bookings/${id}/reschedule`"
        class="btn btn-secondary text-[13px]"
        style="min-height: 48px; padding-inline: 20px"
      >
        {{ $t('sa05.reschedule') }}
      </NuxtLink>
      <button
        v-if="booking.status === 'CONFIRMED'"
        type="button"
        class="btn btn-ghost text-[13px]"
        style="min-height: 48px"
        @click="confirmAction = 'NO_SHOW'"
      >
        {{ $t('sa05.noShow') }}
      </button>
      <button
        v-if="canCancel"
        type="button"
        class="btn btn-secondary text-[13px]"
        style="min-height: 48px; padding-inline: 20px"
        @click="confirmAction = 'CANCEL'"
      >
        {{ $t('sa05.cancel') }}
      </button>
      <button
        v-if="canConfirm"
        type="button"
        class="btn btn-primary text-[15px]"
        style="min-height: 48px; padding-inline: 26px"
        @click="confirmAction = 'CONFIRM'"
      >
        {{ $t('sa05.confirm') }}
      </button>
      <NuxtLink
        v-if="canIntake"
        :to="`/admin/work-orders/intake?bookingId=${booking.id}`"
        class="btn btn-primary text-[15px]"
        style="min-height: 48px; padding-inline: 26px"
      >
        {{ $t('sa05.intake') }}
      </NuxtLink>
      <NuxtLink
        v-if="openOrder"
        :to="`/admin/work-orders/${openOrder.id}`"
        class="btn btn-primary text-[15px]"
        style="min-height: 48px; padding-inline: 26px"
      >
        {{ $t('sa05.openOrder') }}
      </NuxtLink>
      <NuxtLink
        v-if="noActions"
        to="/admin/bookings"
        class="btn btn-secondary text-[13px]"
        style="min-height: 48px; padding-inline: 20px"
      >
        {{ $t('sa05.backToList') }}
      </NuxtLink>
    </div>

    <AyConfirmDialog
      :open="confirmAction !== null"
      :title="
        confirmAction === 'CONFIRM'
          ? $t('sa05.askConfirm')
          : confirmAction === 'CANCEL'
            ? $t('sa05.cancel')
            : $t('sa05.askNoShow')
      "
      :message="
        confirmAction === 'CONFIRM'
          ? $t('sa05.askConfirmBody')
          : confirmAction === 'CANCEL'
            ? $t('sa05.askCancelBody')
            : $t('sa05.askNoShowBody')
      "
      :danger="confirmAction !== 'CONFIRM'"
      :loading="busy"
      @confirm="act"
      @cancel="confirmAction = null"
    >
      <AyField v-if="confirmAction === 'CANCEL'" :label="$t('sc24.reasonLabel')" class="mt-3">
        <template #default="{ id: fieldId }">
          <input :id="fieldId" v-model="cancelReason" class="input" type="text" />
        </template>
      </AyField>
    </AyConfirmDialog>
  </div>
</template>

<style scoped>
.ay-doc {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-radius: 20px;
  background: var(--color-neutral-100);
  padding: 13px 15px;
  text-align: left;
  font-family: var(--font-body);
  color: var(--color-text);
}
.ay-doc:hover {
  background: var(--color-accent-100);
  text-decoration: none;
}
</style>
