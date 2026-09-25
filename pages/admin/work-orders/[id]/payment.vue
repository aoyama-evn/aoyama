<script setup lang="ts">
import type { ApiError, Payment, WorkOrder } from '~/types/models';
import { PaymentMethod } from '~/types/enums';

/**
 * SA-14 Ghi nhan thanh toan — FR-PAY-02..05, FR-PAY-08.
 * Ban thiet ke: the tien tren nen mat the, the trang voi hang nut chon hinh
 * thuc thanh toan, va hai nut o cuoi — trong do nut chinh vua thu tien vua
 * ban giao xe.
 */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const auth = useAuthStore();
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

/** SA-14 — nut chinh vua ghi nhan thu tien vua chuyen phieu sang da ban giao. */
async function recordAndHandover(): Promise<void> {
  saving.value = true;
  error.value = null;
  try {
    if (form.amount > 0) {
      await api.post(`/admin/work-orders/${id}/payments`, {
        amount: form.amount,
        method: form.method,
        receiptNo: form.receiptNo || undefined,
        note: form.note || undefined,
      });
    }
    await api.put(`/admin/work-orders/${id}/status`, { status: 'DELIVERED' });
    ui.success('Đã ghi nhận thanh toán và bàn giao xe');
    await navigateTo(`/admin/work-orders/${id}`);
  } catch (caught) {
    error.value = normalizeError(caught);
  } finally {
    saving.value = false;
  }
}

setScreenTitle(() => `Thanh toán · ${workOrder.value?.code ?? ''}`);

useHead({ title: 'Ghi nhận thanh toán — AOYAMA Admin' });
</script>

<template>
  <div v-if="workOrder" class="flex flex-col gap-3.5" style="max-width: 900px">
    <section class="card gap-1.5" style="background: var(--color-surface)">
      <div class="flex justify-between text-[13.5px]">
        <span class="text-muted">Tổng tiền phiếu</span>
        <span>{{ money(workOrder.totalAmount) }}</span>
      </div>
      <div class="flex justify-between text-[13.5px]">
        <span class="text-muted">Đã thu trước đó</span>
        <span>{{ money(workOrder.paidAmount) }}</span>
      </div>
      <div
        class="flex items-baseline justify-between pt-2"
        style="border-top: 1px solid var(--color-divider)"
      >
        <strong>Còn phải thu</strong>
        <span class="font-heading text-[21px]">{{ money(remaining) }}</span>
      </div>
    </section>

    <section v-if="remaining > 0" class="card gap-3.5" style="background: #fff">
      <AyField label="Hình thức thanh toán" required>
        <div class="mt-1.5 flex flex-wrap gap-4">
          <label v-for="(label, value) in METHOD_LABELS" :key="value" class="radio">
            <input v-model="form.method" type="radio" name="pay" :value="value" />
            <span class="dot" />
            {{ label }}
          </label>
        </div>
      </AyField>

      <div class="grid gap-3" style="grid-template-columns: repeat(auto-fit, minmax(190px, 1fr))">
        <AyField label="Số tiền thực thu" required :hint="`tối đa ${money(remaining)}`">
          <template #default="{ id: fid }">
            <input
              :id="fid"
              v-model.number="form.amount"
              class="input"
              type="number"
              min="1"
              :max="remaining"
            />
          </template>
        </AyField>

        <AyField label="Thời điểm thu">
          <p class="py-1.5 text-[15px] font-semibold">{{ dateTime(new Date()) }}</p>
        </AyField>

        <AyField label="Người thu">
          <p class="py-1.5 text-[15px] font-semibold">{{ auth.user?.name ?? '—' }}</p>
        </AyField>
      </div>

      <AyField label="Ghi chú · số tham chiếu chuyển khoản">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.note" class="input" type="text" placeholder="—" />
        </template>
      </AyField>

      <AyField label="Số biên lai">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.receiptNo" class="input" type="text" />
        </template>
      </AyField>

      <AyErrorNote :error="error" />
    </section>

    <p v-else class="card text-center text-[14px] text-success" style="background: #fff">
      Phiếu đã thu đủ {{ money(workOrder.totalAmount) }}.
    </p>

    <section class="card gap-2" style="background: #fff">
      <h5>Các lần thu</h5>

      <AyEmptyState v-if="(payments ?? []).length === 0" title="Chưa có lần thu nào" />

      <ul v-else class="flex flex-col gap-2">
        <li
          v-for="payment in payments ?? []"
          :key="payment.id"
          class="flex flex-wrap items-center gap-3 pb-2 text-[13.5px]"
          style="border-bottom: 1px solid var(--color-divider)"
          :class="payment.isVoided ? 'line-through opacity-55' : ''"
        >
          <span class="font-heading text-[15px]">{{ money(payment.amount) }}</span>
          <span class="text-muted">{{ METHOD_LABELS[payment.method] }}</span>
          <span class="text-muted">{{ dateTime(payment.paidAt) }}</span>
          <span v-if="payment.receiptNo" class="font-mono text-[12px]">#{{ payment.receiptNo }}</span>
          <span v-if="payment.isVoided" class="tag tag-neutral">đã hủy</span>
          <button
            v-else
            type="button"
            class="ml-auto text-[12.5px] underline"
            style="color: var(--color-danger)"
            @click="voidTarget = payment"
          >
            Hủy dòng này
          </button>
        </li>
      </ul>
    </section>

    <div class="flex flex-wrap items-center justify-end gap-2.5">
      <NuxtLink
        :to="`/admin/work-orders/${id}`"
        class="btn btn-secondary text-[13px]"
        style="min-height: 48px; padding-inline: 20px"
      >
        Quay lại phiếu
      </NuxtLink>
      <button
        v-if="remaining > 0"
        type="button"
        class="btn btn-secondary text-[13px]"
        style="min-height: 48px; padding-inline: 20px"
        :disabled="saving || form.amount <= 0 || form.amount > remaining"
        @click="record"
      >
        Chỉ ghi nhận {{ money(form.amount) }}
      </button>
      <button
        type="button"
        class="btn btn-primary text-[15px]"
        style="min-height: 48px; padding-inline: 24px"
        :disabled="saving || workOrder.status !== 'COMPLETED'"
        :title="
          workOrder.status !== 'COMPLETED'
            ? 'Chỉ bàn giao được khi phiếu đã hoàn tất'
            : undefined
        "
        @click="recordAndHandover"
      >
        Ghi nhận thanh toán &amp; bàn giao
      </button>
    </div>

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
          <input :id="fid" v-model="voidReason" class="input" type="text" />
        </template>
      </AyField>
    </AyConfirmDialog>
  </div>
</template>
