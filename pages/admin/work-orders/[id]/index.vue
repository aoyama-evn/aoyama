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
const { i18n, money, dateTime, number } = useFormat();

const id = route.params.id as string;

const { data: workOrder, refresh } = await useAsyncData(`wo-${id}`, () =>
  api.get<WorkOrder>(`/admin/work-orders/${id}`),
);
if (!workOrder.value) throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy phiếu' });

setScreenTitle(() => `Phiếu dịch vụ ${workOrder.value?.code ?? ''}`);

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
  DIAGNOSING: [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED],
  QUOTED: [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED],
  IN_PROGRESS: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED],
  COMPLETED: [WorkOrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

const ACTION_LABELS: Record<string, string> = {
  DIAGNOSING: 'Bắt đầu chẩn đoán',
  IN_PROGRESS: 'Bắt đầu thực hiện',
  COMPLETED: 'Hoàn tất sửa chữa →',
  DELIVERED: 'Bàn giao xe →',
  CANCELLED: 'Hủy phiếu',
};

const WORK_ORDER_LABELS: Record<string, string> = {
  RECEIVED: 'Đã tiếp nhận',
  DIAGNOSING: 'Đã chẩn đoán',
  QUOTED: 'Đang báo giá',
  IN_PROGRESS: 'Đang tiến hành',
  COMPLETED: 'Đã xong',
  DELIVERED: 'Đã bàn giao',
  CANCELLED: 'Đã hủy',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
};

const FUEL_LABELS = ['Cạn', '1/4', '1/2', '3/4', 'Đầy'];

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

const remaining = computed(() =>
  workOrder.value ? workOrder.value.totalAmount - workOrder.value.paidAmount : 0,
);

const deposit = computed(() => (payments.value ?? []).filter((p) => !p.isVoided)[0] ?? null);

const timelineEntries = computed(() =>
  (workOrder.value?.statusHistories ?? []).map((h) => ({
    id: h.id,
    createdAt: h.createdAt,
    actorType: 'ADMIN',
    action: `${h.fromStatus ?? 'Mở phiếu'} → ${h.toStatus}`,
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
    label: WORK_ORDER_LABELS[status],
    state: index < current ? 'done' : index === current ? 'current' : 'todo',
  }));
});

useHead({ title: `Phiếu ${workOrder.value.code} — AOYAMA Admin` });
</script>

<template>
  <div v-if="workOrder" class="flex flex-col gap-[15px]">
    <!-- Ba the tom tat -->
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
        <p v-if="workOrder.intakeNote" class="text-muted text-[12px]">{{ workOrder.intakeNote }}</p>
      </div>

      <div class="card gap-1" style="background: #fff">
        <div class="card-kicker">Kỹ thuật viên</div>
        <p class="text-[13.5px]">
          {{ workOrder.assignedTechnician?.fullName ?? 'Chưa phân công' }}
          <template v-if="workOrder.difficulty">
            · mức độ khó: {{ DIFFICULTY_LABELS[workOrder.difficulty] }}
          </template>
        </p>
        <p class="text-muted text-[12px]">Mở phiếu {{ dateTime(workOrder.createdAt) }}</p>
      </div>
    </div>

    <AyProgressSteps :steps="progressSteps" />

    <!-- Chan doan -->
    <section class="card gap-2.5" style="background: #fff">
      <div class="flex items-baseline justify-between gap-2.5">
        <h5>Chẩn đoán kỹ thuật viên</h5>
        <NuxtLink :to="`/admin/work-orders/${id}/items`" class="btn btn-ghost text-[12.5px]">
          Sửa chẩn đoán &amp; hạng mục →
        </NuxtLink>
      </div>
      <p v-if="workOrder.customerSymptom" class="text-[13.5px]">
        <strong>Triệu chứng:</strong> {{ workOrder.customerSymptom }}
      </p>
      <p v-if="workOrder.diagnosisNote" class="text-[13.5px]">
        <strong>Ghi nhận:</strong> {{ workOrder.diagnosisNote }}
      </p>
      <p v-if="workOrder.diagnosisCause" class="text-[13.5px]">
        <strong>Nguyên nhân:</strong> {{ workOrder.diagnosisCause }}
      </p>
      <p
        v-if="!workOrder.customerSymptom && !workOrder.diagnosisNote && !workOrder.diagnosisCause"
        class="text-muted text-[12.5px]"
      >
        Chưa ghi chẩn đoán.
      </p>
    </section>

    <!-- Hang muc va phu tung -->
    <div class="grid gap-[13px]" style="grid-template-columns: repeat(auto-fit, minmax(330px, 1fr))">
      <section class="card gap-2" style="background: #fff">
        <h5>Hạng mục công việc</h5>
        <table v-if="(workOrder.items ?? []).length" class="table" style="min-width: 270px">
          <thead>
            <tr>
              <th>Hạng mục</th>
              <th>Thời gian</th>
              <th class="text-right">Đơn giá</th>
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
                {{ item.laborMinutes ? `${item.laborMinutes} mins` : '—' }}
              </td>
              <td class="text-right">{{ money(item.unitPrice * item.quantity) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="text-muted text-[12.5px]">Chưa có hạng mục nào.</p>
      </section>

      <section class="card gap-2" style="background: #fff">
        <h5>Phụ tùng</h5>
        <table v-if="(workOrder.parts ?? []).length" class="table" style="min-width: 270px">
          <thead>
            <tr>
              <th>Tên · mã</th>
              <th>SL</th>
              <th class="text-right">Đơn giá</th>
              <th class="text-right">Thành tiền</th>
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
        <p v-else class="text-muted text-[12.5px]">Chưa có phụ tùng nào.</p>
      </section>
    </div>

    <!-- Tien -->
    <div class="flex flex-wrap items-stretch gap-[13px]">
      <section class="card min-w-[250px] flex-1 gap-1.5" style="background: var(--color-surface)">
        <div class="flex justify-between text-[13px]">
          <span class="text-muted">Tiền công</span><span>{{ money(workOrder.laborSubtotal) }}</span>
        </div>
        <div class="flex justify-between text-[13px]">
          <span class="text-muted">Phụ tùng</span><span>{{ money(workOrder.partsSubtotal) }}</span>
        </div>
        <div v-if="workOrder.discountAmount" class="flex justify-between text-[13px]">
          <span class="text-muted">Giảm giá</span>
          <span>−{{ money(workOrder.discountAmount) }}</span>
        </div>
        <div class="flex justify-between text-[13px]">
          <span class="text-muted">Thuế {{ workOrder.taxRate }} %</span>
          <span>{{ money(workOrder.taxAmount) }}</span>
        </div>
        <div
          class="flex items-baseline justify-between pt-2"
          style="border-top: 1px solid var(--color-divider)"
        >
          <strong>TỔNG</strong>
          <span class="font-heading text-[21px]">{{ money(workOrder.totalAmount) }}</span>
        </div>
        <div v-if="deposit" class="flex justify-between text-[13px]">
          <span class="text-muted">
            Đã thu
            <span class="text-[11.5px]">({{ dateTime(deposit.paidAt) }})</span>
          </span>
          <span>{{ money(workOrder.paidAmount) }}</span>
        </div>
        <div class="flex items-baseline justify-between text-[13.5px]">
          <strong>Còn phải thu</strong><strong>{{ money(remaining) }}</strong>
        </div>
      </section>

      <section class="card min-w-[250px] flex-1 gap-2" style="background: #fff">
        <div class="flex items-baseline justify-between">
          <h5>Báo giá</h5>
          <NuxtLink
            :to="`/admin/work-orders/${id}/quotation`"
            class="btn btn-ghost text-[12.5px]"
          >
            Lập mới
          </NuxtLink>
        </div>
        <p v-if="(quotations ?? []).length === 0" class="text-muted text-[12.5px]">
          Chưa có báo giá.
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
      <h5>Tiến độ hiển thị cho khách</h5>
      <div class="grid gap-3 sm:grid-cols-2">
        <AyField :label="`Hoàn thành ${progress.progressPercent}%`">
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
        <AyField label="Dự kiến xong">
          <template #default="{ id: fid }">
            <input
              :id="fid"
              v-model="progress.estimatedCompletionAt"
              class="input"
              type="datetime-local"
            />
          </template>
        </AyField>
        <AyField label="Ghi chú tiến độ" class="sm:col-span-2" hint="Khách đọc được nội dung này">
          <template #default="{ id: fid }">
            <textarea :id="fid" v-model="progress.progressNote" class="input min-h-[70px]" />
          </template>
        </AyField>
      </div>
      <button type="button" class="btn btn-secondary self-start text-[12.5px]" @click="saveProgress">
        Cập nhật tiến độ
      </button>
    </section>

    <section class="card gap-2" style="background: #fff">
      <h5>Nhật ký phiếu</h5>
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
        Ghi nhận thanh toán
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
        {{ ACTION_LABELS[status] }}
      </button>
    </div>

    <AyConfirmDialog
      :open="statusTarget !== null"
      :title="`Chuyển phiếu sang: ${WORK_ORDER_LABELS[statusTarget ?? ''] ?? ''}`"
      :message="confirmMessage"
      :danger="statusTarget === 'CANCELLED'"
      :loading="busy"
      @confirm="changeStatus"
      @cancel="statusTarget = null"
    >
      <AyField label="Ghi chú" class="mt-3">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="statusNote" class="input" type="text" />
        </template>
      </AyField>
    </AyConfirmDialog>
  </div>
</template>
