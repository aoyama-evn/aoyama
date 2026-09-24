<script setup lang="ts">
import type { Quotation } from '~/types/models';

/** SC-27 Xem bao gia — FR-QUO-07, NFR-SE-08 (duong dan kho doan). */
const route = useRoute();
const api = useApi();
const { money, date, dateTime } = useFormat();

const token = route.params.token as string;
const { data: quotation } = await useAsyncData(`quotation-${token}`, () =>
  api.get<Quotation>(`/quotations/${token}`),
);

if (!quotation.value) throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy báo giá' });

const canRespond = computed(() => quotation.value?.status === 'SENT');
const expired = computed(() =>
  Boolean(quotation.value?.validUntil && quotation.value.validUntil < new Date().toISOString().slice(0, 10)),
);

const labor = computed(() => (quotation.value?.items ?? []).filter((i) => i.kind !== 'PART'));
const parts = computed(() => (quotation.value?.items ?? []).filter((i) => i.kind === 'PART'));

useHead({ title: `Báo giá ${quotation.value.code}` });
</script>

<template>
  <div v-if="quotation" class="mx-auto flex max-w-2xl flex-col gap-5">
    <AyPageHeader code="SC-27" :title="`Báo giá ${quotation.code}`">
      <template #actions>
        <AyStatusTag :status="quotation.status" />
      </template>
    </AyPageHeader>

    <section class="ay-card flex flex-col gap-2 text-[14px]">
      <div class="flex flex-wrap justify-between gap-2">
        <span class="ay-muted">Xe</span>
        <span>
          {{ quotation.workOrder?.vehicle?.plateNumber }}
          · {{ quotation.workOrder?.vehicle?.maker }} {{ quotation.workOrder?.vehicle?.model }}
        </span>
      </div>
      <div class="flex flex-wrap justify-between gap-2">
        <span class="ay-muted">Ngày gửi</span>
        <span>{{ dateTime(quotation.sentAt) }}</span>
      </div>
      <div v-if="quotation.validUntil" class="flex flex-wrap justify-between gap-2">
        <span class="ay-muted">Hiệu lực đến</span>
        <span :class="expired ? 'text-danger font-semibold' : ''">{{ date(quotation.validUntil) }}</span>
      </div>
      <div v-if="quotation.version > 1" class="flex flex-wrap justify-between gap-2">
        <span class="ay-muted">Phiên bản</span>
        <span>Bản {{ quotation.version }}</span>
      </div>
    </section>

    <section v-if="labor.length" class="ay-card">
      <h2 class="mb-2 font-heading text-[16px]">Hạng mục công việc</h2>
      <ul class="flex flex-col gap-2">
        <li v-for="item in labor" :key="item.id" class="flex justify-between gap-3 text-[14px]">
          <span>
            {{ item.name }}
            <span v-if="item.isOptional" class="ay-tag ml-1 bg-info-bg text-info">tùy chọn</span>
            <span v-if="item.description" class="block text-[12.5px] ay-muted">{{ item.description }}</span>
          </span>
          <span class="whitespace-nowrap">
            {{ money(item.unitPrice) }}<template v-if="item.quantity > 1"> × {{ item.quantity }}</template>
          </span>
        </li>
      </ul>
    </section>

    <section v-if="parts.length" class="ay-card">
      <h2 class="mb-2 font-heading text-[16px]">Phụ tùng</h2>
      <ul class="flex flex-col gap-2">
        <li v-for="item in parts" :key="item.id" class="flex justify-between gap-3 text-[14px]">
          <span>
            {{ item.name }}
            <span v-if="item.isOptional" class="ay-tag ml-1 bg-info-bg text-info">tùy chọn</span>
          </span>
          <span class="whitespace-nowrap">
            {{ money(item.unitPrice) }}<template v-if="item.quantity > 1"> × {{ item.quantity }}</template>
          </span>
        </li>
      </ul>
    </section>

    <section class="ay-card">
      <AyMoneyTable
        :subtotal="quotation.subtotal"
        :discount-amount="quotation.discountAmount"
        :tax-rate="quotation.taxRate"
        :tax-amount="quotation.taxAmount"
        :total-amount="quotation.totalAmount"
      />
      <p v-if="quotation.note" class="mt-3 whitespace-pre-line text-[13px] ay-muted">{{ quotation.note }}</p>
    </section>

    <div v-if="canRespond && !expired">
      <AyButton :to="`/quotations/${token}/respond`" block>Phản hồi báo giá</AyButton>
    </div>

    <div v-else-if="expired" class="ay-card text-center text-[13.5px] text-danger">
      Báo giá đã quá hạn hiệu lực. Vui lòng liên hệ cửa hàng để được báo giá lại.
    </div>

    <div v-else-if="quotation.status === 'ACCEPTED'" class="ay-card text-center text-[13.5px] text-success">
      Bạn đã đồng ý báo giá này. Cửa hàng đang thực hiện công việc.
    </div>

    <div v-else-if="quotation.status === 'REJECTED'" class="ay-card text-center text-[13.5px] ay-muted">
      Bạn đã từ chối báo giá này.
      <template v-if="quotation.rejectReason"> Lý do: {{ quotation.rejectReason }}</template>
    </div>
  </div>
</template>
