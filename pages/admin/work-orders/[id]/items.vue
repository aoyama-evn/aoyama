<script setup lang="ts">
import type {
  AdminUser,
  AiDiagnosis,
  ApiError,
  Part,
  ServiceItem,
  WorkOrder,
} from '~/types/models';
import { WorkDifficulty } from '~/types/enums';

/**
 * SA-10a Chan doan va bao gia (SM-2026-001 goi la SA-11) —
 * FR-WO-04, FR-WO-05, FR-WO-06.
 *
 * Ban thiet ke: ba the tom tat o tren, roi hai cot — chan doan ky thuat vien
 * ben trai va khung doi chieu voi chan doan AI ben phai — sau do la bang hang
 * muc, bang phu tung, the tong du kien va hang hanh dong can phai.
 */
definePageMeta({ layout: 'admin', middleware: 'admin' });

interface ItemRow {
  serviceId?: string | null;
  name: string;
  description?: string | null;
  unitPrice: number;
  quantity: number;
  laborMinutes?: number | null;
  suggestedByAi?: boolean;
  isDone?: boolean;
}

interface PartRow {
  partId?: string | null;
  partName: string;
  partCode?: string | null;
  unitPrice: number;
  quantity: number;
  suggestedByAi?: boolean;
  available?: number;
}

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { i18n, money, number } = useFormat();

const id = route.params.id as string;

const { data: workOrder } = await useAsyncData(`wo-items-${id}`, () =>
  api.get<WorkOrder>(`/admin/work-orders/${id}`),
);
if (!workOrder.value) {
  throw createError({ statusCode: 404, statusMessage: t('sa10.notFound') });
}

const { data: services } = await useAsyncData('wo-items-services', () =>
  api.get<ServiceItem[]>('/services'),
);

// Buoc nay la luc dang lap phieu, chua phai luc tra cuu mot phieu da co —
// nen tieu de khong keo theo ma phieu.
setScreenTitle(() => t('sa11.headTitle'));

/** Danh sach ky thuat vien de phan cong — SA-10a. */
const { data: technicians } = await useAsyncData('wo-technicians', () =>
  api
    .get<{ items: AdminUser[] }>('/admin/users', { limit: 100 })
    .then((page) => page.items)
    .catch(() => []),
);

/** FR-AI-12 — doi chieu ket luan cua ky thuat vien voi du doan cua AI. */
const { data: diagnosis } = await useAsyncData(`wo-items-diag-${id}`, () =>
  workOrder.value?.booking?.aiDiagnosisId
    ? api.get<AiDiagnosis>(`/ai/diagnosis/sessions/${workOrder.value.booking.aiDiagnosisId}`)
    : Promise.resolve(null),
);

const diagnosisNote = ref(workOrder.value.diagnosisNote ?? '');
const diagnosisCause = ref(workOrder.value.diagnosisCause ?? '');
const difficulty = ref<WorkDifficulty>(workOrder.value.difficulty ?? WorkDifficulty.MEDIUM);
const technicianId = ref(workOrder.value.assignedTechnicianId ?? '');

const DIFFICULTIES = computed(() => [
  { value: WorkDifficulty.EASY, label: t('difficulty.EASY') },
  { value: WorkDifficulty.MEDIUM, label: t('difficulty.MEDIUM') },
  { value: WorkDifficulty.HARD, label: t('difficulty.HARD') },
]);
const items = ref<ItemRow[]>(
  (workOrder.value.items ?? []).map((i) => ({
    serviceId: i.serviceId,
    name: i.name,
    description: i.description,
    unitPrice: i.unitPrice,
    quantity: i.quantity,
    laborMinutes: i.laborMinutes,
    suggestedByAi: i.suggestedByAi,
    isDone: i.isDone,
  })),
);
const parts = ref<PartRow[]>(
  (workOrder.value.parts ?? []).map((p) => ({
    partId: p.partId,
    partName: p.partName,
    partCode: p.partCode,
    unitPrice: p.unitPrice,
    quantity: p.quantity,
    suggestedByAi: p.suggestedByAi,
  })),
);

const saving = ref(false);
const error = ref<ApiError | null>(null);

function addServiceItem(service: ServiceItem): void {
  items.value = [
    ...items.value,
    {
      serviceId: service.id,
      name: i18n(service.name),
      unitPrice: service.basePrice,
      quantity: 1,
      laborMinutes: service.durationMinutes,
    },
  ];
}

function addFreeItem(): void {
  items.value = [...items.value, { name: '', unitPrice: 0, quantity: 1 }];
}

function addPart(part: Part, available: number): void {
  const existing = parts.value.find((p) => p.partId === part.id);
  if (existing) {
    existing.quantity += 1;
    return;
  }
  parts.value = [
    ...parts.value,
    {
      partId: part.id,
      partName: i18n(part.name),
      partCode: part.code,
      unitPrice: part.sellPrice,
      quantity: 1,
      available,
    },
  ];
}

const laborTotal = computed(() =>
  items.value.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
);
const partsTotal = computed(() =>
  parts.value.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0),
);

/** Canh bao som khi so luong vuot ton kho — BR-42 se chan o buoc hoan tat phieu. */
const overStock = computed(() =>
  parts.value.filter((p) => p.available !== undefined && p.quantity > p.available),
);

async function save(): Promise<void> {
  if (items.value.some((i) => !i.name.trim())) {
    ui.warning(t('sa11.needName'));
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    await api.put(`/admin/work-orders/${id}/diagnosis`, {
      diagnosisNote: diagnosisNote.value || undefined,
      diagnosisCause: diagnosisCause.value || undefined,
      difficulty: difficulty.value,
      assignedTechnicianId: technicianId.value || undefined,
      items: items.value.map((i, index) => ({ ...i, sortOrder: index })),
      parts: parts.value.map(({ available, ...rest }) => rest),
    });
    ui.success(t('sa11.saved'));
    // "Luu va tao bao gia" — di thang sang buoc lap bao gia nhu ban thiet ke.
    await navigateTo(`/admin/work-orders/${id}/quotation`);
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    saving.value = false;
  }
}

useHead({ title: () => `${t('sa11.headTitle')} — AOYAMA Admin` });
</script>

<template>
  <div v-if="workOrder" class="flex flex-col gap-4">
    <h4>{{ $t('sa11.title') }}</h4>

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
        <p class="text-muted text-[12px]">{{ i18n(workOrder.store?.name ?? null) }}</p>
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
      </div>
    </div>

    <div
      class="grid items-start gap-[13px]"
      style="grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr)"
    >
      <section class="card gap-3" style="background: #fff">
        <h5>{{ $t('sa10.diagnosis') }}</h5>

        <AyField :label="$t('sa11.findingLabel')" required :hint="$t('sa11.findingHint')">
          <template #default="{ id: fid }">
            <textarea
              :id="fid"
              v-model="diagnosisNote"
              class="input"
              style="min-height: 72px"
              :placeholder="$t('sa11.findingPlaceholder')"
            />
          </template>
        </AyField>

        <AyField :label="$t('sa11.causeLabel')" required>
          <template #default="{ id: fid }">
            <textarea
              :id="fid"
              v-model="diagnosisCause"
              class="input"
              style="min-height: 72px"
            />
          </template>
        </AyField>

        <div class="grid gap-3" style="grid-template-columns: 1fr 1fr">
          <AyField :label="$t('sa11.difficulty')" required>
            <template #default="{ id: fid }">
              <select :id="fid" v-model="difficulty" class="input">
                <option v-for="level in DIFFICULTIES" :key="level.value" :value="level.value">
                  {{ level.label }}
                </option>
              </select>
            </template>
          </AyField>
          <AyField :label="$t('sa11.assignee')">
            <template #default="{ id: fid }">
              <select :id="fid" v-model="technicianId" class="input">
                <option value="">{{ $t('sa11.unassigned') }}</option>
                <option v-for="tech in technicians ?? []" :key="tech.id" :value="tech.id">
                  {{ tech.fullName }}
                </option>
              </select>
            </template>
          </AyField>
        </div>
      </section>

      <section class="ay-ai-card">
        <span class="tag self-start" style="background: var(--color-accent-2-500); color: #fff">
          {{ $t('sa11.aiCompare') }}
        </span>
        <p class="text-[12.5px] leading-[1.5]" style="color: var(--color-accent-2-800)">
          {{ $t('sa11.aiCompareLead') }}
        </p>

        <p
          v-if="!diagnosis || diagnosis.findings.length === 0"
          class="text-[12.5px]"
          style="color: var(--color-accent-2-800)"
        >
          {{ $t('sa11.noAi') }}
        </p>

        <div
          v-for="(finding, index) in diagnosis?.findings ?? []"
          :key="index"
          class="flex justify-between gap-2 text-[13px]"
          style="background: #fff; border-radius: 14px; padding: 9px 12px"
        >
          <span>{{ finding.label }} · {{ Math.round(finding.matchPercent) }} %</span>
          <span class="tag tag-neutral whitespace-nowrap">
            {{ index === 0 ? $t('sa11.aiMatch') : $t('sa11.aiUnconfirmed') }}
          </span>
        </div>
      </section>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <section class="card lg:col-span-2">
        <div class="mb-3 flex items-baseline justify-between">
          <h2 class="font-heading text-[16px]">{{ $t('sa10.items') }}</h2>
          <AyButton variant="ghost" size="sm" @click="addFreeItem">{{ $t('sa11.freeItem') }}</AyButton>
        </div>

        <div class="table-wrap !shadow-none">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">{{ $t('sa11.colName') }}</th>
                <th scope="col" class="w-28 text-right">{{ $t('sa10.colUnit') }}</th>
                <th scope="col" class="w-20 text-center">{{ $t('sa10.colQty') }}</th>
                <th scope="col" class="w-28 text-right">{{ $t('sa10.colAmount') }}</th>
                <th scope="col" class="w-12" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in items" :key="index">
                <td>
                  <input v-model="item.name" class="input h-9 min-h-0 py-1" type="text">
                  <AyAiBadge v-if="item.suggestedByAi" class="mt-1" />
                </td>
                <td><input v-model.number="item.unitPrice" class="input h-9 min-h-0 py-1 text-right" type="number" min="0"></td>
                <td><input v-model.number="item.quantity" class="input h-9 min-h-0 py-1 text-center" type="number" min="1"></td>
                <td class="text-right whitespace-nowrap">{{ money(item.unitPrice * item.quantity) }}</td>
                <td>
                  <button type="button" class="text-danger" :aria-label="$t('common.removeItem')" @click="items.splice(index, 1)">×</button>
                </td>
              </tr>
              <tr v-if="items.length === 0">
                <td colspan="5" class="py-6 text-center text-muted">{{ $t('sa11.noItems') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-3">
          <p class="label">{{ $t('sa11.quickAdd') }}</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="service in services ?? []" :key="service.id" type="button"
              class="btn btn-secondary text-[12.5px]"
              @click="addServiceItem(service)"
            >
              + {{ i18n(service.name) }}
            </button>
          </div>
        </div>
      </section>

      <section class="card">
        <h2 class="mb-3 font-heading text-[16px]">{{ $t('sa10.parts') }}</h2>
        <AyPartPicker :store-id="workOrder.storeId" @select="addPart" />

        <ul v-if="parts.length" class="mt-3 flex flex-col gap-2 border-t border-divider pt-3">
          <li v-for="(part, index) in parts" :key="index" class="flex items-center gap-2 text-[13.5px]">
            <span class="min-w-0 flex-1">
              <span class="block truncate font-semibold">{{ part.partName }}</span>
              <span class="block text-[11.5px] text-muted">
                {{ part.partCode }} · {{ money(part.unitPrice) }}
                <template v-if="part.available !== undefined">
                  · {{ $t('sa11.stockIs', { n: part.available }) }}
                </template>
              </span>
            </span>
            <input v-model.number="part.quantity" class="input h-9 min-h-0 w-16 py-1 text-center" type="number" min="1">
            <button type="button" class="text-danger" :aria-label="$t('sa11.removePart')" @click="parts.splice(index, 1)">×</button>
          </li>
        </ul>

        <p v-if="overStock.length" class="mt-2 rounded-xl bg-warning-bg px-3 py-2 text-[12.5px] text-warning">
          {{ $t('sa11.overStock', { n: overStock.length }) }}
        </p>
      </section>
    </div>

    <!-- Tong du kien: tung dong mot, so tien can phai, tong nam duoi vach ke -
         dung bo cuc ban thiet ke ve, thay vi ba con so ken nhau tren mot hang
         chung voi may cai nut. -->
    <section
      class="card gap-1.5"
      style="
        width: 100%;
        max-width: 360px;
        align-self: flex-end;
        background: var(--color-surface);
      "
    >
      <div class="flex justify-between text-[13px]">
        <span class="text-muted">{{ $t('money.labor') }}</span>
        <span>{{ money(laborTotal) }}</span>
      </div>
      <div class="flex justify-between text-[13px]">
        <span class="text-muted">{{ $t('money.parts') }}</span>
        <span>{{ money(partsTotal) }}</span>
      </div>
      <div
        class="flex items-baseline justify-between pt-2"
        style="border-top: 1px solid var(--color-divider)"
      >
        <strong class="text-[13px]">{{ $t('sa11.estTotal') }}</strong>
        <span class="font-heading text-[24px]">{{ money(laborTotal + partsTotal) }}</span>
      </div>
    </section>

    <div
      class="flex flex-wrap items-center justify-end gap-2.5 pt-[15px]"
      style="border-top: 1px solid var(--color-divider)"
    >
      <NuxtLink
        :to="`/admin/work-orders/${id}`"
        class="btn btn-secondary text-[13px]"
        style="min-height: 48px; padding-inline: 20px"
      >
        {{ $t('common.cancel') }}
      </NuxtLink>
      <button
        type="button"
        class="btn btn-primary text-[15px]"
        style="min-height: 48px; padding-inline: 26px"
        :disabled="saving"
        @click="save"
      >
        {{ saving ? $t('common.saving') : $t('sa11.saveAndQuote') }}
      </button>
    </div>

    <AyErrorNote :error="error" />
  </div>
</template>

<style scoped>
/** Khung doi chieu AI: vien dut mau accent-2, giong SA-05 va SA-12. */
.ay-ai-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1.5px dashed var(--color-accent-2-400);
  background: var(--color-accent-2-100);
  border-radius: 26px;
  padding: 15px;
}
</style>
