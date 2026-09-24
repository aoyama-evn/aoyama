<script setup lang="ts">
import type { ApiError, Payment, WorkOrder } from '~/types/models';
import { PaymentMethod } from '~/types/enums';

/** SA-14 Ghi nhan thanh toan — FR-PAY-02..05, FR-PAY-08. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { money, dateTime } = useFormat();

const id = route.params.id as string;

const { data: workOrder, refresh } = await useAsyncData(`wo-pay-${id}`, () =>
  api.get<WorkOrder>(`/admin/work-orders/${id}`),
);
if (!workOrder.value) throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy phiếu' });

const { data: payments, refresh: refreshPayments } = await useAsyncData(`wo-pay-list-${id}`, () =>
  api.get<Payment[]>(`/admin/work-orders/${id}/payments`),
);

const remaining = computed(() =>
  workOrder.value ? workOrder.value.totalAmount - workOrder.value.paidAmount : 0,
);

const form = reactive({
  amount: 0,
  method: PaymentMethod.CASH as string,
  receiptNo: '',
  note: '',
});
const saving = ref(false);
const error = ref<ApiError | null>(null);
const voidTarget = ref<Payment | null>(null);
const voidReason = ref('');

watchEffect(() => { form.amount = remaining.value > 0 ? remaining.value : 0; });

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  CARD_AT_STORE: 'Thẻ tại quầy',
  BANK_TRANSFER: 'Chuyển khoản',
  OTHER: 'Khác',
};

async function record(): Promise<void> {
  saving.value = true;
  error.value = null;
  try {
    await api.post(`/admin/work-orders/${id}/payments`, {
      amount: form.amount,
      method: form.method,
      receiptNo: form.receiptNo || undefined,
      note: form.note || undefined,
    });
    ui.success('Đã ghi nhận thanh toán');
    form.receiptNo = '';
    form.note = '';
    await Promise.all([refresh(), refreshPayments()]);
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    saving.value = false;
  }
}

async function voidPayment(): Promise<void> {
  if (!voidTarget.value || !voidReason.value.trim()) return;
  try {
    await api.put(`/admin/work-orders/${id}/payments/${voidTarget.value.id}/void`, {
      reason: voidReason.value.trim(),
    });
    ui.success('Đã hủy dòng thanh toán');
    voidTarget.value = null;
    voidReason.value = '';
    await Promise.all([refresh(), refreshPayments()]);
  } catch (err) {
    ui.error(normalizeError(err).message);
  }
}

useHead({ title: 'Ghi nhận thanh toán — AOYAMA Admin' });
</script>

<template>
  <div v-if="workOrder" class="mx-auto flex max-w-3xl flex-col gap-4">
    <AyPageHeader
      code="SA-14" title="Ghi nhận thanh toán" :back-to="`/admin/work-orders/${id}`"
      :description="`${workOrder.code} · ${workOrder.customer?.name}`"
    >
      <template #actions>
        <AyStatusTag :status="workOrder.paymentStatus" />
      </template>
    </AyPageHeader>

    <section class="card">
      <AyMoneyTable
        :labor-subtotal="workOrder.laborSubtotal"
        :parts-subtotal="workOrder.partsSubtotal"
        :discount-amount="workOrder.discountAmount"
        :tax-rate="workOrder.taxRate"
        :tax-amount="workOrder.taxAmount"
        :total-amount="workOrder.totalAmount"
        :paid-amount="workOrder.paidAmount"
      />
    </section>

    <section v-if="remaining > 0" class="card grid gap-3 sm:grid-cols-2">
      <h2 class="font-heading text-[16px] sm:col-span-2">Thu tiền</h2>

      <AyField label="Số tiền" required :hint="`Còn phải thu ${money(remaining)}`">
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="form.amount" class="input" type="number" min="1" :max="remaining">
        </template>
      </AyField>

      <AyField label="Hình thức" required>
        <template #default="{ id: fid }">
          <select :id="fid" v-model="form.method" class="input">
            <option v-for="(label, value) in METHOD_LABELS" :key="value" :value="value">{{ label }}</option>
          </select>
        </template>
      </AyField>

      <AyField label="Số biên lai">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.receiptNo" class="input" type="text">
        </template>
      </AyField>

      <AyField label="Ghi chú">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.note" class="input" type="text">
        </template>
      </AyField>

      <div class="sm:col-span-2">
        <AyErrorNote :error="error" />
      </div>

      <div class="sm:col-span-2">
        <AyButton :loading="saving" :disabled="form.amount <= 0 || form.amount > remaining" @click="record">
          Ghi nhận {{ money(form.amount) }}
        </AyButton>
      </div>
    </section>

    <div v-else class="card text-center text-[14px] text-success">
      Phiếu đã thu đủ {{ money(workOrder.totalAmount) }}.
    </div>

    <section class="card">
      <h2 class="mb-3 font-heading text-[16px]">Các lần thu</h2>

      <AyEmptyState v-if="(payments ?? []).length === 0" title="Chưa có lần thu nào" />

      <ul v-else class="flex flex-col gap-2">
        <li
          v-for="payment in payments ?? []" :key="payment.id"
          class="flex flex-wrap items-center gap-3 border-b border-divider pb-2 text-[13.5px] last:border-0"
          :class="payment.isVoided ? 'opacity-55 line-through' : ''"
        >
          <span class="font-heading text-[15px]">{{ money(payment.amount) }}</span>
          <span class="text-muted">{{ METHOD_LABELS[payment.method] }}</span>
          <span class="text-muted">{{ dateTime(payment.paidAt) }}</span>
          <span v-if="payment.receiptNo" class="font-mono text-[12px]">#{{ payment.receiptNo }}</span>
          <span v-if="payment.isVoided" class="tag bg-neutral-200 text-neutral-600">đã hủy</span>
          <button
            v-else type="button" class="ml-auto text-[12.5px] text-danger underline"
            @click="voidTarget = payment"
          >
            Hủy dòng này
          </button>
        </li>
      </ul>
    </section>

    <AyConfirmDialog
      :open="Boolean(voidTarget)"
      title="Hủy dòng thanh toán"
      message="Dòng thu này sẽ được đánh dấu đã hủy và trừ khỏi số tiền đã thu. Bản ghi vẫn được giữ để đối soát."
      confirm-label="Hủy dòng thu"
      danger
      @confirm="voidPayment"
      @cancel="voidTarget = null"
    >
      <AyField label="Lý do hủy" required class="mt-3">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="voidReason" class="input" type="text">
        </template>
      </AyField>
    </AyConfirmDialog>
  </div>
</template>
