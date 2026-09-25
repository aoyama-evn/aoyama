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
const { i18n, money, number } = useFormat();

const id = route.params.id as string;

const { data: workOrder } = await useAsyncData(`wo-items-${id}`, () =>
  api.get<WorkOrder>(`/admin/work-orders/${id}`),
);
if (!workOrder.value) throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy phiếu' });

const { data: services } = await useAsyncData('wo-items-services', () =>
  api.get<ServiceItem[]>('/services'),
);

setScreenTitle(() => `Chẩn đoán · ${workOrder.value?.code ?? ''}`);

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

const DIFFICULTIES = [
  { value: WorkDifficulty.EASY, label: 'Dễ' },
  { value: WorkDifficulty.MEDIUM, label: 'Trung bình' },
  { value: WorkDifficulty.HARD, label: 'Khó' },
];

const FUEL_LABELS = ['Cạn', '1/4', '1/2', '3/4', 'Đầy'];
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
    ui.warning('Còn hạng mục chưa có tên');
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
    ui.success('Đã lưu chẩn đoán và hạng mục');
    await navigateTo(`/admin/work-orders/${id}`);
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    saving.value = false;
  }
}

useHead({ title: 'Chẩn đoán & hạng mục — AOYAMA Admin' });
</script>

<template>
  <div v-if="workOrder" class="flex flex-col gap-4">
    <h4>Chẩn đoán và báo giá</h4>

    <div class="grid gap-[13px]" style="grid-template-columns: repeat(auto-fit, minmax(230px, 1fr))">
      <div class="card gap-1" style="background: #fff">
        <div class="card-kicker">Khách · xe · cửa hàng</div>
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
        <div class="card-kicker">Hiện trạng khi tiếp nhận</div>
        <p class="text-[13.5px]">
          {{ number(workOrder.intakeOdometer) }} km
          <template v-if="workOrder.intakeFuelLevel !== null">
            · nhiên liệu {{ FUEL_LABELS[workOrder.intakeFuelLevel] ?? workOrder.intakeFuelLevel }}
          </template>
        </p>
        <p v-if="workOrder.intakeAccessories" class="text-muted text-[12px]">
          {{ workOrder.intakeAccessories }}
        </p>
      </div>
      <div class="card gap-1" style="background: #fff">
        <div class="card-kicker">Phiếu</div>
        <p class="font-heading text-[16px]">{{ workOrder.code }}</p>
        <AyStatusTag :status="workOrder.status" />
      </div>
    </div>

    <div
      class="grid items-start gap-[13px]"
      style="grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr)"
    >
      <section class="card gap-3" style="background: #fff">
        <h5>Chẩn đoán kỹ thuật viên</h5>

        <AyField label="Triệu chứng ghi nhận" required hint="điền sẵn từ mô tả của khách">
          <template #default="{ id: fid }">
            <textarea
              :id="fid"
              v-model="diagnosisNote"
              class="input"
              style="min-height: 72px"
              placeholder="Mô tả tình trạng thực tế sau khi kiểm tra"
            />
          </template>
        </AyField>

        <AyField label="Nguyên nhân xác định" required>
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
          <AyField label="Mức độ khó" required>
            <template #default="{ id: fid }">
              <select :id="fid" v-model="difficulty" class="input">
                <option v-for="level in DIFFICULTIES" :key="level.value" :value="level.value">
                  {{ level.label }}
                </option>
              </select>
            </template>
          </AyField>
          <AyField label="Kỹ thuật viên phụ trách">
            <template #default="{ id: fid }">
              <select :id="fid" v-model="technicianId" class="input">
                <option value="">— Chưa phân công —</option>
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
          ✦ Đối chiếu chẩn đoán AI
        </span>
        <p class="text-[12.5px] leading-[1.5]" style="color: var(--color-accent-2-800)">
          So sánh dự đoán của AI (từ chatbox khách) với kết luận của kỹ thuật viên.
        </p>

        <p
          v-if="!diagnosis || diagnosis.findings.length === 0"
          class="text-[12.5px]"
          style="color: var(--color-accent-2-800)"
        >
          Lịch hẹn này không kèm phiên chẩn đoán AI.
        </p>

        <div
          v-for="(finding, index) in diagnosis?.findings ?? []"
          :key="index"
          class="flex justify-between gap-2 text-[13px]"
          style="background: #fff; border-radius: 14px; padding: 9px 12px"
        >
          <span>{{ finding.label }} · {{ Math.round(finding.matchPercent) }} %</span>
          <span class="tag tag-neutral whitespace-nowrap">
            {{ index === 0 ? 'khớp' : 'chưa xác nhận' }}
          </span>
        </div>
      </section>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <section class="card lg:col-span-2">
        <div class="mb-3 flex items-baseline justify-between">
          <h2 class="font-heading text-[16px]">Hạng mục công việc</h2>
          <AyButton variant="ghost" size="sm" @click="addFreeItem">+ Hạng mục tự do</AyButton>
        </div>

        <div class="table-wrap !shadow-none">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Tên hạng mục</th>
                <th scope="col" class="w-28 text-right">Đơn giá</th>
                <th scope="col" class="w-20 text-center">SL</th>
                <th scope="col" class="w-28 text-right">Thành tiền</th>
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
                  <button type="button" class="text-danger" aria-label="Xóa hạng mục" @click="items.splice(index, 1)">×</button>
                </td>
              </tr>
              <tr v-if="items.length === 0">
                <td colspan="5" class="py-6 text-center text-muted">Chưa có hạng mục nào</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-3">
          <p class="label">Thêm nhanh từ danh mục dịch vụ</p>
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
        <h2 class="mb-3 font-heading text-[16px]">Phụ tùng</h2>
        <AyPartPicker :store-id="workOrder.storeId" @select="addPart" />

        <ul v-if="parts.length" class="mt-3 flex flex-col gap-2 border-t border-divider pt-3">
          <li v-for="(part, index) in parts" :key="index" class="flex items-center gap-2 text-[13.5px]">
            <span class="min-w-0 flex-1">
              <span class="block truncate font-semibold">{{ part.partName }}</span>
              <span class="block text-[11.5px] text-muted">
                {{ part.partCode }} · {{ money(part.unitPrice) }}
                <template v-if="part.available !== undefined"> · tồn {{ part.available }}</template>
              </span>
            </span>
            <input v-model.number="part.quantity" class="input h-9 min-h-0 w-16 py-1 text-center" type="number" min="1">
            <button type="button" class="text-danger" aria-label="Xóa phụ tùng" @click="parts.splice(index, 1)">×</button>
          </li>
        </ul>

        <p v-if="overStock.length" class="mt-2 rounded-xl bg-warning-bg px-3 py-2 text-[12.5px] text-warning">
          {{ overStock.length }} phụ tùng vượt tồn kho hiện có. Nhập thêm kho trước khi hoàn tất phiếu.
        </p>
      </section>
    </div>

    <section class="card flex flex-wrap items-center justify-between gap-3">
      <dl class="flex gap-6 text-[14px]">
        <div><dt class="text-muted">Tiền công</dt><dd class="font-heading text-[17px]">{{ money(laborTotal) }}</dd></div>
        <div><dt class="text-muted">Tiền phụ tùng</dt><dd class="font-heading text-[17px]">{{ money(partsTotal) }}</dd></div>
        <div><dt class="text-muted">Tạm tính</dt><dd class="font-heading text-[17px]">{{ money(laborTotal + partsTotal) }}</dd></div>
      </dl>

      <div class="flex gap-2">
        <AyButton :loading="saving" @click="save">Lưu</AyButton>
        <AyButton :to="`/admin/work-orders/${id}`" variant="secondary">Hủy</AyButton>
      </div>
    </section>

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
