<script setup lang="ts">
import type { ApiError, Quotation, WorkOrder } from '~/types/models';

/**
 * SA-12c Chot bao gia — buoc giua SA-12 (lap bao gia) va SA-10 (chi tiet phieu).
 *
 * Ban thiet ke dat mot buoc rieng sau khi gui bao gia cho khach: nhan vien
 * doi khach dong y roi bam "Chot bao gia & bat dau sua" de phieu chuyen sang
 * dang sua. Ba lua chon o day dung nhu ban ve: sua lai bao gia, huy lich, hoac
 * chot va bat dau.
 */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { t } = useI18n();
const { money, dateTime } = useFormat();

const id = route.params.id as string;
/** SA-12 dan sang kem ma ban bao gia vua gui; khong co thi lay ban moi nhat. */
const quoteId = route.query.quote ? String(route.query.quote) : null;

const { data, refresh } = await useAsyncData(`quote-confirm-${id}-${quoteId ?? 'latest'}`, async () => {
  const [workOrder, quotations] = await Promise.all([
    api.get<WorkOrder>(`/admin/work-orders/${id}`),
    api.get<Quotation[]>(`/admin/work-orders/${id}/quotations`).catch(() => [] as Quotation[]),
  ]);
  const list = Array.isArray(quotations) ? quotations : [];
  const quotation = quoteId
    ? (list.find((q) => q.id === quoteId) ?? list[0] ?? null)
    : (list[0] ?? null);
  return { workOrder, quotation };
});

const workOrder = computed(() => data.value?.workOrder ?? null);
const quotation = computed(() => data.value?.quotation ?? null);

setScreenTitle(() => t('sa12c.title'));

const busy = ref(false);
const error = ref<ApiError | null>(null);
const confirmOpen = ref(false);

/** Chot bao gia = phieu bat dau duoc sua. */
async function startRepair(): Promise<void> {
  confirmOpen.value = false;
  busy.value = true;
  error.value = null;
  try {
    await api.put(`/admin/work-orders/${id}/status`, { status: 'IN_PROGRESS' });
    ui.success(t('sa12c.started'));
    await navigateTo(`/admin/work-orders/${id}`);
  } catch (caught) {
    error.value = normalizeError(caught);
    await refresh();
  } finally {
    busy.value = false;
  }
}

useHead({ title: () => `${t('sa12c.title')} — AOYAMA Admin` });
</script>

<template>
  <div v-if="workOrder" class="admin-stack gap-[15px]">
    <AyEmptyState v-if="!quotation" :title="$t('sa12c.noQuote')" :hint="$t('sa12c.noQuoteHint')">
      <NuxtLink :to="`/admin/work-orders/${id}/quotation`" class="btn btn-primary text-[12.5px]">
        {{ $t('sa12.headTitle') }}
      </NuxtLink>
    </AyEmptyState>

    <template v-else>
      <div
        class="grid gap-[13px]"
        style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))"
      >
        <div class="card gap-1" style="background: #fff">
          <div class="card-kicker">{{ $t('sa12c.quoteCode') }}</div>
          <p class="font-heading text-[16px]">{{ quotation.code }}</p>
          <p class="text-muted text-[12px]">{{ $t('sa12c.version', { n: quotation.version }) }}</p>
        </div>
        <div class="card gap-1" style="background: #fff">
          <div class="card-kicker">{{ $t('sa12c.sentAt') }}</div>
          <p class="text-[14px] font-semibold">
            {{ quotation.sentAt ? dateTime(quotation.sentAt) : $t('sa12c.notSent') }}
          </p>
          <AyStatusTag :status="quotation.status" />
        </div>
        <div class="card gap-1" style="background: #fff">
          <div class="card-kicker">{{ $t('sa12c.total') }}</div>
          <p class="font-heading text-[20px]">{{ money(quotation.totalAmount) }}</p>
          <p v-if="quotation.depositAmount" class="text-muted text-[12px]">
            {{ $t('sa12c.deposit', { amount: money(quotation.depositAmount) }) }}
          </p>
        </div>
      </div>

      <section class="card gap-2.5" style="background: #fff">
        <h5>{{ $t('sa12c.lines') }}</h5>
        <div class="table-wrap !shadow-none">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">{{ $t('sa12.colContent') }}</th>
                <th scope="col" class="w-20 text-center">{{ $t('sa10.colQty') }}</th>
                <th scope="col" class="w-28 text-right">{{ $t('sa10.colAmount') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="line in quotation.items ?? []" :key="line.id">
                <td>{{ line.name }}</td>
                <td class="text-center">{{ line.quantity }}</td>
                <td class="text-right">{{ money(line.unitPrice * line.quantity) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p class="text-[12.5px] leading-[1.55]" style="color: var(--color-neutral-700)">
        {{ $t('sa12c.lead') }}
      </p>

      <AyErrorNote :error="error" />

      <div class="flex flex-wrap items-center justify-end gap-2.5">
        <NuxtLink
          :to="`/admin/bookings/${workOrder.bookingId}`"
          class="btn btn-ghost text-[13px]"
          style="min-height: 48px; padding-inline: 16px"
        >
          {{ $t('sa12c.cancelBooking') }}
        </NuxtLink>
        <NuxtLink
          :to="`/admin/work-orders/${id}/quotation`"
          class="btn btn-secondary text-[13px]"
          style="min-height: 48px; padding-inline: 20px"
        >
          {{ $t('sa12c.editQuote') }}
        </NuxtLink>
        <button
          type="button"
          class="btn btn-primary text-[15px]"
          style="min-height: 48px; padding-inline: 26px"
          :disabled="busy"
          @click="confirmOpen = true"
        >
          {{ busy ? $t('common.saving') : $t('sa12c.startRepair') }}
        </button>
      </div>

      <AyConfirmDialog
        :open="confirmOpen"
        :title="$t('sa12c.askTitle')"
        :message="$t('sa12c.askBody')"
        :confirm-label="$t('sa12c.startRepair')"
        :cancel-label="$t('common.close')"
        :loading="busy"
        @confirm="startRepair"
        @cancel="confirmOpen = false"
      />
    </template>
  </div>
</template>
