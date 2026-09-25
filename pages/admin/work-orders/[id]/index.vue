<script setup lang="ts">
import type { ProgressStep } from '~/components/ui/AyProgressSteps.vue';
import type { Payment, Quotation, WorkOrder } from '~/types/models';
import { WORK_ORDER_FLOW, WorkOrderStatus } from '~/types/enums';

/** SA-10 Chi tiet phieu dich vu — FR-WO-02, FR-WO-07..16. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { i18n, money, dateTime, number } = useFormat();

const id = route.params.id as string;

const { data: workOrder, refresh } = await useAsyncData(`wo-${id}`, () =>
  api.get<WorkOrder>(`/admin/work-orders/${id}`),
);
if (!workOrder.value) throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy phiếu' });

const { data: quotations, refresh: refreshQuotations } = await useAsyncData(`wo-quotes-${id}`, () =>
  api.get<Quotation[]>(`/admin/work-orders/${id}/quotations`),
);
const { data: payments, refresh: refreshPayments } = await useAsyncData(`wo-payments-${id}`, () =>
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
  DIAGNOSING: [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED],
  QUOTED: [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED],
  IN_PROGRESS: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED],
  COMPLETED: [WorkOrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

const LABELS: Record<string, string> = {
  DIAGNOSING: 'Bắt đầu chẩn đoán',
  IN_PROGRESS: 'Bắt đầu thực hiện',
  COMPLETED: 'Đánh dấu hoàn tất',
  DELIVERED: 'Bàn giao xe',
  CANCELLED: 'Hủy phiếu',
};

const nextStatuses = computed(() => TRANSITIONS[workOrder.value?.status ?? ''] ?? []);

const confirmMessage = computed(() => {
  switch (statusTarget.value) {
    case WorkOrderStatus.COMPLETED:
      return 'Phụ tùng sẽ bị trừ khỏi kho, lịch sử dịch vụ của xe được ghi lại và khách nhận SMS báo xe đã xong.';
    case WorkOrderStatus.DELIVERED:
      return 'Phiếu đóng lại và lịch hẹn liên quan chuyển sang hoàn tất.';
    case WorkOrderStatus.CANCELLED:
      return 'Phiếu bị hủy. Nếu đã trừ kho, phụ tùng sẽ được hoàn lại.';
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
    ui.success('Đã cập nhật trạng thái phiếu');
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
    ui.success('Đã cập nhật tiến độ', 'Khách xem được ngay trên trang theo dõi.');
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

const timelineEntries = computed(() =>
  (workOrder.value?.statusHistories ?? []).map((h) => ({
    id: h.id,
    createdAt: h.createdAt,
    actorType: 'ADMIN',
    action: `${h.fromStatus ?? 'Mở phiếu'} → ${h.toStatus}`,
    detail: h.note,
  })),
);

const activeQuotation = computed(
  () => (quotations.value ?? []).find((q) => q.status !== 'SUPERSEDED') ?? null,
);
const remaining = computed(() =>
  workOrder.value ? workOrder.value.totalAmount - workOrder.value.paidAmount : 0,
);

const WORK_ORDER_LABELS: Record<string, string> = {
  RECEIVED: 'Đã tiếp nhận',
  DIAGNOSING: 'Đã chẩn đoán',
  QUOTED: 'Đang báo giá',
  IN_PROGRESS: 'Đang tiến hành',
  COMPLETED: 'Đã xong',
  DELIVERED: 'Đã bàn giao',
  CANCELLED: 'Đã hủy',
};

/** CP-19 — moc tien do cua phieu, bo buoc bao gia khi phieu khong can bao gia. */
const progressSteps = computed<ProgressStep[]>(() => {
  const order = WORK_ORDER_FLOW.filter(
    (status) => status !== 'QUOTED' || (quotations.value ?? []).length > 0,
  );
  const current = order.indexOf(workOrder.value?.status ?? 'RECEIVED');
  return order.map((status, index) => ({
    key: status,
    label: WORK_ORDER_LABELS[status],
    state: index < current ? 'done' : index === current ? 'current' : 'todo',
  }));
});

useHead({ title: `Phiếu ${workOrder.value.code} — AOYAMA Admin` });
</script>

<template>
  <div v-if="workOrder" class="flex flex-col gap-4">
    <AyPageHeader code="SA-10" :title="`Phiếu dịch vụ ${workOrder.code}`" back-to="/admin/work-orders">
      <template #actions>
        <AyStatusTag :status="workOrder.status" />
        <AyStatusTag :status="workOrder.paymentStatus" />
        <AyButton :to="`/admin/work-orders/${id}/items`" variant="secondary" size="sm">
          Chẩn đoán &amp; hạng mục
        </AyButton>
        <AyButton :to="`/admin/work-orders/${id}/quotation`" variant="secondary" size="sm">
          Lập báo giá
        </AyButton>
        <AyButton :to="`/admin/work-orders/${id}/payment`" variant="secondary" size="sm">
          Thanh toán
        </AyButton>
      </template>
    </AyPageHeader>

    <AyProgressSteps :steps="progressSteps" />

    <div class="flex flex-wrap gap-2">
      <AyButton
        v-for="status in nextStatuses" :key="status"
        :variant="status === 'CANCELLED' ? 'ghost' : 'primary'"
        size="sm"
        @click="statusTarget = status"
      >
        {{ LABELS[status] }}
      </AyButton>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <div class="flex flex-col gap-4 lg:col-span-2">
        <section class="card">
          <h2 class="mb-2 font-heading text-[16px]">Thông tin chung</h2>
          <dl class="grid gap-2 text-[14px] sm:grid-cols-2">
            <div><dt class="text-muted">Khách hàng</dt><dd>{{ workOrder.customer?.name }} · {{ workOrder.customer?.phone }}</dd></div>
            <div><dt class="text-muted">Cửa hàng</dt><dd>{{ i18n(workOrder.store?.name ?? null) }}</dd></div>
            <div><dt class="text-muted">Xe</dt><dd>{{ workOrder.vehicle?.plateNumber }} · {{ workOrder.vehicle?.maker }} {{ workOrder.vehicle?.model }}</dd></div>
            <div><dt class="text-muted">Số km khi nhận</dt><dd>{{ number(workOrder.intakeOdometer) }} km</dd></div>
            <div v-if="workOrder.bookingId">
              <dt class="text-muted">Lịch hẹn</dt>
              <dd><NuxtLink :to="`/admin/bookings/${workOrder.bookingId}`" class="underline">{{ workOrder.booking?.code }}</NuxtLink></dd>
            </div>
            <div><dt class="text-muted">Nhiên liệu khi nhận</dt><dd>{{ workOrder.intakeFuelLevel ?? '—' }}%</dd></div>
          </dl>
          <div v-if="workOrder.intakeNote" class="mt-3 border-t border-divider pt-3">
            <p class="text-[12.5px] text-muted">Ghi chú tiếp nhận</p>
            <p class="whitespace-pre-line text-[14px]">{{ workOrder.intakeNote }}</p>
          </div>
        </section>

        <section v-if="workOrder.customerSymptom || workOrder.diagnosisNote" class="card">
          <h2 class="mb-2 font-heading text-[16px]">Chẩn đoán</h2>
          <div v-if="workOrder.customerSymptom" class="mb-2">
            <p class="text-[12.5px] text-muted">Khách mô tả</p>
            <p class="whitespace-pre-line text-[14px]">{{ workOrder.customerSymptom }}</p>
          </div>
          <div v-if="workOrder.diagnosisNote">
            <p class="text-[12.5px] text-muted">Kỹ thuật viên</p>
            <p class="whitespace-pre-line text-[14px]">{{ workOrder.diagnosisNote }}</p>
          </div>
          <p v-if="workOrder.diagnosisCause" class="mt-2 text-[13.5px]">
            <span class="text-muted">Nguyên nhân: </span>{{ workOrder.diagnosisCause }}
          </p>
        </section>

        <section class="card">
          <h2 class="mb-2 font-heading text-[16px]">Hạng mục &amp; phụ tùng</h2>

          <AyEmptyState
            v-if="(workOrder.items ?? []).length === 0 && (workOrder.parts ?? []).length === 0"
            title="Chưa có hạng mục nào"
            hint="Vào màn hình chẩn đoán để thêm hạng mục công việc và phụ tùng."
          >
            <AyButton :to="`/admin/work-orders/${id}/items`" size="sm">Thêm hạng mục</AyButton>
          </AyEmptyState>

          <template v-else>
            <ul v-if="(workOrder.items ?? []).length" class="flex flex-col gap-1.5 text-[14px]">
              <li v-for="item in workOrder.items" :key="item.id" class="flex justify-between gap-3">
                <span>
                  {{ item.name }}
                  <template v-if="item.quantity > 1"> × {{ item.quantity }}</template>
                  <AyAiBadge v-if="item.suggestedByAi" class="ml-1" />
                </span>
                <span class="whitespace-nowrap">{{ money(item.unitPrice * item.quantity) }}</span>
              </li>
            </ul>

            <ul v-if="(workOrder.parts ?? []).length" class="mt-3 flex flex-col gap-1.5 border-t border-divider pt-3 text-[14px]">
              <li v-for="part in workOrder.parts" :key="part.id" class="flex justify-between gap-3">
                <span>{{ part.partName }}<template v-if="part.quantity > 1"> × {{ part.quantity }}</template></span>
                <span class="whitespace-nowrap">{{ money(part.unitPrice * part.quantity) }}</span>
              </li>
            </ul>
          </template>
        </section>

        <section class="card">
          <h2 class="mb-3 font-heading text-[16px]">Tiến độ hiển thị cho khách</h2>
          <div class="grid gap-3 sm:grid-cols-2">
            <AyField :label="`Hoàn thành ${progress.progressPercent}%`">
              <template #default="{ id: fid }">
                <input :id="fid" v-model.number="progress.progressPercent" class="w-full" type="range" min="0" max="100" step="5">
              </template>
            </AyField>
            <AyField label="Dự kiến xong">
              <template #default="{ id: fid }">
                <input :id="fid" v-model="progress.estimatedCompletionAt" class="input" type="datetime-local">
              </template>
            </AyField>
            <AyField label="Ghi chú tiến độ" class="sm:col-span-2" hint="Khách đọc được nội dung này">
              <template #default="{ id: fid }">
                <textarea :id="fid" v-model="progress.progressNote" class="input min-h-[70px]" />
              </template>
            </AyField>
          </div>
          <AyButton variant="secondary" size="sm" class="mt-2" @click="saveProgress">Cập nhật tiến độ</AyButton>
        </section>
      </div>

      <div class="flex flex-col gap-4">
        <section class="card">
          <h2 class="mb-2 font-heading text-[16px]">Chi phí</h2>
          <AyMoneyTable
            :labor-subtotal="workOrder.laborSubtotal"
            :parts-subtotal="workOrder.partsSubtotal"
            :discount-amount="workOrder.discountAmount"
            :tax-rate="workOrder.taxRate"
            :tax-amount="workOrder.taxAmount"
            :total-amount="workOrder.totalAmount"
            :paid-amount="workOrder.paidAmount"
          />
          <AyButton
            v-if="remaining > 0"
            :to="`/admin/work-orders/${id}/payment`" size="sm" block class="mt-3"
          >
            Ghi nhận thanh toán
          </AyButton>
        </section>

        <section class="card">
          <div class="mb-2 flex items-baseline justify-between">
            <h2 class="font-heading text-[16px]">Báo giá</h2>
            <NuxtLink :to="`/admin/work-orders/${id}/quotation`" class="btn btn-ghost text-[12.5px]">Lập mới</NuxtLink>
          </div>
          <AyEmptyState v-if="(quotations ?? []).length === 0" title="Chưa có báo giá" />
          <ul v-else class="flex flex-col gap-1.5 text-[13.5px]">
            <li v-for="q in quotations ?? []" :key="q.id" class="flex items-center justify-between gap-2">
              <NuxtLink :to="`/admin/quotations/${q.id}`" class="underline">Bản {{ q.version }}</NuxtLink>
              <AyStatusTag :status="q.status" />
              <span class="whitespace-nowrap">{{ money(q.totalAmount) }}</span>
            </li>
          </ul>
        </section>

        <section v-if="(workOrder.photos ?? []).length" class="card">
          <h2 class="mb-2 font-heading text-[16px]">Hình ảnh</h2>
          <ul class="grid grid-cols-3 gap-1.5">
            <li v-for="photo in workOrder.photos" :key="photo.id">
              <img :src="photo.url" :alt="photo.caption ?? ''" class="aspect-square w-full rounded-lg object-cover">
              <p class="mt-0.5 text-[10.5px] text-muted">{{ photo.stage }}</p>
            </li>
          </ul>
        </section>

        <section class="card">
          <h2 class="mb-3 font-heading text-[16px]">Nhật ký</h2>
          <AyChangeLog :entries="timelineEntries" />
        </section>
      </div>
    </div>

    <AyConfirmDialog
      :open="statusTarget !== null"
      :title="LABELS[statusTarget ?? ''] ?? 'Đổi trạng thái'"
      :message="confirmMessage"
      :danger="statusTarget === 'CANCELLED'"
      :loading="busy"
      @confirm="changeStatus"
      @cancel="statusTarget = null"
    >
      <AyField v-if="statusTarget === 'CANCELLED'" label="Lý do hủy" class="mt-3">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="statusNote" class="input" type="text">
        </template>
      </AyField>
    </AyConfirmDialog>
  </div>
</template>
