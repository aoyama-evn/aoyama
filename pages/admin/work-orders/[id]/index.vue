<script setup lang="ts">
import type { ProgressStep } from '~/components/ui/AyProgressSteps.vue';
import type { Payment, Quotation, WorkOrder } from '~/types/models';
import { WORK_ORDER_FLOW, WorkOrderStatus } from '~/types/enums';

/**
 * SA-10 Chi tiet phieu dich vu (va SA-10b khi phieu da ban giao) —
 * FR-WO-02, FR-WO-07..16.
 *
 * Ban thiet ke: ba the tom tat, the chan doan, hai cot hang muc va phu tung,
 * the tien tren nen mat the, hang hanh dong can phai duoi mot duong ke.
 */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { i18n, money, dateTime, number } = useFormat();

const id = route.params.id as string;

const { data: workOrder, refresh } = await useAsyncData(`wo-${id}`, () =>
  api.get<WorkOrder>(`/admin/work-orders/${id}`),
);
if (!workOrder.value) {
  throw createError({ statusCode: 404, statusMessage: t('sa10.notFound') });
}

setScreenTitle(() => t('sa10.title', { code: workOrder.value?.code ?? '' }));

const { data: quotations } = await useAsyncData(`wo-quotes-${id}`, () =>
  api.get<Quotation[]>(`/admin/work-orders/${id}/quotations`),
);
const { data: payments } = await useAsyncData(`wo-payments-${id}`, () =>
  api.get<Payment[]>(`/admin/work-orders/${id}/payments`),
);

const busy = ref(false);
const statusTarget = ref<WorkOrderStatus | null>(null);
const statusNote = ref('');
const progress = reactive({ progressPercent: 0, progressNote: '', estimatedCompletionAt: '' });

watchEffect(() => {
  if (!workOrder.value) return;
  progress.progressPercent = workOrder.value.progressPercent;
  progress.progressNote = workOrder.value.progressNote ?? '';
  progress.estimatedCompletionAt = workOrder.value.estimatedCompletionAt?.slice(0, 16) ?? '';
});

/** RD muc 5.2 — chi hien nhung buoc chuyen hop le tu trang thai hien tai. */
const TRANSITIONS: Record<string, WorkOrderStatus[]> = {
  RECEIVED: [WorkOrderStatus.DIAGNOSING, WorkOrderStatus.CANCELLED],
  // QUOTED bi bo sot o day nen tu man chan doan khong co nut nao chuyen sang
  // "Da bao gia", du may chu van cho phep — buoc bao gia trong ban thiet ke
  // (SA-12 → SA-12c) coi nhu bien mat khoi luong.
  DIAGNOSING: [WorkOrderStatus.QUOTED, WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED],
  QUOTED: [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED],
  IN_PROGRESS: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED],
  COMPLETED: [WorkOrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

/** Nhan cua nut chuyen trang thai; trang thai la khoa dung chung ba thu tieng. */
function actionLabel(status: string): string {
  return t(`sa10.act.${status}`);
}

/** Ten moc tien do cua phieu — khac nhan trang thai o cho no ke chuyen da xong. */
function flowLabel(status: string): string {
  return t(`sa10.flow.${status}`);
}

const nextStatuses = computed(() => TRANSITIONS[workOrder.value?.status ?? ''] ?? []);

const confirmMessage = computed(() => {
  switch (statusTarget.value) {
    case WorkOrderStatus.COMPLETED:
      return t('sa10.ask.COMPLETED');
    case WorkOrderStatus.DELIVERED:
      return t('sa10.ask.DELIVERED');
    case WorkOrderStatus.CANCELLED:
      return t('sa10.ask.CANCELLED');
    default:
      return undefined;
  }
});

async function changeStatus(): Promise<void> {
  if (!statusTarget.value) return;
  busy.value = true;
  try {
    await api.put(`/admin/work-orders/${id}/status`, {
      status: statusTarget.value,
      note: statusNote.value || undefined,
    });
    ui.success(t('sa10.statusSaved'));
    statusTarget.value = null;
    statusNote.value = '';
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    busy.value = false;
  }
}

async function saveProgress(): Promise<void> {
  try {
    await api.put(`/admin/work-orders/${id}/progress`, {
      progressPercent: progress.progressPercent,
      progressNote: progress.progressNote || undefined,
      estimatedCompletionAt: progress.estimatedCompletionAt || undefined,
    });
    ui.success(t('sa10.progressSaved'), t('sa10.progressSavedSub'));
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

const remaining = computed(() =>
  workOrder.value ? workOrder.value.totalAmount - workOrder.value.paidAmount : 0,
);

const deposit = computed(() => (payments.value ?? []).filter((p) => !p.isVoided)[0] ?? null);

const timelineEntries = computed(() =>
  (workOrder.value?.statusHistories ?? []).map((h) => ({
    id: h.id,
    createdAt: h.createdAt,
    actorType: 'ADMIN',
    action: `${h.fromStatus ? flowLabel(h.fromStatus) : t('sa10.opened')} → ${flowLabel(h.toStatus)}`,
    detail: h.note,
  })),
);

/** CP-19 — moc tien do cua phieu, bo buoc bao gia khi phieu khong can bao gia. */
const progressSteps = computed<ProgressStep[]>(() => {
  const order = WORK_ORDER_FLOW.filter(
    (status) => status !== 'QUOTED' || (quotations.value ?? []).length > 0,
  );
  const current = order.indexOf(workOrder.value?.status ?? 'RECEIVED');
  return order.map((status, index) => ({
    key: status,
    label: flowLabel(status),
    state: index < current ? 'done' : index === current ? 'current' : 'todo',
  }));
});

useHead({ title: () => `${t('sa10.headTitle', { code: workOrder.value?.code ?? '' })} — AOYAMA Admin` });
</script>

<template>
  <div v-if="workOrder" class="flex flex-col gap-[15px]">
    <!-- Ba the tom tat -->
    <div class="grid gap-[13px]" style="grid-template-columns: repeat(auto-fit, minmax(230px, 1fr))">
      <div class="card gap-1" style="background: #fff">
        <div class="card-kicker">{{ $t('sa10.summary1') }}</div>
        <p class="text-[13.5px]">
          {{ workOrder.customer?.name }} · {{ workOrder.customer?.phone }}
        </p>
        <p class="text-[13.5px]">
          {{ workOrder.vehicle?.maker }} {{ workOrder.vehicle?.model }} ·
          {{ workOrder.vehicle?.plateNumber }}
        </p>
        <p class="text-muted text-[12px]">
          {{ i18n(workOrder.store?.name ?? null) }}
          <template v-if="workOrder.booking">
            ·
            <NuxtLink :to="`/admin/bookings/${workOrder.bookingId}`">
              {{ workOrder.booking.code }}
            </NuxtLink>
          </template>
        </p>
      </div>

      <div class="card gap-1" style="background: #fff">
        <div class="card-kicker">{{ $t('sa10.summary2') }}</div>
        <p class="text-[13.5px]">
          {{ number(workOrder.intakeOdometer) }} km
          <template v-if="workOrder.intakeFuelLevel !== null">
            · {{ $t('sa10.fuelIs', { level: $t(`fuel.${workOrder.intakeFuelLevel}`) }) }}
          </template>
        </p>
        <p v-if="workOrder.intakeAccessories" class="text-muted text-[12px]">
          {{ workOrder.intakeAccessories }}
        </p>
        <p v-if="workOrder.intakeNote" class="text-muted text-[12px]">{{ workOrder.intakeNote }}</p>
      </div>

      <div class="card gap-1" style="background: #fff">
        <div class="card-kicker">{{ $t('sa10.technician') }}</div>
        <p class="text-[13.5px]">
          {{ workOrder.assignedTechnician?.fullName ?? $t('sa10.unassigned') }}
          <template v-if="workOrder.difficulty">
            · {{ $t('sa10.difficultyIs', { level: $t(`difficulty.${workOrder.difficulty}`) }) }}
          </template>
        </p>
        <p class="text-muted text-[12px]">
          {{ $t('sa10.openedAt', { at: dateTime(workOrder.createdAt) }) }}
        </p>
      </div>
    </div>

    <AyProgressSteps :steps="progressSteps" />

    <!-- Chan doan -->
    <section class="card gap-2.5" style="background: #fff">
      <div class="flex items-baseline justify-between gap-2.5">
        <h5>{{ $t('sa10.diagnosis') }}</h5>
        <NuxtLink :to="`/admin/work-orders/${id}/items`" class="btn btn-ghost text-[12.5px]">
          {{ $t('sa10.editItems') }}
        </NuxtLink>
      </div>
      <p v-if="workOrder.customerSymptom" class="text-[13.5px]">
        <strong>{{ $t('sa10.symptom') }}</strong> {{ workOrder.customerSymptom }}
      </p>
      <p v-if="workOrder.diagnosisNote" class="text-[13.5px]">
        <strong>{{ $t('sa10.finding') }}</strong> {{ workOrder.diagnosisNote }}
      </p>
      <p v-if="workOrder.diagnosisCause" class="text-[13.5px]">
        <strong>{{ $t('sa10.cause') }}</strong> {{ workOrder.diagnosisCause }}
      </p>
      <p
        v-if="!workOrder.customerSymptom && !workOrder.diagnosisNote && !workOrder.diagnosisCause"
        class="text-muted text-[12.5px]"
      >
        {{ $t('sa10.noDiagnosis') }}
      </p>
    </section>

    <!-- Hang muc va phu tung -->
    <div class="grid gap-[13px]" style="grid-template-columns: repeat(auto-fit, minmax(330px, 1fr))">
      <section class="card gap-2" style="background: #fff">
        <h5>{{ $t('sa10.items') }}</h5>
        <table v-if="(workOrder.items ?? []).length" class="table" style="min-width: 270px">
          <thead>
            <tr>
              <th>{{ $t('sa10.colItem') }}</th>
              <th>{{ $t('sa10.colTime') }}</th>
              <th class="text-right">{{ $t('sa10.colUnit') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in workOrder.items" :key="item.id">
              <td>
                {{ item.name }}
                <template v-if="item.quantity > 1"> × {{ item.quantity }}</template>
                <AyAiBadge v-if="item.suggestedByAi" class="ml-1" />
              </td>
              <td class="whitespace-nowrap">
                {{ item.laborMinutes ? $t('common.minutes', { n: item.laborMinutes }) : '—' }}
              </td>
              <td class="text-right">{{ money(item.unitPrice * item.quantity) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="text-muted text-[12.5px]">{{ $t('sa10.noItems') }}</p>
      </section>

      <section class="card gap-2" style="background: #fff">
        <h5>{{ $t('sa10.parts') }}</h5>
        <table v-if="(workOrder.parts ?? []).length" class="table" style="min-width: 270px">
          <thead>
            <tr>
              <th>{{ $t('sa10.colPart') }}</th>
              <th>{{ $t('sa10.colQty') }}</th>
              <th class="text-right">{{ $t('sa10.colUnit') }}</th>
              <th class="text-right">{{ $t('sa10.colAmount') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="part in workOrder.parts" :key="part.id">
              <td>
                {{ part.partName }}
                <span v-if="part.partCode" class="text-muted block text-[11px]">
                  {{ part.partCode }}
                </span>
              </td>
              <td>{{ part.quantity }}</td>
              <td class="text-right">{{ money(part.unitPrice) }}</td>
              <td class="text-right">{{ money(part.unitPrice * part.quantity) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="text-muted text-[12.5px]">{{ $t('sa10.noParts') }}</p>
      </section>
    </div>

    <!-- Tien -->
    <div class="flex flex-wrap items-stretch gap-[13px]">
      <section class="card min-w-[250px] flex-1 gap-1.5" style="background: var(--color-surface)">
        <div class="flex justify-between text-[13px]">
          <span class="text-muted">{{ $t('money.labor') }}</span><span>{{ money(workOrder.laborSubtotal) }}</span>
        </div>
        <div class="flex justify-between text-[13px]">
          <span class="text-muted">{{ $t('money.parts') }}</span><span>{{ money(workOrder.partsSubtotal) }}</span>
        </div>
        <div v-if="workOrder.discountAmount" class="flex justify-between text-[13px]">
          <span class="text-muted">{{ $t('money.discount') }}</span>
          <span>−{{ money(workOrder.discountAmount) }}</span>
        </div>
        <div class="flex justify-between text-[13px]">
          <span class="text-muted">{{ $t('money.taxRate', { rate: workOrder.taxRate }) }}</span>
          <span>{{ money(workOrder.taxAmount) }}</span>
        </div>
        <div
          class="flex items-baseline justify-between pt-2"
          style="border-top: 1px solid var(--color-divider)"
        >
          <strong>{{ $t('sa10.grandTotal') }}</strong>
          <span class="font-heading text-[21px]">{{ money(workOrder.totalAmount) }}</span>
        </div>
        <div v-if="deposit" class="flex justify-between text-[13px]">
          <span class="text-muted">
            {{ $t('sa10.collected') }}
            <span class="text-[11.5px]">({{ dateTime(deposit.paidAt) }})</span>
          </span>
          <span>{{ money(workOrder.paidAmount) }}</span>
        </div>
        <div class="flex items-baseline justify-between text-[13.5px]">
          <strong>{{ $t('sa10.remaining') }}</strong><strong>{{ money(remaining) }}</strong>
        </div>
      </section>

      <section class="card min-w-[250px] flex-1 gap-2" style="background: #fff">
        <div class="flex items-baseline justify-between">
          <h5>{{ $t('sa10.quotes') }}</h5>
          <NuxtLink
            :to="`/admin/work-orders/${id}/quotation`"
            class="btn btn-ghost text-[12.5px]"
          >
            {{ $t('sa10.newQuote') }}
          </NuxtLink>
        </div>
        <p v-if="(quotations ?? []).length === 0" class="text-muted text-[12.5px]">
          {{ $t('sa10.noQuotes') }}
        </p>
        <ul v-else class="flex flex-col gap-1.5 text-[13.5px]">
          <li
            v-for="quote in quotations ?? []"
            :key="quote.id"
            class="flex items-center justify-between gap-2"
          >
            <NuxtLink :to="`/admin/quotations/${quote.id}`">
              {{ quote.code }} · v{{ quote.version }}
            </NuxtLink>
            <span class="flex items-center gap-2">
              <AyStatusTag :status="quote.status" />
              <span class="whitespace-nowrap">{{ money(quote.totalAmount) }}</span>
            </span>
          </li>
        </ul>
      </section>
    </div>

    <!-- Tien do hien cho khach -->
    <section class="card gap-3" style="background: #fff">
      <h5>{{ $t('sa10.customerProgress') }}</h5>
      <div class="grid gap-3 sm:grid-cols-2">
        <AyField :label="$t('sa10.percentDone', { n: progress.progressPercent })">
          <template #default="{ id: fid }">
            <input
              :id="fid"
              v-model.number="progress.progressPercent"
              class="w-full"
              type="range"
              min="0"
              max="100"
              step="5"
            />
          </template>
        </AyField>
        <AyField :label="$t('sa10.eta')">
          <template #default="{ id: fid }">
            <input
              :id="fid"
              v-model="progress.estimatedCompletionAt"
              class="input"
              type="datetime-local"
            />
          </template>
        </AyField>
        <AyField :label="$t('sa10.progressNote')" class="sm:col-span-2" :hint="$t('sa10.progressNoteHint')">
          <template #default="{ id: fid }">
            <textarea :id="fid" v-model="progress.progressNote" class="input min-h-[70px]" />
          </template>
        </AyField>
      </div>
      <button type="button" class="btn btn-secondary self-start text-[12.5px]" @click="saveProgress">
        {{ $t('sa10.saveProgress') }}
      </button>
    </section>

    <section class="card gap-2" style="background: #fff">
      <h5>{{ $t('sa10.log') }}</h5>
      <AyChangeLog :entries="timelineEntries" />
    </section>

    <!-- Hang hanh dong -->
    <div
      class="flex flex-wrap items-center justify-end gap-2.5 pt-[15px]"
      style="border-top: 1px solid var(--color-divider)"
    >
      <NuxtLink
        v-if="remaining > 0"
        :to="`/admin/work-orders/${id}/payment`"
        class="btn btn-secondary text-[13px]"
        style="min-height: 48px; padding-inline: 20px"
      >
        {{ $t('sa10.recordPayment') }}
      </NuxtLink>
      <button
        v-for="status in nextStatuses"
        :key="status"
        type="button"
        class="btn"
        :class="status === 'CANCELLED' ? 'btn-ghost text-[13px]' : 'btn-primary text-[15px]'"
        style="min-height: 48px; padding-inline: 26px"
        @click="statusTarget = status"
      >
        {{ actionLabel(status) }}
      </button>
    </div>

    <AyConfirmDialog
      :open="statusTarget !== null"
      :title="$t('sa10.moveTo', { status: statusTarget ? flowLabel(statusTarget) : '' })"
      :message="confirmMessage"
      :danger="statusTarget === 'CANCELLED'"
      :loading="busy"
      @confirm="changeStatus"
      @cancel="statusTarget = null"
    >
      <AyField :label="$t('common.note')" class="mt-3">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="statusNote" class="input" type="text" />
        </template>
      </AyField>
    </AyConfirmDialog>
  </div>
</template>
