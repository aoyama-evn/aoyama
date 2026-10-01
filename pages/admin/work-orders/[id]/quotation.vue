<script setup lang="ts">
import type {
  ApiError,
  Part,
  QuotationSuggestion,
  ServiceItem,
  WorkOrder,
} from '~/types/models';

/** SA-12 Lap bao gia co AI goi y — FR-QUO-01..06, FR-QUO-11, AI-02. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

interface Line {
  kind: 'LABOR' | 'PART' | 'OTHER';
  name: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  /**
   * Da dua vao bao gia tuc la chot lam, nen khong con o danh dau "tuy chon"
   * tren man nua; truong nay luon false, giu lai de khong phai doi hop dong
   * voi may chu.
   */
  isOptional: boolean;
  suggestedByAi: boolean;
  partId?: string | null;
  serviceId?: string | null;
  /**
   * Dong vua them bang nut "Them hang muc": o noi dung la o chon trong danh
   * muc dich vu chu khong phai o go tay. Chi dung de ve giao dien — phai go
   * bo truoc khi gui len vi may chu khong nhan truong la.
   */
  fromCatalog?: boolean;
}

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { i18n, money } = useFormat();

const id = route.params.id as string;

const { data: workOrder } = await useAsyncData(`wo-quote-${id}`, () =>
  api.get<WorkOrder>(`/admin/work-orders/${id}`),
);

/** Danh muc dich vu de nhan vien chon hang muc thay vi go tay. */
const { data: services } = await useAsyncData('quote-services', () =>
  api.get<ServiceItem[]>('/services'),
);
if (!workOrder.value) {
  throw createError({ statusCode: 404, statusMessage: t('sa10.notFound') });
}

/** Khoi tao tu hang muc va phu tung da ghi o SA-11. */
const lines = ref<Line[]>([
  ...(workOrder.value.items ?? []).map<Line>((i) => ({
    kind: 'LABOR',
    name: i.name,
    description: i.description ?? undefined,
    unitPrice: i.unitPrice,
    quantity: i.quantity,
    isOptional: false,
    suggestedByAi: i.suggestedByAi,
  })),
  ...(workOrder.value.parts ?? []).map<Line>((p) => ({
    kind: 'PART',
    name: p.partName,
    unitPrice: p.unitPrice,
    quantity: p.quantity,
    isOptional: false,
    suggestedByAi: p.suggestedByAi,
    partId: p.partId,
  })),
]);

const discountAmount = ref(workOrder.value.discountAmount);
const taxRate = ref(workOrder.value.taxRate);
const validUntil = ref(defaultValidUntil());
const note = ref('');
/** SA-12 — bao gia co the yeu cau khach dat coc truoc khi bat tay vao viec. */
const requireDeposit = ref(false);
const depositAmount = ref(0);
const depositDueAt = ref('');
const saving = ref(false);
const sendAfterSave = ref(true);
const error = ref<ApiError | null>(null);

/** Bao gia mac dinh con hieu luc 7 ngay. */
function defaultValidUntil(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

// ---- AI-02 goi y ----
const suggestion = ref<QuotationSuggestion | null>(null);
const loadingSuggestion = ref(false);

async function loadSuggestion(): Promise<void> {
  loadingSuggestion.value = true;
  try {
    suggestion.value = await api.get<QuotationSuggestion>(`/admin/ai/quotation-suggestion/${id}`);
    if (suggestion.value.isFallback) {
      ui.info(t('sa12.aiNone'), t('sa12.aiNoneSub'));
    }
  } catch {
    ui.warning(t('sa12.aiFailed'), t('sa12.aiFailedSub'));
  } finally {
    loadingSuggestion.value = false;
  }
}

/** AI-02 — luon phai co nguoi duyet: goi y chi duoc them khi Admin bam. */
function acceptSuggestion(line: QuotationSuggestion['lines'][number]): void {
  lines.value = [
    ...lines.value,
    {
      kind: line.kind,
      name: line.name,
      description: line.reason,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      isOptional: false,
      suggestedByAi: true,
    },
  ];
}

function addLine(kind: Line['kind']): void {
  lines.value = [
    ...lines.value,
    { kind, name: '', unitPrice: 0, quantity: 1, isOptional: false, suggestedByAi: false },
  ];
}

/** Them mot dong de nhan vien chon hang muc tu danh muc dich vu. */
function addServiceLine(): void {
  lines.value = [
    ...lines.value,
    {
      kind: 'LABOR',
      name: '',
      unitPrice: 0,
      quantity: 1,
      isOptional: false,
      suggestedByAi: false,
      serviceId: null,
      fromCatalog: true,
    },
  ];
}

/** Chon hang muc thi dien luon ten va don gia theo bang gia dang ban. */
function pickService(line: Line, serviceId: string): void {
  const service = (services.value ?? []).find((s) => s.id === serviceId);
  line.serviceId = serviceId || null;
  if (!service) {
    line.name = '';
    line.unitPrice = 0;
    return;
  }
  line.name = i18n(service.name);
  line.unitPrice = service.quoteOnly ? 0 : service.basePrice;
}

function addPart(part: Part): void {
  lines.value = [
    ...lines.value,
    {
      kind: 'PART',
      name: i18n(part.name),
      unitPrice: part.sellPrice,
      quantity: 1,
      isOptional: false,
      suggestedByAi: false,
      partId: part.id,
    },
  ];
}

const subtotal = computed(() => lines.value.reduce((s, l) => s + l.unitPrice * l.quantity, 0));
const taxAmount = computed(() =>
  Math.floor((Math.max(0, subtotal.value - discountAmount.value) * taxRate.value) / 100),
);
const totalAmount = computed(
  () => Math.max(0, subtotal.value - discountAmount.value) + taxAmount.value,
);

async function save(): Promise<void> {
  if (lines.value.length === 0) {
    ui.warning(t('sa12.needLine'));
    return;
  }
  if (lines.value.some((l) => !l.name.trim())) {
    ui.warning(t('sa12.needLineName'));
    return;
  }

  saving.value = true;
  error.value = null;
  try {
    const created = await api.post<{ id: string; code: string }>(
      `/admin/work-orders/${id}/quotations`,
      {
        // fromCatalog chi phuc vu giao dien; may chu bat loi truong la.
        items: lines.value.map(({ fromCatalog, ...rest }) => rest),
        discountAmount: discountAmount.value,
        taxRate: taxRate.value,
        validUntil: validUntil.value || undefined,
        depositAmount: requireDeposit.value ? depositAmount.value : undefined,
        depositDueAt:
          requireDeposit.value && depositDueAt.value ? depositDueAt.value : undefined,
        note: note.value || undefined,
        aiSuggestion: suggestion.value ?? undefined,
      },
    );

    if (sendAfterSave.value) {
      await api.put(`/admin/quotations/${created.id}/send`);
      ui.success(t('sa12.sent'), t('sa12.sentSub', { code: created.code }));
    } else {
      ui.success(t('sa12.draftSaved'), created.code);
    }
    // Sang buoc chot bao gia; con la ban nhap thi ve man chi tiet phieu.
    await navigateTo(
      sendAfterSave.value
        ? `/admin/work-orders/${id}/quote-confirm?quote=${created.id}`
        : `/admin/work-orders/${id}`,
    );
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    saving.value = false;
  }
}

const remainingOnHandover = computed(() =>
  Math.max(0, totalAmount.value - (requireDeposit.value ? depositAmount.value : 0)),
);

setScreenTitle(() => t('sa12.screenTitle', { code: workOrder.value?.code ?? '' }));

useHead({ title: () => `${t('sa12.headTitle')} — AOYAMA Admin` });
</script>

<template>
  <div v-if="workOrder" class="flex flex-col gap-4">
    <AyPageHeader
      code="SA-12" :title="$t('sa12.headTitle')" :back-to="`/admin/work-orders/${id}/items`"
      :description="`${workOrder.code} · ${workOrder.vehicle?.plateNumber} · ${workOrder.customer?.name}`"
    >
      <template #actions>
        <AyButton variant="secondary" size="sm" :loading="loadingSuggestion" @click="loadSuggestion">
          {{ $t('sa12.getAi') }}
        </AyButton>
      </template>
    </AyPageHeader>

    <div
      class="grid items-start gap-3.5"
      style="grid-template-columns: repeat(auto-fit, minmax(330px, 1fr))"
    >
      <section class="card" style="background: #fff">
        <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="font-heading text-[16px]">{{ $t('sa12.lines') }}</h2>
          <div class="flex gap-1">
            <AyButton variant="ghost" size="sm" @click="addServiceLine">{{ $t('sa12.addService') }}</AyButton>
            <AyButton variant="ghost" size="sm" @click="addLine('OTHER')">{{ $t('sa12.addOther') }}</AyButton>
          </div>
        </div>

        <div class="table-wrap !shadow-none">
          <table class="table">
            <thead>
              <tr>
<!--
                  Be rong tung cot: o chon loai phai chua lot chu dai nhat
                  ("Phu tung" can 51px) cong dem va mui ten cua trinh duyet,
                  khong thi chu bi cat con "Phu t" va khong doc duoc dang chon
                  cai gi. Lay bot cho tu hai cot "Don gia" va "Tuy chon" nen
                  tong be rong bang khong doi.
                -->
                <th scope="col" class="w-28">{{ $t('sa12.colKind') }}</th>
                <th scope="col">{{ $t('sa12.colContent') }}</th>
                <th scope="col" class="w-24 text-right">{{ $t('sa10.colUnit') }}</th>
                <th scope="col" class="w-20 text-center">{{ $t('sa10.colQty') }}</th>
                <th scope="col" class="w-28 text-right">{{ $t('sa10.colAmount') }}</th>
                <th scope="col" class="w-10" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="(line, index) in lines" :key="index">
                <td>
                  <select
                    v-model="line.kind"
                    class="input h-9 min-h-0 py-1 text-[12.5px]"
                    style="padding-inline: 7px"
                  >
                    <option value="LABOR">{{ $t('sa12.kindLabor') }}</option>
                    <option value="PART">{{ $t('sa12.kindPart') }}</option>
                    <option value="OTHER">{{ $t('sa12.kindOther') }}</option>
                  </select>
                </td>
                <td>
                  <!-- Dong them bang nut "Them hang muc" thi chon trong danh
                       muc; cac dong khac van go tay duoc nhu cu. -->
                  <select
                    v-if="line.fromCatalog"
                    class="input h-9 min-h-0 py-1"
                    :value="line.serviceId ?? ''"
                    :aria-label="$t('sa12.pickService')"
                    @change="pickService(line, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="">{{ $t('sa12.pickService') }}</option>
                    <option v-for="item in services ?? []" :key="item.id" :value="item.id">
                      {{ i18n(item.name) }}
                    </option>
                  </select>
                  <input v-else v-model="line.name" class="input h-9 min-h-0 py-1" type="text">
                  <AyAiBadge v-if="line.suggestedByAi" class="mt-1" />
                </td>
                <td><input v-model.number="line.unitPrice" class="input h-9 min-h-0 py-1 text-right" type="number" min="0"></td>
                <td><input v-model.number="line.quantity" class="input h-9 min-h-0 py-1 text-center" type="number" min="1"></td>
                <td class="text-right whitespace-nowrap">{{ money(line.unitPrice * line.quantity) }}</td>
                <td>
                  <button type="button" class="text-danger" :aria-label="$t('sa12.removeLine')" @click="lines.splice(index, 1)">×</button>
                </td>
              </tr>
              <tr v-if="lines.length === 0">
                <td colspan="6" class="py-6 text-center text-muted">{{ $t('sa12.noLines') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="flex flex-col gap-3.5">
        <section class="ay-ai-card">
          <div>
            <span class="tag" style="background: var(--color-accent-2-500); color: #fff">
              {{ $t('ai.badgeShort') }}
            </span>
            <p class="mt-2 text-[11.5px]" style="color: var(--color-accent-2-800)">
              {{ $t('sa12.aiLead') }}
            </p>
          </div>

          <button
            v-if="!suggestion"
            type="button"
            class="btn btn-secondary ay-ai-btn self-start text-[12.5px]"
            :disabled="loadingSuggestion"
            @click="loadSuggestion"
          >
            {{ loadingSuggestion ? $t('sa12.gettingAi') : $t('sa12.getAi') }}
          </button>

          <p
            v-else-if="suggestion.lines.length === 0"
            class="text-[12.5px]"
            style="color: var(--color-accent-2-800)"
          >
            {{ $t('sa12.aiEmpty') }}
          </p>

          <div v-for="(line, index) in suggestion?.lines ?? []" :key="index" class="ay-ai-line">
            <p class="text-[13.5px] font-semibold">{{ line.name }}</p>
            <p class="text-muted text-[11.5px]">
              ~{{ money(line.unitPrice) }} × {{ line.quantity }}
              <span v-if="line.reason" class="block">{{ line.reason }}</span>
            </p>
            <button
              type="button"
              class="btn btn-secondary ay-ai-btn self-start text-[12.5px]"
              @click="acceptSuggestion(line)"
            >
              {{ $t('sa12.aiUse') }}
            </button>
          </div>
        </section>

        <section class="card gap-2" style="background: #fff">
          <h5>{{ $t('sa12.addPart') }}</h5>
          <AyPartPicker :store-id="workOrder.storeId" @select="addPart" />
        </section>

        <section class="card flex flex-col gap-3" style="background: #fff">
          <h5>{{ $t('sa12.summary') }}</h5>

          <AyField :label="$t('money.discount')">
            <template #default="{ id: fid }">
              <input :id="fid" v-model.number="discountAmount" class="input" type="number" min="0">
            </template>
          </AyField>

          <AyField :label="$t('sa12.taxPercent')">
            <template #default="{ id: fid }">
              <input :id="fid" v-model.number="taxRate" class="input" type="number" min="0" max="100">
            </template>
          </AyField>

          <div class="ay-deposit">
            <label class="flex cursor-pointer items-center gap-2.5 text-[13.5px] font-semibold">
              <input v-model="requireDeposit" type="checkbox" />
              {{ $t('sa12.requireDeposit') }}
            </label>
            <div
              v-if="requireDeposit"
              class="grid gap-2.5"
              style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))"
            >
              <AyField :label="$t('sa12.depositAmount')" required>
                <template #default="{ id: fid }">
                  <input
                    :id="fid"
                    v-model.number="depositAmount"
                    class="input"
                    type="number"
                    min="0"
                    :max="totalAmount"
                  />
                </template>
              </AyField>
              <AyField :label="$t('sa12.depositDue')">
                <template #default="{ id: fid }">
                  <input :id="fid" v-model="depositDueAt" class="input" type="datetime-local" />
                </template>
              </AyField>
            </div>
            <p v-if="requireDeposit" class="text-muted text-[12px]">
              {{ $t('sa12.remainingOnHandover', { amount: money(remainingOnHandover) }) }}
            </p>
          </div>

          <AyField :label="$t('sa12.validUntil')">
            <template #default="{ id: fid }">
              <input :id="fid" v-model="validUntil" class="input" type="date">
            </template>
          </AyField>

          <AyField :label="$t('sa12.noteToCustomer')">
            <template #default="{ id: fid }">
              <textarea :id="fid" v-model="note" class="input min-h-[70px]" />
            </template>
          </AyField>

          <div class="border-t border-divider pt-3">
            <AyMoneyTable
              :subtotal="subtotal"
              :discount-amount="discountAmount"
              :tax-rate="taxRate"
              :tax-amount="taxAmount"
              :total-amount="totalAmount"
            />
          </div>

          <label class="flex items-start gap-2.5 text-[13.5px]">
            <input v-model="sendAfterSave" type="checkbox" class="mt-1 h-4 w-4 accent-[var(--color-accent)]">
            <span>{{ $t('sa12.sendNow') }}</span>
          </label>

          <AyErrorNote :error="error" />

          <AyButton block :loading="saving" @click="save">
            {{ sendAfterSave ? $t('sa12.saveAndSend') : $t('sa12.saveDraft') }}
          </AyButton>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
/** Khung goi y AI: vien dut mau accent-2, giong SA-05 va SA-10a. */
.ay-ai-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1.5px dashed var(--color-accent-2-400);
  background: var(--color-accent-2-100);
  border-radius: 26px;
  padding: 16px;
}
.ay-ai-line {
  display: flex;
  flex-direction: column;
  gap: 7px;
  background: #fff;
  border-radius: 18px;
  padding: 12px;
}
.ay-ai-btn {
  border-color: var(--color-accent-2-500);
  color: var(--color-accent-2-800);
}

.ay-deposit {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1.5px solid var(--color-accent-200);
  border-radius: 20px;
  padding: 13px;
}
</style>
