<script setup lang="ts">
import type {
  ApiError,
  Part,
  Quotation,
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
const { t, locale } = useI18n();
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

/**
 * Ban bao gia dang co cua phieu nay — moi phieu chi co duy nhat mot ban.
 *
 * Khach yeu cau xem lai thi man nay phai mo ra dung nhung gi da gui di de
 * nhan vien sua, chu khong phai mot to trang bat ho go lai tu dau.
 */
const { data: existing } = await useAsyncData(`wo-quote-existing-${id}`, () =>
  api
    .get<Quotation[]>(`/admin/work-orders/${id}/quotations`)
    .then((list) => (Array.isArray(list) ? (list[0] ?? null) : null))
    .catch(() => null),
);

/** Hai dong chi mot thu khi cung tro ve mot dich vu, hoac cung ten. */
function sameLine(a: Partial<Line>, b: Partial<Line>): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'PART' && a.partId && b.partId) return a.partId === b.partId;
  if (a.serviceId && b.serviceId) return a.serviceId === b.serviceId;
  return (a.name ?? '').trim().toLowerCase() === (b.name ?? '').trim().toLowerCase();
}

/** Hang muc va phu tung dang ghi o buoc chan doan. */
function fromDiagnosis(): Line[] {
  return [
    ...(workOrder.value?.items ?? []).map<Line>((i) => ({
      kind: 'LABOR',
      name: i.name,
      description: i.description ?? undefined,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      isOptional: false,
      suggestedByAi: i.suggestedByAi,
      // Giu lai moi noi ve danh muc dich vu, neu khong bao gia chi con ten chu.
      serviceId: i.serviceId,
    })),
    ...(workOrder.value?.parts ?? []).map<Line>((p) => ({
      kind: 'PART',
      name: p.partName,
      unitPrice: p.unitPrice,
      quantity: p.quantity,
      isOptional: false,
      suggestedByAi: p.suggestedByAi,
      partId: p.partId,
    })),
  ];
}

/**
 * Ban bao gia cu lam goc, noi them hang muc chan doan chua co trong do.
 *
 * Nhan vien co the vua quay ra man chan doan them mot hang muc moi. Truoc
 * day hang muc do khong bao gio sang den day: he co mot ban bao gia la
 * man chi nhin ban do va bo qua han danh sach hang muc.
 *
 * Noi them chu khong ghi de — gia da sua, dong da them tay deu con nguyen,
 * va dong moi chi nam cho nhan vien xem lai roi bam luu.
 */
const lines = ref<Line[]>(
  existing.value
    ? (() => {
        const kept = (existing.value.items ?? []).map<Line>((i) => ({
          kind: (i.kind as Line['kind']) ?? 'LABOR',
          name: i.name,
          description: i.description ?? undefined,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          isOptional: false,
          suggestedByAi: i.suggestedByAi,
          serviceId: i.serviceId,
          partId: i.partId,
        }));
        const added = fromDiagnosis().filter((d) => !kept.some((k) => sameLine(k, d)));
        return [...kept, ...added];
      })()
    : fromDiagnosis(),
);

const discountAmount = ref(workOrder.value.discountAmount);
/**
 * Bao gia niem yet gia CHUA bao gom thue (SA-12). Thue duoc cong vao o buoc
 * thanh toan theo thue suat cua phieu, nen o day luon gui 0 — khong de may
 * chu roi ve thue suat mac dinh cua he thong.
 */
const QUOTE_TAX_RATE = 0;

/** O tim phu tung gap lai cho den khi nhan vien can den. */
const partPickerOpen = ref(false);
const validUntil = ref(defaultValidUntil());
const note = ref('');
/** SA-12 — bao gia co the yeu cau khach dat coc truoc khi bat tay vao viec. */
const requireDeposit = ref(false);
const depositAmount = ref(0);
const depositDueAt = ref('');
/**
 * Dang luu nao dang chay — de hai nut biet cai nao dang quay.
 * Truoc day la mot o tick "gui ngay" roi mot nut doi chu theo, nhan vien
 * phai doc lai nhan nut moi biet bam vao se gui hay khong.
 */
const savingMode = ref<'DRAFT' | 'SEND' | null>(null);
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

/**
 * Danh muc phu tung, chi nap khi can: goi y tra ve MA phu tung, con bao gia
 * phai luu ID thi kho moi tru duoc hang luc hoan tat phieu.
 */
const partsByCode = ref<Map<string, Part> | null>(null);

async function ensurePartsLoaded(): Promise<void> {
  if (partsByCode.value) return;
  try {
    const page = await api.get<{ items: Part[] }>('/admin/parts', {
      limit: 100,
      isActive: true,
    });
    partsByCode.value = new Map((page.items ?? []).map((p) => [p.code, p]));
  } catch {
    // Khong nap duoc thi van them dong duoc, chi la khong gan duoc ma phu tung.
    partsByCode.value = new Map();
  }
}

async function loadSuggestion(): Promise<void> {
  loadingSuggestion.value = true;
  try {
    // Ten hang muc goi y duoc chep thang vao bao gia gui khach, nen phai xin
    // may chu tra dung thu tieng nhan vien dang dung.
    const [found] = await Promise.all([
      api.get<QuotationSuggestion>(`/admin/ai/quotation-suggestion/${id}`, {
        lang: locale.value,
      }),
      ensurePartsLoaded(),
    ]);
    suggestion.value = found;
    if (found.isFallback) {
      ui.info(t('sa12.aiNone'), t('sa12.aiNoneSub'));
    }
  } catch {
    ui.warning(t('sa12.aiFailed'), t('sa12.aiFailedSub'));
  } finally {
    loadingSuggestion.value = false;
  }
}

/** Tach hai nhom de nhan vien doc duoc ngay cai nao la cong, cai nao la do. */
const suggestedLabor = computed(() =>
  (suggestion.value?.lines ?? []).filter((l) => l.kind === 'LABOR'),
);
const suggestedParts = computed(() =>
  (suggestion.value?.lines ?? []).filter((l) => l.kind === 'PART'),
);

const suggestionGroups = computed(() => [
  { key: 'LABOR', label: t('sa12.aiLabor'), lines: suggestedLabor.value },
  { key: 'PART', label: t('sa12.aiParts'), lines: suggestedParts.value },
]);

/** Da bam roi thi doi nut thanh "da them", tranh them trung hai lan. */
const acceptedCodes = ref<string[]>([]);
function isAccepted(line: QuotationSuggestion['lines'][number]): boolean {
  return !!line.code && acceptedCodes.value.includes(`${line.kind}:${line.code}`);
}

/** AI-02 — luon phai co nguoi duyet: goi y chi duoc them khi Admin bam. */
function acceptSuggestion(line: QuotationSuggestion['lines'][number]): void {
  if (isAccepted(line)) return;

  /**
   * Noi dong vua them ve danh muc that. Khong co buoc nay thi dong phu tung
   * la chu suong, kho khong biet duong tru hang khi phieu hoan tat.
   */
  const service =
    line.kind === 'LABOR' ? (services.value ?? []).find((s) => s.code === line.code) : undefined;
  const part = line.kind === 'PART' ? partsByCode.value?.get(line.code ?? '') : undefined;

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
      serviceId: service?.id ?? null,
      partId: part?.id ?? null,
    },
  ];
  if (line.code) acceptedCodes.value = [...acceptedCodes.value, `${line.kind}:${line.code}`];
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
const totalAmount = computed(() => Math.max(0, subtotal.value - discountAmount.value));

async function save(send: boolean): Promise<void> {
  if (lines.value.length === 0) {
    ui.warning(t('sa12.needLine'));
    return;
  }
  if (lines.value.some((l) => !l.name.trim())) {
    ui.warning(t('sa12.needLineName'));
    return;
  }

  savingMode.value = send ? 'SEND' : 'DRAFT';
  error.value = null;
  try {
    const created = await api.post<{ id: string; code: string }>(
      `/admin/work-orders/${id}/quotations`,
      {
        // fromCatalog chi phuc vu giao dien; may chu bat loi truong la.
        items: lines.value.map(({ fromCatalog, ...rest }) => rest),
        discountAmount: discountAmount.value,
        taxRate: QUOTE_TAX_RATE,
        validUntil: validUntil.value || undefined,
        depositAmount: requireDeposit.value ? depositAmount.value : undefined,
        depositDueAt:
          requireDeposit.value && depositDueAt.value ? depositDueAt.value : undefined,
        note: note.value || undefined,
        aiSuggestion: suggestion.value ?? undefined,
      },
    );

    if (send) {
      await api.put(`/admin/quotations/${created.id}/send`);
      ui.success(t('sa12.sent'), t('sa12.sentSub', { code: created.code }));
      await navigateTo(`/admin/work-orders/${id}/quote-confirm?quote=${created.id}`);
      return;
    }

    /**
     * Luu tam thi o lai chinh man nay. Nhan vien bam luu tam la vi con dang
     * soan do — day ho sang man khac roi bat quay lai la vo ich.
     */
    ui.success(t('sa12.draftSaved'), created.code);
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    savingMode.value = null;
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

    <!--
      Mot bieu mau bao gia duy nhat: hang muc, phu tung, tien nong va nut gui
      nam lien mach trong cung mot the. Truoc day bang hang muc la mot the
      rieng ben trai con phan tien o the khac ben phai, nhin nhu hai viec
      tach roi trong khi that ra chung la mot to bao gia.
    -->
    <div class="admin-two-col">
      <section class="card flex flex-col gap-3" style="background: #fff">
        <div class="flex flex-wrap items-center justify-end gap-1">
          <AyButton variant="ghost" size="sm" @click="addServiceLine">{{ $t('sa12.addService') }}</AyButton>
          <AyButton variant="ghost" size="sm" @click="addLine('OTHER')">{{ $t('sa12.addOther') }}</AyButton>
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
                  <!--
                    Khong gan nhan "Goi y boi AI" o day nua: dong da nam trong
                    bao gia tuc la nhan vien da duyet, no la hang muc cua cua
                    hang chu khong con la de xuat cua may. Co suggestedByAi
                    van duoc luu xuong de con thong ke do huu dung cua AI.
                  -->
                  <input v-else v-model="line.name" class="input h-9 min-h-0 py-1" type="text">
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

        <!--
          Them phu tung la viec thinh thoang moi lam, phan lon bao gia chi
          gom hang muc cong. De o tim mo san thi no chiem cho giua bieu mau
          va day phan tien xuong duoi tam nhin, nen gap lai cho den khi can.
        -->
        <div class="flex flex-col gap-1.5">
          <button
            type="button"
            class="flex items-center gap-1.5 self-start text-[12.5px] font-semibold"
            style="color: var(--color-accent)"
            :aria-expanded="partPickerOpen"
            @click="partPickerOpen = !partPickerOpen"
          >
            <span aria-hidden="true">{{ partPickerOpen ? '−' : '+' }}</span>
            {{ $t('sa12.addPart') }}
          </button>
          <AyPartPicker
            v-if="partPickerOpen"
            :store-id="workOrder.storeId"
            @select="addPart"
          />
        </div>

        <div class="flex flex-col gap-3 border-t border-divider pt-3">
          <div class="card-kicker">{{ $t('sa12.summary') }}</div>

          <div class="admin-grid">
            <AyField :label="$t('money.discount')">
              <template #default="{ id: fid }">
                <input :id="fid" v-model.number="discountAmount" class="input" type="number" min="0">
              </template>
            </AyField>

            <AyField :label="$t('sa12.validUntil')">
              <template #default="{ id: fid }">
                <input :id="fid" v-model="validUntil" class="input" type="date">
              </template>
            </AyField>
          </div>

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
                  <AyDateTimeField :id="fid" v-model="depositDueAt" />
                </template>
              </AyField>
            </div>
            <p v-if="requireDeposit" class="text-muted text-[12px]">
              {{ $t('sa12.remainingOnHandover', { amount: money(remainingOnHandover) }) }}
            </p>
          </div>

          <!-- O ghi chu keo het be rong bieu mau thi mot cau ngan nam lot
               thom giua mot dong dai, nen chan lai cho vua tam mat. -->
          <AyField :label="$t('sa12.noteToCustomer')" class="max-w-[520px]">
            <template #default="{ id: fid }">
              <textarea :id="fid" v-model="note" class="input min-h-[70px]" />
            </template>
          </AyField>

          <div class="border-t border-divider pt-3">
            <!--
              Bao gia niem yet gia chua thue; thue duoc cong vao luc thanh
              toan theo thue suat cua phieu. Khong hien dong thue o day de
              khach khong tuong tong cong nay la so cuoi cung phai tra.
            -->
            <AyMoneyTable
              :subtotal="subtotal"
              :discount-amount="discountAmount"
              :total-amount="totalAmount"
            />
            <p class="text-muted mt-1.5 text-[12px]">{{ $t('sa12.taxExcluded') }}</p>
          </div>

          <AyErrorNote :error="error" />

          <!--
            Hai nut thay cho o tick "gui ngay" cu: nhan vien nhin la biet
            bam vao se gui hay chi luu lai, khong phai doc nhan nut roi suy.
          -->
          <AyButton
            block
            variant="secondary"
            :loading="savingMode === 'DRAFT'"
            :disabled="savingMode !== null"
            @click="save(false)"
          >
            {{ $t('sa12.saveDraft') }}
          </AyButton>
          <AyButton
            block
            :loading="savingMode === 'SEND'"
            :disabled="savingMode !== null"
            @click="save(true)"
          >
            {{ $t('sa12.saveAndSend') }}
          </AyButton>
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

          <!--
            Hai nhom tach roi: cong tho mot ben, do phai thay mot ben. Nhan
            vien quet mat la biet bao gia nay gom nhung gi.
          -->
          <template v-for="group in suggestionGroups" :key="group.key">
            <div v-if="group.lines.length" class="flex flex-col gap-2">
              <div class="card-kicker" style="color: var(--color-accent-2-800)">
                {{ group.label }}
              </div>
              <div v-for="line in group.lines" :key="`${line.kind}:${line.code ?? line.name}`" class="ay-ai-line">
                <p class="text-[13.5px] font-semibold">{{ line.name }}</p>
                <p class="text-muted text-[11.5px]">
                  ~{{ money(line.unitPrice) }} × {{ line.quantity }}
                  <span v-if="line.reason" class="block">{{ $t('sa12.aiBecause', { reason: line.reason }) }}</span>
                </p>
                <button
                  type="button"
                  class="btn btn-secondary ay-ai-btn self-start text-[12.5px]"
                  :disabled="isAccepted(line)"
                  @click="acceptSuggestion(line)"
                >
                  {{ isAccepted(line) ? $t('sa12.aiAdded') : $t('sa12.aiUse') }}
                </button>
              </div>
            </div>
          </template>

          <!--
            Noi that voi nhan vien ket qua nay tu dau ra: bo luat tai cho hay
            mo hinh AI day du. Khong de ho tuong may da "hieu" nhieu hon thuc te.
          -->
          <p
            v-if="suggestion && suggestion.lines.length > 0 && suggestion.isRuleBased"
            class="text-[11px] leading-[1.45]"
            style="color: var(--color-accent-2-800)"
          >
            {{ $t('sa12.aiRuleBased') }}
          </p>
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
