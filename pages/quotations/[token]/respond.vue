<script setup lang="ts">
import type { ApiError, Quotation } from '~/types/models';

/** SC-28 Phan hoi bao gia — FR-QUO-08, FR-QUO-09. */
const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { money } = useFormat();

const token = route.params.token as string;
const { data: quotation } = await useAsyncData(`quotation-respond-${token}`, () =>
  api.get<Quotation>(`/quotations/${token}`),
);

if (!quotation.value) throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy báo giá' });

/** Hang muc tuy chon mac dinh duoc chon; khach bo tick de khong lam. */
const rejectedItemIds = ref<string[]>([]);
const comment = ref('');
const rejectReason = ref('');
const mode = ref<'ACCEPT' | 'REJECT'>('ACCEPT');
const submitting = ref(false);
const error = ref<ApiError | null>(null);
const confirmOpen = ref(false);

const optionalItems = computed(() => (quotation.value?.items ?? []).filter((i) => i.isOptional));
const requiredItems = computed(() => (quotation.value?.items ?? []).filter((i) => !i.isOptional));

/** Tong tien tinh lai theo dung nhung gi khach dong y. */
const selectedTotal = computed(() => {
  if (!quotation.value) return 0;
  const kept = quotation.value.items.filter(
    (i) => !i.isOptional || !rejectedItemIds.value.includes(i.id),
  );
  const subtotal = kept.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const beforeTax = Math.max(0, subtotal - quotation.value.discountAmount);
  const tax = Math.floor((beforeTax * quotation.value.taxRate) / 100);
  return beforeTax + tax;
});

function toggleOptional(id: string): void {
  rejectedItemIds.value = rejectedItemIds.value.includes(id)
    ? rejectedItemIds.value.filter((x) => x !== id)
    : [...rejectedItemIds.value, id];
}

async function submit(): Promise<void> {
  submitting.value = true;
  error.value = null;
  try {
    await api.post(`/quotations/${token}/respond`, {
      accept: mode.value === 'ACCEPT',
      rejectedItemIds: mode.value === 'ACCEPT' ? rejectedItemIds.value : undefined,
      reason: mode.value === 'REJECT' ? rejectReason.value || undefined : undefined,
      comment: comment.value.trim() || undefined,
    });
    ui.success(
      mode.value === 'ACCEPT' ? 'Đã gửi đồng ý báo giá' : 'Đã gửi phản hồi từ chối',
      'Cửa hàng sẽ liên hệ lại với bạn.',
    );
    await navigateTo(`/quotations/${token}`);
  } catch (err) {
    error.value = normalizeError(err);
    confirmOpen.value = false;
  } finally {
    submitting.value = false;
  }
}

useHead({ title: 'Phản hồi báo giá' });
</script>

<template>
  <div v-if="quotation" class="mx-auto flex max-w-2xl flex-col gap-5">
    <AyPageHeader
      code="SC-28" title="Phản hồi báo giá" :back-to="`/quotations/${token}`"
      description="Bạn có thể đồng ý toàn bộ, bỏ bớt hạng mục tùy chọn, hoặc từ chối."
    />

    <div class="flex gap-2">
      <button
        type="button" class="btn flex-1"
        :class="mode === 'ACCEPT' ? 'btn-primary' : 'btn-secondary'"
        @click="mode = 'ACCEPT'"
      >
        Đồng ý
      </button>
      <button
        type="button" class="btn flex-1"
        :class="mode === 'REJECT' ? 'btn-danger' : 'btn-secondary'"
        @click="mode = 'REJECT'"
      >
        Từ chối
      </button>
    </div>

    <template v-if="mode === 'ACCEPT'">
      <section v-if="requiredItems.length" class="card">
        <h2 class="mb-2 font-heading text-[16px]">Hạng mục bắt buộc</h2>
        <ul class="flex flex-col gap-1.5 text-[14px]">
          <li v-for="item in requiredItems" :key="item.id" class="flex justify-between gap-3">
            <span>{{ item.name }}</span>
            <span class="whitespace-nowrap">{{ money(item.unitPrice * item.quantity) }}</span>
          </li>
        </ul>
      </section>

      <section v-if="optionalItems.length" class="card">
        <h2 class="mb-1 font-heading text-[16px]">Hạng mục tùy chọn</h2>
        <p class="mb-2 text-[12.5px] text-muted">Bỏ chọn những hạng mục bạn chưa muốn làm lần này.</p>
        <ul class="flex flex-col gap-2">
          <li v-for="item in optionalItems" :key="item.id">
            <label class="flex items-start gap-2.5 text-[14px]">
              <input
                type="checkbox" class="mt-1 h-4 w-4 accent-[var(--color-accent)]"
                :checked="!rejectedItemIds.includes(item.id)"
                @change="toggleOptional(item.id)"
              >
              <span class="flex-1">
                {{ item.name }}
                <span v-if="item.description" class="block text-[12.5px] text-muted">{{ item.description }}</span>
              </span>
              <span class="whitespace-nowrap">{{ money(item.unitPrice * item.quantity) }}</span>
            </label>
          </li>
        </ul>
      </section>

      <section class="card flex items-center justify-between">
        <span class="font-heading text-[16px]">Tổng theo lựa chọn của bạn</span>
        <span class="font-heading text-[22px]">{{ money(selectedTotal) }}</span>
      </section>
    </template>

    <section v-else class="card">
      <AyField label="Lý do từ chối" hint="Giúp cửa hàng điều chỉnh báo giá phù hợp hơn">
        <template #default="{ id }">
          <select :id="id" v-model="rejectReason" class="input">
            <option value="">— Không nêu lý do —</option>
            <option value="Chi phí cao hơn dự kiến">Chi phí cao hơn dự kiến</option>
            <option value="Muốn tham khảo thêm">Muốn tham khảo thêm</option>
            <option value="Chưa cần làm ngay">Chưa cần làm ngay</option>
            <option value="Lý do khác">Lý do khác</option>
          </select>
        </template>
      </AyField>
    </section>

    <AyField label="Ghi chú gửi cửa hàng" hint="Không bắt buộc">
      <template #default="{ id }">
        <textarea :id="id" v-model="comment" class="input min-h-[90px]" />
      </template>
    </AyField>

    <AyErrorNote :error="error" />

    <AyButton block :variant="mode === 'REJECT' ? 'danger' : 'primary'" @click="confirmOpen = true">
      {{ mode === 'ACCEPT' ? 'Gửi đồng ý' : 'Gửi từ chối' }}
    </AyButton>

    <AyConfirmDialog
      :open="confirmOpen"
      :title="mode === 'ACCEPT' ? 'Xác nhận đồng ý báo giá' : 'Xác nhận từ chối báo giá'"
      :message="
        mode === 'ACCEPT'
          ? `Cửa hàng sẽ bắt đầu thực hiện công việc với tổng chi phí ${money(selectedTotal)}. Phản hồi không sửa lại được.`
          : 'Cửa hàng sẽ dừng công việc và liên hệ lại với bạn. Phản hồi không sửa lại được.'
      "
      :danger="mode === 'REJECT'"
      :loading="submitting"
      @confirm="submit"
      @cancel="confirmOpen = false"
    />
  </div>
</template>
