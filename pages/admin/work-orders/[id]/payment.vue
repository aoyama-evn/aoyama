<script setup lang="ts">
import type { ApiError, WorkOrder } from '~/types/models';
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
const { t } = useI18n();
const { money, dateTime } = useFormat();

const id = route.params.id as string;

const { data: workOrder, refresh } = await useAsyncData(`wo-pay-${id}`, () =>
  api.get<WorkOrder>(`/admin/work-orders/${id}`),
);
if (!workOrder.value) {
  throw createError({ statusCode: 404, statusMessage: t('sa10.notFound') });
}

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

watchEffect(() => { form.amount = remaining.value > 0 ? remaining.value : 0; });

const METHODS = ['CASH', 'CARD_AT_STORE', 'BANK_TRANSFER', 'OTHER'];

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
    ui.success(t('sa14.handedOver'));
    await navigateTo(`/admin/work-orders/${id}/handover`);
  } catch (caught) {
    error.value = normalizeError(caught);
  } finally {
    saving.value = false;
  }
}

setScreenTitle(() => t('sa14.screenTitle'));

useHead({ title: () => `${t('sa14.headTitle')} — AOYAMA Admin` });
</script>

<template>
  <div v-if="workOrder" class="flex flex-col gap-3.5" style="max-width: 900px">
    <section class="card gap-1.5" style="background: var(--color-surface)">
      <div class="flex justify-between text-[13.5px]">
        <span class="text-muted">{{ $t('sa14.orderTotal') }}</span>
        <span>{{ money(workOrder.totalAmount) }}</span>
      </div>
      <div class="flex justify-between text-[13.5px]">
        <span class="text-muted">{{ $t('sa14.paidBefore') }}</span>
        <span>{{ money(workOrder.paidAmount) }}</span>
      </div>
      <div
        class="flex items-baseline justify-between pt-2"
        style="border-top: 1px solid var(--color-divider)"
      >
        <strong>{{ $t('sa10.remaining') }}</strong>
        <span class="font-heading text-[21px]">{{ money(remaining) }}</span>
      </div>
    </section>

    <section v-if="remaining > 0" class="card gap-3.5" style="background: #fff">
      <AyField :label="$t('sa14.method')" required>
        <div class="mt-1.5 flex flex-wrap gap-4">
          <label v-for="value in METHODS" :key="value" class="radio">
            <input v-model="form.method" type="radio" name="pay" :value="value" />
            <span class="dot" />
            {{ $t(`payMethod.${value}`) }}
          </label>
        </div>
      </AyField>

      <div class="grid gap-3" style="grid-template-columns: repeat(auto-fit, minmax(190px, 1fr))">
        <AyField :label="$t('sa14.amount')" required :hint="$t('sa14.amountHint', { amount: money(remaining) })">
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

        <AyField :label="$t('sa14.when')">
          <p class="py-1.5 text-[15px] font-semibold">{{ dateTime(new Date()) }}</p>
        </AyField>

        <AyField :label="$t('sa14.by')">
          <p class="py-1.5 text-[15px] font-semibold">{{ auth.user?.name ?? '—' }}</p>
        </AyField>
      </div>

      <AyField :label="$t('sa14.noteRef')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.note" class="input" type="text" placeholder="—" />
        </template>
      </AyField>

      <AyField :label="$t('sa14.receiptNo')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.receiptNo" class="input" type="text" />
        </template>
      </AyField>

      <AyErrorNote :error="error" />
    </section>

    <p v-else class="card text-center text-[14px] text-success" style="background: #fff">
      {{ $t('sa14.fullyPaid', { amount: money(workOrder.totalAmount) }) }}
    </p>

    <div class="flex flex-wrap items-center justify-end gap-2.5">
      <!-- Ve man cong viec: cho le tan vua di ra, de doi chieu lai truoc khi thu. -->
      <NuxtLink
        :to="`/admin/work-orders/${id}`"
        class="btn btn-secondary mr-auto text-[13px]"
        style="min-height: 48px; padding-inline: 20px"
      >
        {{ $t('common.back') }}
      </NuxtLink>
      <button
        type="button"
        class="btn btn-primary text-[15px]"
        style="min-height: 48px; padding-inline: 24px"
        :disabled="saving || workOrder.status !== 'COMPLETED'"
        :title="
          workOrder.status !== 'COMPLETED'
            ? $t('sa14.handoverBlocked')
            : undefined
        "
        @click="recordAndHandover"
      >
        {{ $t('sa14.recordAndHandover') }}
      </button>
    </div>

  </div>
</template>
