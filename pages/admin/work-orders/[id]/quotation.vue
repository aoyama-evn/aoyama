<script setup lang="ts">
import type { ApiError, Part, QuotationSuggestion, WorkOrder } from '~/types/models';

/** SA-12 Lap bao gia co AI goi y — FR-QUO-01..06, FR-QUO-11, AI-02. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

interface Line {
  kind: 'LABOR' | 'PART' | 'OTHER';
  name: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  isOptional: boolean;
  suggestedByAi: boolean;
  partId?: string | null;
}

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { i18n, money } = useFormat();

const id = route.params.id as string;

const { data: workOrder } = await useAsyncData(`wo-quote-${id}`, () =>
  api.get<WorkOrder>(`/admin/work-orders/${id}`),
);
if (!workOrder.value) throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy phiếu' });

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
      ui.info('Trợ lý AI chưa có gợi ý', 'Bạn vẫn lập báo giá thủ công như bình thường.');
    }
  } catch {
    ui.warning('Không lấy được gợi ý AI', 'Chức năng lập báo giá vẫn dùng bình thường.');
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
    ui.warning('Báo giá cần ít nhất một dòng');
    return;
  }
  if (lines.value.some((l) => !l.name.trim())) {
    ui.warning('Còn dòng chưa có tên hạng mục');
    return;
  }

  saving.value = true;
  error.value = null;
  try {
    const created = await api.post<{ id: string; code: string }>(
      `/admin/work-orders/${id}/quotations`,
      {
        items: lines.value,
        discountAmount: discountAmount.value,
        taxRate: taxRate.value,
        validUntil: validUntil.value || undefined,
        note: note.value || undefined,
        aiSuggestion: suggestion.value ?? undefined,
      },
    );

    if (sendAfterSave.value) {
      await api.put(`/admin/quotations/${created.id}/send`);
      ui.success('Đã lập và gửi báo giá', `${created.code} — khách nhận SMS kèm đường dẫn xem báo giá.`);
    } else {
      ui.success('Đã lưu báo giá nháp', created.code);
    }
    await navigateTo(`/admin/work-orders/${id}`);
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    saving.value = false;
  }
}

useHead({ title: 'Lập báo giá — AOYAMA Admin' });
</script>

<template>
  <div v-if="workOrder" class="flex flex-col gap-4">
    <AyPageHeader
      code="SA-12" title="Lập báo giá" :back-to="`/admin/work-orders/${id}`"
      :description="`${workOrder.code} · ${workOrder.vehicle?.plateNumber} · ${workOrder.customer?.name}`"
    >
      <template #actions>
        <AyButton variant="secondary" size="sm" :loading="loadingSuggestion" @click="loadSuggestion">
          Lấy gợi ý AI
        </AyButton>
      </template>
    </AyPageHeader>

    <section v-if="suggestion && suggestion.lines.length" class="card">
      <div class="mb-2 flex items-center gap-2">
        <h2 class="font-heading text-[16px]">Gợi ý của trợ lý AI</h2>
        <AyAiBadge />
      </div>
      <p class="mb-2 text-[12.5px] text-muted">
        Đây là đề xuất. Bấm thêm từng dòng bạn đồng ý — không có gì tự động vào báo giá.
      </p>
      <ul class="flex flex-col gap-1.5">
        <li
          v-for="(line, index) in suggestion.lines" :key="index"
          class="flex items-center gap-3 rounded-xl bg-olive-100 px-3 py-2 text-[13.5px]"
        >
          <span class="flex-1">
            <strong>{{ line.name }}</strong>
            <span v-if="line.reason" class="block text-[12px] opacity-80">{{ line.reason }}</span>
          </span>
          <span class="whitespace-nowrap">{{ money(line.unitPrice) }} × {{ line.quantity }}</span>
          <AyButton size="sm" variant="secondary" @click="acceptSuggestion(line)">Thêm</AyButton>
        </li>
      </ul>
    </section>

    <div class="grid gap-4 lg:grid-cols-3">
      <section class="card lg:col-span-2">
        <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="font-heading text-[16px]">Các dòng báo giá</h2>
          <div class="flex gap-1">
            <AyButton variant="ghost" size="sm" @click="addLine('LABOR')">+ Tiền công</AyButton>
            <AyButton variant="ghost" size="sm" @click="addLine('OTHER')">+ Khác</AyButton>
          </div>
        </div>

        <div class="table-wrap !shadow-none">
          <table class="table">
            <thead>
              <tr>
                <th scope="col" class="w-24">Loại</th>
                <th scope="col">Nội dung</th>
                <th scope="col" class="w-28 text-right">Đơn giá</th>
                <th scope="col" class="w-16 text-center">SL</th>
                <th scope="col" class="w-20 text-center">Tùy chọn</th>
                <th scope="col" class="w-28 text-right">Thành tiền</th>
                <th scope="col" class="w-10" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="(line, index) in lines" :key="index">
                <td>
                  <select v-model="line.kind" class="input h-9 min-h-0 py-1 text-[12.5px]">
                    <option value="LABOR">Công</option>
                    <option value="PART">Phụ tùng</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </td>
                <td>
                  <input v-model="line.name" class="input h-9 min-h-0 py-1" type="text">
                  <AyAiBadge v-if="line.suggestedByAi" class="mt-1" />
                </td>
                <td><input v-model.number="line.unitPrice" class="input h-9 min-h-0 py-1 text-right" type="number" min="0"></td>
                <td><input v-model.number="line.quantity" class="input h-9 min-h-0 py-1 text-center" type="number" min="1"></td>
                <td class="text-center">
                  <input
                    v-model="line.isOptional" type="checkbox"
                    class="h-4 w-4 accent-[var(--color-accent)]"
                    :aria-label="`Hạng mục tùy chọn: ${line.name}`"
                  >
                </td>
                <td class="text-right whitespace-nowrap">{{ money(line.unitPrice * line.quantity) }}</td>
                <td>
                  <button type="button" class="text-danger" aria-label="Xóa dòng" @click="lines.splice(index, 1)">×</button>
                </td>
              </tr>
              <tr v-if="lines.length === 0">
                <td colspan="7" class="py-6 text-center text-muted">Chưa có dòng nào</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="mt-2 text-[12px] text-muted">
          Đánh dấu “Tùy chọn” cho hạng mục khách có thể bỏ khi phản hồi báo giá.
        </p>
      </section>

      <div class="flex flex-col gap-4">
        <section class="card">
          <h2 class="mb-2 font-heading text-[16px]">Thêm phụ tùng</h2>
          <AyPartPicker :store-id="workOrder.storeId" @select="addPart" />
        </section>

        <section class="card flex flex-col gap-3">
          <h2 class="font-heading text-[16px]">Tổng kết</h2>

          <AyField label="Giảm giá">
            <template #default="{ id: fid }">
              <input :id="fid" v-model.number="discountAmount" class="input" type="number" min="0">
            </template>
          </AyField>

          <AyField label="Thuế (%)">
            <template #default="{ id: fid }">
              <input :id="fid" v-model.number="taxRate" class="input" type="number" min="0" max="100">
            </template>
          </AyField>

          <AyField label="Hiệu lực đến">
            <template #default="{ id: fid }">
              <input :id="fid" v-model="validUntil" class="input" type="date">
            </template>
          </AyField>

          <AyField label="Ghi chú gửi khách">
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
            <span>Gửi ngay cho khách sau khi lưu (SMS kèm đường dẫn xem báo giá)</span>
          </label>

          <AyErrorNote :error="error" />

          <AyButton block :loading="saving" @click="save">
            {{ sendAfterSave ? 'Lưu và gửi báo giá' : 'Lưu nháp' }}
          </AyButton>
        </section>
      </div>
    </div>
  </div>
</template>
