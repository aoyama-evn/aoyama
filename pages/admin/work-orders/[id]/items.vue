<script setup lang="ts">
import type { ApiError, Part, ServiceItem, WorkOrder } from '~/types/models';

/** SA-11 Chan doan va hang muc cong viec — FR-WO-04, FR-WO-05, FR-WO-06. */
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
const { i18n, money } = useFormat();

const id = route.params.id as string;

const { data: workOrder } = await useAsyncData(`wo-items-${id}`, () =>
  api.get<WorkOrder>(`/admin/work-orders/${id}`),
);
if (!workOrder.value) throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy phiếu' });

const { data: services } = await useAsyncData('wo-items-services', () =>
  api.get<ServiceItem[]>('/services'),
);

const diagnosisNote = ref(workOrder.value.diagnosisNote ?? '');
const diagnosisCause = ref(workOrder.value.diagnosisCause ?? '');
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
    <AyPageHeader
      code="SA-11" title="Chẩn đoán &amp; hạng mục công việc"
      :back-to="`/admin/work-orders/${id}`"
      :description="`${workOrder.code} · ${workOrder.vehicle?.plateNumber} · ${workOrder.customer?.name}`"
    />

    <section class="ay-card grid gap-3 sm:grid-cols-2">
      <AyField label="Kết luận chẩn đoán" class="sm:col-span-2">
        <template #default="{ id: fid }">
          <textarea :id="fid" v-model="diagnosisNote" class="ay-input min-h-[90px]" placeholder="Mô tả tình trạng thực tế sau khi kiểm tra" />
        </template>
      </AyField>
      <AyField label="Nguyên nhân" class="sm:col-span-2">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="diagnosisCause" class="ay-input" type="text">
        </template>
      </AyField>
    </section>

    <div class="grid gap-4 lg:grid-cols-3">
      <section class="ay-card lg:col-span-2">
        <div class="mb-3 flex items-baseline justify-between">
          <h2 class="font-heading text-[16px]">Hạng mục công việc</h2>
          <AyButton variant="ghost" size="sm" @click="addFreeItem">+ Hạng mục tự do</AyButton>
        </div>

        <div class="ay-table-wrap !shadow-none">
          <table class="ay-table">
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
                  <input v-model="item.name" class="ay-input h-9 min-h-0 py-1" type="text">
                  <AyAiBadge v-if="item.suggestedByAi" class="mt-1" />
                </td>
                <td><input v-model.number="item.unitPrice" class="ay-input h-9 min-h-0 py-1 text-right" type="number" min="0"></td>
                <td><input v-model.number="item.quantity" class="ay-input h-9 min-h-0 py-1 text-center" type="number" min="1"></td>
                <td class="text-right whitespace-nowrap">{{ money(item.unitPrice * item.quantity) }}</td>
                <td>
                  <button type="button" class="text-danger" aria-label="Xóa hạng mục" @click="items.splice(index, 1)">×</button>
                </td>
              </tr>
              <tr v-if="items.length === 0">
                <td colspan="5" class="py-6 text-center ay-muted">Chưa có hạng mục nào</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-3">
          <p class="ay-label">Thêm nhanh từ danh mục dịch vụ</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="service in services ?? []" :key="service.id" type="button"
              class="ay-btn ay-btn-secondary ay-btn-sm"
              @click="addServiceItem(service)"
            >
              + {{ i18n(service.name) }}
            </button>
          </div>
        </div>
      </section>

      <section class="ay-card">
        <h2 class="mb-3 font-heading text-[16px]">Phụ tùng</h2>
        <AyPartPicker :store-id="workOrder.storeId" @select="addPart" />

        <ul v-if="parts.length" class="mt-3 flex flex-col gap-2 border-t border-divider pt-3">
          <li v-for="(part, index) in parts" :key="index" class="flex items-center gap-2 text-[13.5px]">
            <span class="min-w-0 flex-1">
              <span class="block truncate font-semibold">{{ part.partName }}</span>
              <span class="block text-[11.5px] ay-muted">
                {{ part.partCode }} · {{ money(part.unitPrice) }}
                <template v-if="part.available !== undefined"> · tồn {{ part.available }}</template>
              </span>
            </span>
            <input v-model.number="part.quantity" class="ay-input h-9 min-h-0 w-16 py-1 text-center" type="number" min="1">
            <button type="button" class="text-danger" aria-label="Xóa phụ tùng" @click="parts.splice(index, 1)">×</button>
          </li>
        </ul>

        <p v-if="overStock.length" class="mt-2 rounded-xl bg-warning-bg px-3 py-2 text-[12.5px] text-warning">
          {{ overStock.length }} phụ tùng vượt tồn kho hiện có. Nhập thêm kho trước khi hoàn tất phiếu.
        </p>
      </section>
    </div>

    <section class="ay-card flex flex-wrap items-center justify-between gap-3">
      <dl class="flex gap-6 text-[14px]">
        <div><dt class="ay-muted">Tiền công</dt><dd class="font-heading text-[17px]">{{ money(laborTotal) }}</dd></div>
        <div><dt class="ay-muted">Tiền phụ tùng</dt><dd class="font-heading text-[17px]">{{ money(partsTotal) }}</dd></div>
        <div><dt class="ay-muted">Tạm tính</dt><dd class="font-heading text-[17px]">{{ money(laborTotal + partsTotal) }}</dd></div>
      </dl>

      <div class="flex gap-2">
        <AyButton :loading="saving" @click="save">Lưu</AyButton>
        <AyButton :to="`/admin/work-orders/${id}`" variant="secondary">Hủy</AyButton>
      </div>
    </section>

    <AyErrorNote :error="error" />
  </div>
</template>
