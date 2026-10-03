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
  /**
   * Ban duoc tro toi, tru khi no da bi thay the.
   *
   * SA-12 dan sang day kem ma ban vua gui nen binh thuong do la ban moi
   * nhat. Nhung neu nhan vien mo lai mot duong dan cu, ho se thay the dau
   * man ghi "Ban 1 — da tu choi" trong khi hang nut lai moi chot ban 4.
   * Luc do dua thang ho den ban dang co hieu luc.
   */
  const asked = quoteId ? (list.find((q) => q.id === quoteId) ?? null) : null;
  const quotation =
    asked && asked.status !== 'SUPERSEDED' ? asked : (list[0] ?? asked ?? null);
  return { workOrder, quotation, quotations: list };
});

const workOrder = computed(() => data.value?.workOrder ?? null);
const quotation = computed(() => data.value?.quotation ?? null);

/**
 * Dong thoi gian phan hoi cua khach — ban thiet ke ve han phan nay.
 *
 * Nhan vien mo man nay de quyet dinh lam gi tiep, ma quyet dinh do phu
 * thuoc vao viec khach da noi gi: dong y, tu choi han, hay xin bao gia
 * khac. Truoc day man chi hien mot cai nhan trang thai, nhan vien phai
 * sang man chi tiet bao gia moi doc duoc ly do.
 *
 * Xep tu cu den moi de doc nhu mot cau chuyen: gui ban 1 -> khach xin
 * sua -> gui ban 2 -> khach dong y.
 */
const history = computed(() =>
  [...(data.value?.quotations ?? [])]
    .filter((q) => q.status !== 'DRAFT')
    .sort((a, b) => a.version - b.version),
);

/** Ban moi nhat quyet dinh buoc tiep theo, khong phai ban dang mo. */
const latest = computed(() => history.value[history.value.length - 1] ?? null);
const latestStatus = computed(() => latest.value?.status ?? null);
const wantsRevision = computed(() => Boolean(latest.value?.revisionRequested));

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

      <!--
        Phan hoi cua khach — thu quyet dinh nhan vien lam gi tiep. Truoc day
        man nay chi co mot cai nhan trang thai, muon biet khach noi gi phai
        sang man chi tiet bao gia doc.
      -->
      <section class="card gap-2.5" style="background: #fff">
        <h5>{{ $t('sa12c.replyTitle') }}</h5>

        <div
          v-for="row in history"
          :key="row.id"
          class="flex flex-col gap-1 pl-3"
          style="border-left: 2px solid var(--color-divider)"
        >
          <div class="flex flex-wrap items-baseline gap-2">
            <span class="text-[13px] font-semibold">
              {{ $t('sa12c.version', { n: row.version }) }}
            </span>
            <AyStatusTag :status="row.status" />
            <span v-if="row.revisionRequested" class="tag tag-accent text-[11px]">
              {{ $t('sa13.wantsRevision') }}
            </span>
            <span class="text-muted text-[11.5px]">
              {{ row.respondedAt ? dateTime(row.respondedAt) : $t('sa12c.waitingReply') }}
            </span>
            <span class="text-muted ml-auto text-[11.5px]">{{ money(row.totalAmount) }}</span>
          </div>

          <p v-if="row.rejectReason" class="text-[12.5px]">
            <span class="text-muted">{{ $t('sa13.rejectReason') }}:</span>
            “{{ row.rejectReason }}”
          </p>
          <p v-if="row.customerComment" class="text-[12.5px]">
            <span class="text-muted">{{ $t('sa13.customerComment') }}:</span>
            “{{ row.customerComment }}”
          </p>
          <p
            v-if="row.status === 'SENT' && !row.respondedAt"
            class="text-muted text-[12px]"
          >
            {{ $t('sa12c.noReplyYet') }}
          </p>
        </div>
      </section>

      <!-- Cau nhac doi theo viec khach da tra loi gi. -->
      <p class="text-[12.5px] leading-[1.55]" style="color: var(--color-neutral-700)">
        <template v-if="wantsRevision">{{ $t('sa12c.leadRevision') }}</template>
        <template v-else-if="latestStatus === 'REJECTED'">{{ $t('sa12c.leadRejected') }}</template>
        <template v-else-if="latestStatus === 'ACCEPTED'">{{ $t('sa12c.leadAccepted') }}</template>
        <template v-else>{{ $t('sa12c.lead') }}</template>
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
          class="btn text-[13px]"
          :class="latestStatus === 'REJECTED' ? 'btn-primary' : 'btn-secondary'"
          style="min-height: 48px; padding-inline: 20px"
        >
          {{ wantsRevision ? $t('sa12c.makeRevision') : $t('sa12c.editQuote') }}
        </NuxtLink>
        <!--
          Khach da tu choi thi khong moi nhan vien "chot bao gia" nua —
          viec can lam la lap ban moi hoac dong lich. Van giu duong chot
          lai duoi dang nut phu: khach doi y qua dien thoai la chuyen
          thuong gap, khong nen bat nhan vien di vong.
        -->
        <button
          type="button"
          class="btn text-[15px]"
          :class="latestStatus === 'REJECTED' ? 'btn-secondary' : 'btn-primary'"
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
