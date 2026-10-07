<script setup lang="ts">
import type { Booking, Quotation } from '~/types/models';

/** SA-13 (chi tiet) — xem mot ban bao gia va gui neu con la ban nhap. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const config = useRuntimeConfig();
const { t } = useI18n();
const { money, dateTime, date } = useFormat();

const id = route.params.id as string;
const { data: quotation, refresh } = await useAsyncData(`admin-quote-${id}`, () =>
  api.get<Quotation>(`/admin/quotations/${id}`),
);
if (!quotation.value) {
  throw createError({ statusCode: 404, statusMessage: t('sc27.notFound') });
}

const sending = ref(false);

/**
 * Nut mo cong viec dan ve dung buoc lich hen dang dung.
 *
 * Truoc day no luon mo trang dau cua phieu dich vu. Nhung mot ban bao gia
 * da chot thi viec dang cho la o man chot bao gia, sua xong roi thi la o
 * man thu tien — nhan vien mo bao gia ra xem roi phai tu tim duong sang
 * dung cho la thua mot chang. Danh sach lich hen va chuong thong bao da
 * dan theo buoc, nut nay dan theo cung mot bang.
 *
 * Phai hoi rieng lich hen vi ban bao gia khong kem theo buoc: buoc la thu
 * tinh ra luc doc lich hen, khong luu trong co so du lieu. Hoi hong thi
 * de trong, nut se lui ve trang dau cua phieu nhu cu.
 */
const bookingId = computed(() => quotation.value?.workOrder?.bookingId ?? null);

const { data: booking } = await useAsyncData(
  `admin-quote-booking-${id}`,
  () =>
    bookingId.value
      ? api.get<Booking>(`/admin/bookings/${bookingId.value}`).catch(() => null)
      : Promise.resolve(null),
  { watch: [bookingId] },
);

const openTo = computed(() =>
  booking.value
    ? bookingDestination(booking.value.stage, booking.value.workOrderId, booking.value.id)
    : `/admin/work-orders/${quotation.value?.workOrderId}`,
);

async function send(): Promise<void> {
  sending.value = true;
  try {
    await api.put(`/admin/quotations/${id}/send`);
    ui.success(t('sa13.sent'));
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    sending.value = false;
  }
}

/** Duong dan khach mo — hien de nhan vien doc lai qua dien thoai khi can. */
const publicUrl = computed(() => {
  if (!quotation.value) return '';
  const origin = config.public.apiBase.replace(/\/api\/v1\/?$/, '');
  return `${origin}/quotations/${quotation.value.publicToken}`;
});

useHead({ title: () => `${t('sa13.detailTitle', { code: quotation.value?.code ?? '' })} — AOYAMA Admin` });
</script>

<template>
  <div v-if="quotation" class="admin-form admin-form-wide">
    <AyPageHeader
      code="SA-13"
      :title="$t('sa13.detailTitle', { code: quotation.code })"
      back-to="/admin/quotations"
      :description="
        $t('sa13.detailLead', { n: quotation.version, order: quotation.workOrder?.code ?? '' })
      "
    >
      <template #actions>
        <AyStatusTag :status="quotation.status" />
        <AyButton v-if="quotation.status === 'DRAFT'" size="sm" :loading="sending" @click="send">
          {{ $t('sa13.send') }}
        </AyButton>
        <AyButton :to="openTo" variant="secondary" size="sm">
          {{ $t('sa13.openOrder') }}
        </AyButton>
      </template>
    </AyPageHeader>

    <section class="card" style="background: #fff">
      <div class="table-wrap !shadow-none">
        <table class="table">
          <thead>
            <tr>
              <th scope="col">{{ $t('sa12.colContent') }}</th>
              <th scope="col" class="w-20 text-center">{{ $t('sa12.colKind') }}</th>
              <th scope="col" class="w-24 text-right">{{ $t('sa10.colUnit') }}</th>
              <th scope="col" class="w-14 text-center">{{ $t('sa10.colQty') }}</th>
              <th scope="col" class="w-28 text-right">{{ $t('sa10.colAmount') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in quotation.items" :key="item.id"
              :class="!item.isAccepted ? 'opacity-50 line-through' : ''"
            >
              <td>
                {{ item.name }}
                <span v-if="item.isOptional" class="tag ml-1 bg-olive-100 text-olive-800">
                  {{ $t('sc27.optional') }}
                </span>
                <AyAiBadge v-if="item.suggestedByAi" class="ml-1" />
              </td>
              <td class="text-center text-[12px] text-muted">{{ item.kind }}</td>
              <td class="text-right">{{ money(item.unitPrice) }}</td>
              <td class="text-center">{{ item.quantity }}</td>
              <td class="text-right">{{ money(item.lineTotal) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div class="grid gap-4 sm:grid-cols-2">
      <section class="card" style="background: #fff">
        <AyMoneyTable
          :subtotal="quotation.subtotal"
          :discount-amount="quotation.discountAmount"
          :tax-rate="quotation.taxRate"
          :tax-amount="quotation.taxAmount"
          :total-amount="quotation.totalAmount"
        />
      </section>

      <section class="card flex flex-col gap-2 text-[13.5px]">
        <div class="flex justify-between">
          <span class="text-muted">{{ $t('sa13.sentAt') }}</span><span>{{ dateTime(quotation.sentAt) || '—' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted">{{ $t('sa13.respondedAt') }}</span><span>{{ dateTime(quotation.respondedAt) || '—' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted">{{ $t('sa12.validUntil') }}</span><span>{{ date(quotation.validUntil) || '—' }}</span>
        </div>
        <!--
          Tu choi han va xin bao gia lai deu ve "Da tu choi", nhung viec phai
          lam thi nguoc nhau: mot ben la thoi, mot ben la lap lai ban khac.
        -->
        <div v-if="quotation.revisionRequested" class="flex justify-between">
          <span class="text-muted">{{ $t('sa13.customerWants') }}</span>
          <strong style="color: var(--color-accent-800)">{{ $t('sa13.wantsRevision') }}</strong>
        </div>
        <div v-if="quotation.rejectReason">
          <span class="text-muted">{{ $t('sa13.rejectReason') }}</span>
          <p>{{ quotation.rejectReason }}</p>
        </div>
        <div v-if="quotation.customerComment">
          <span class="text-muted">{{ $t('sa13.customerComment') }}</span>
          <p>{{ quotation.customerComment }}</p>
        </div>
        <div class="mt-1 border-t border-divider pt-2">
          <span class="text-muted">{{ $t('sa13.publicUrl') }}</span>
          <p class="break-all font-mono text-[11.5px]">{{ publicUrl }}</p>
        </div>
      </section>
    </div>
  </div>
</template>
