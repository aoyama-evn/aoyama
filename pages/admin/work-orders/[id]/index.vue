<script setup lang="ts">
import type { Payment, Quotation, WorkOrder } from '~/types/models';
import { WorkOrderStatus } from '~/types/enums';

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
const { t, te } = useI18n();
const { i18n, money, dateTime, number } = useFormat();

const id = route.params.id as string;

/**
 * Tien do tung hang muc — so tay cua tho.
 *
 * Doi thang, khong hoi lai: tho sua toi sua lui trong luc lam, hoi mot
 * cau moi lan thi thanh phien. Va con so nay khong day sang man khach
 * (xem getPublicProgress ben may chu), nen bam nham cung khong ai thay.
 */
const ITEM_STATES = ['PENDING', 'IN_PROGRESS', 'DONE'] as const;
const savingItem = ref<string | null>(null);

async function setItemState(itemId: string, state: string): Promise<void> {
  savingItem.value = itemId;
  try {
    await api.put(`/admin/work-orders/${id}/items/${itemId}/state`, { state });
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    savingItem.value = null;
  }
}

const { data: workOrder, refresh } = await useAsyncData(`wo-${id}`, () =>
  api.get<WorkOrder>(`/admin/work-orders/${id}`),
);
if (!workOrder.value) {
  throw createError({ statusCode: 404, statusMessage: t('sa10.notFound') });
}

/**
 * Man nay la cho tho doi chieu lai cong viec roi bao da xong, nen tieu de
 * goi dung viec do chu khong phai ten mot trang thai.
 */
setScreenTitle(() => t('sa10.screenTitle'));

/**
 * Gio du kien xong — con so duy nhat khach hoi den khi goi dien.
 *
 * Khach xem o man theo doi tien do (SC-26). O nhap datetime-local lam viec
 * bang gio may, nen cat bot phan giay cua chuoi ISO cho khop dinh dang no
 * doi, va gui lai nguyen van cho may chu.
 */
const eta = ref(workOrder.value.estimatedCompletionAt?.slice(0, 16) ?? '');
const savingEta = ref(false);

async function saveEta(): Promise<void> {
  savingEta.value = true;
  try {
    await api.put(`/admin/work-orders/${id}/progress`, {
      estimatedCompletionAt: eta.value || undefined,
    });
    ui.success(t('sa10.etaSaved'));
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    savingEta.value = false;
  }
}

const { data: quotations } = await useAsyncData(`wo-quotes-${id}`, () =>
  api.get<Quotation[]>(`/admin/work-orders/${id}/quotations`),
);
const { data: payments } = await useAsyncData(`wo-payments-${id}`, () =>
  api.get<Payment[]>(`/admin/work-orders/${id}/payments`),
);

const busy = ref(false);
const statusTarget = ref<WorkOrderStatus | null>(null);
const statusNote = ref('');
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

/**
 * Man nay chi co mot viec de bam: bao da xong.
 *
 * Huy cong viec la viec hiem va khong lui lai duoc, de lan vao canh nut
 * di tiep thi chi cho nguoi dang lam nhanh bam nham. Con ban giao thi
 * khong thuoc ve day: man thu tien (SA-14) vua ghi nhan tien vua chuyen
 * sang da ban giao trong cung mot nut.
 */
/**
 * Sua xong roi thi khong con sua chan doan hay lap bao gia moi duoc.
 *
 * Qua buoc "Da xong" la xe da lam xong, kho da tru, lich su xe da ghi va
 * khach da nhan tin. Sua chan doan hay ra mot ban bao gia moi luc nay chi
 * lam so sach noi mot dang con viec thuc te mot dang. May chu cung chan,
 * day chi la cat duong di cho ro.
 */
const CLOSED_STAGES: string[] = [
  WorkOrderStatus.COMPLETED,
  WorkOrderStatus.DELIVERED,
  WorkOrderStatus.CANCELLED,
];
const editable = computed(() => !CLOSED_STAGES.includes(workOrder.value?.status ?? ''));

const nextStatuses = computed(() =>
  (TRANSITIONS[workOrder.value?.status ?? ''] ?? []).filter(
    (status) => status === WorkOrderStatus.COMPLETED,
  ),
);

const confirmMessage = computed(() => {
  switch (statusTarget.value) {
    case WorkOrderStatus.COMPLETED:
      return t('sa10.ask.COMPLETED');
    case WorkOrderStatus.DELIVERED:
      return t('sa10.ask.DELIVERED');
    default:
      return undefined;
  }
});

async function changeStatus(): Promise<void> {
  if (!statusTarget.value) return;
  const moving = statusTarget.value;
  busy.value = true;
  try {
    await api.put(`/admin/work-orders/${id}/status`, {
      status: moving,
      note: statusNote.value || undefined,
    });
    ui.success(t('sa10.statusSaved'));
    statusTarget.value = null;
    statusNote.value = '';

    // Ban thiet ke: xong viec sua thi di thang sang buoc thu tien va ban giao,
    // con ban giao xong thi sang man xac nhan da ban giao.
    if (moving === WorkOrderStatus.COMPLETED) {
      await navigateTo(`/admin/work-orders/${id}/payment`);
      return;
    }
    if (moving === WorkOrderStatus.DELIVERED) {
      await navigateTo(`/admin/work-orders/${id}/handover`);
      return;
    }
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    busy.value = false;
  }
}

const remaining = computed(() =>
  workOrder.value ? workOrder.value.totalAmount - workOrder.value.paidAmount : 0,
);

const deposit = computed(() => (payments.value ?? []).filter((p) => !p.isVoided)[0] ?? null);

/**
 * Nhat ky ve ca chang di cua xe, khong chi doan tu luc mo ho so.
 *
 * Truoc day day chi la lich su trang thai cua ho so dich vu, nen dong dau
 * tien la "Mo ho so → Da tiep nhan" — nhan vien khong thay khach dat lich
 * luc nao, ai xac nhan va bao gio. Ba nguon gop lai thanh mot duong:
 *
 *   lich hen   -> Cho xac nhan, Da xac nhan
 *   ho so      -> Da tiep nhan, Da chan doan, Dang bao gia, Dang tien
 *                 hanh, Da xong, Da ban giao
 *   bao gia    -> Da chot bao gia (khong nam trong lich su nao ca)
 *
 * Moi buoc chi hien mot lan: lich hen va ho so cung ghi moc "Da tiep
 * nhan" o cung mot thoi diem, lay cai som hon.
 */
const timelineEntries = computed(() => {
  const stamps = new Map<string, { at: string; note: string | null }>();

  const add = (key: string, at: string, note: string | null): void => {
    const seen = stamps.get(key);
    if (!seen || at < seen.at) stamps.set(key, { at, note: note ?? seen?.note ?? null });
  };

  for (const h of workOrder.value?.booking?.statusHistories ?? []) {
    add(h.toStatus, h.createdAt, h.note ?? null);
  }
  for (const h of workOrder.value?.statusHistories ?? []) {
    add(h.toStatus, h.createdAt, h.note ?? null);
  }
  const accepted = (quotations.value ?? []).find((q) => q.status === 'ACCEPTED' && q.respondedAt);
  if (accepted?.respondedAt) add('QUOTE_ACCEPTED', accepted.respondedAt, null);

  return [...stamps.entries()]
    .sort((a, b) => a[1].at.localeCompare(b[1].at))
    .map(([key, stamp]) => ({
      id: key,
      createdAt: stamp.at,
      actorType: 'ADMIN',
      action: te(`flow.${key}`) ? t(`flow.${key}`) : key,
      detail: stamp.note,
    }));
});

/** CP-19 — moc tien do cua phieu, bo buoc bao gia khi phieu khong can bao gia. */
useHead({ title: () => `${t('sa10.headTitle', { code: workOrder.value?.code ?? '' })} — AOYAMA Admin` });
</script>

<template>
  <div v-if="workOrder" class="flex flex-col gap-[15px]">
    <!-- Hai the tom tat: khach - xe - cua hang, va hien trang khi tiep nhan -->
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

      <!--
        Gio du kien xong — con so duy nhat khach hoi den khi goi dien, va
        la thu ho thay o man theo doi tien do. De canh hai the kia de tho
        sua ngay, khong phai mo them man nao.
      -->
      <div class="card gap-1.5" style="background: #fff">
        <div class="card-kicker">{{ $t('sa10.eta') }}</div>
        <p v-if="workOrder.estimatedCompletionAt" class="text-[13.5px]">
          {{ dateTime(workOrder.estimatedCompletionAt) }}
        </p>
        <p v-else class="text-muted text-[12.5px]">{{ $t('sa10.etaNone') }}</p>
        <div v-if="editable" class="mt-0.5 flex flex-wrap items-center gap-2">
          <input
            v-model="eta"
            class="input h-9 min-h-0 flex-1 py-0 text-[12.5px]"
            style="min-width: 170px"
            type="datetime-local"
            :aria-label="$t('sa10.eta')"
          >
          <AyButton variant="secondary" size="sm" :loading="savingEta" @click="saveEta">
            {{ $t('common.save') }}
          </AyButton>
        </div>
      </div>
    </div>

    <!-- Chan doan -->
    <section class="card gap-2.5" style="background: #fff">
      <div class="flex items-baseline justify-between gap-2.5">
        <h5>{{ $t('sa10.diagnosis') }}</h5>
        <NuxtLink
          v-if="editable"
          :to="`/admin/work-orders/${id}/items`"
          class="btn btn-ghost text-[12.5px]"
        >
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
      <!-- Ban thiet ke ky ten nguoi kham ngay duoi ket qua chan doan. -->
      <p v-if="workOrder.diagnosedBy" class="text-muted text-[11.5px]">
        {{ $t('sa10.diagnosedBy', { name: workOrder.diagnosedBy.fullName }) }}
        <template v-if="workOrder.diagnosedAt"> · {{ dateTime(workOrder.diagnosedAt) }}</template>
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
              <th class="w-32">{{ $t('sa10.colItemState') }}</th>
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
              <td>
                <select
                  class="input h-8 min-h-0 py-0 text-[12px]"
                  :value="item.state"
                  :disabled="savingItem === item.id"
                  :aria-label="$t('sa10.itemStateFor', { name: item.name })"
                  @change="setItemState(item.id, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="st in ITEM_STATES" :key="st" :value="st">
                    {{ $t(`workItem.${st}`) }}
                  </option>
                </select>
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
            v-if="editable"
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

    <section class="card gap-2" style="background: #fff">
      <h5>{{ $t('sa10.log') }}</h5>
      <AyChangeLog :entries="timelineEntries" />
    </section>

    <!-- Hang hanh dong -->
    <div
      class="flex flex-wrap items-center justify-end gap-2.5 pt-[15px]"
      style="border-top: 1px solid var(--color-divider)"
    >
      <!--
        Bao da xong khi con dang lam. Da bao roi thi cho nay khong de
        trong: noi ro bao gio da xong va chi sang viec ke tiep la thu
        tien, de nguoi mo man khong phai doan vi sao khong co nut nao.
      -->
      <template v-if="workOrder.status === 'COMPLETED'">
        <span class="text-muted mr-auto text-[12.5px]">
          {{ $t('sa10.doneAt', { at: dateTime(workOrder.completedAt ?? '') }) }}
        </span>
        <NuxtLink
          :to="`/admin/work-orders/${id}/payment`"
          class="btn btn-primary text-[15px]"
          style="min-height: 48px; padding-inline: 26px"
        >
          {{ $t('sa10.goPayment') }}
        </NuxtLink>
      </template>
      <button
        v-for="status in nextStatuses"
        :key="status"
        type="button"
        class="btn btn-primary text-[15px]"
        style="min-height: 48px; padding-inline: 26px"
        @click="statusTarget = status"
      >
        {{ actionLabel(status) }}
      </button>
    </div>

    <AyConfirmDialog
      :open="statusTarget !== null"
      :title="$t('sa05.askDone')"
      :message="confirmMessage"
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
