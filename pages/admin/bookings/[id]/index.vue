<script setup lang="ts">
import type { AiDiagnosis, Booking, Quotation, ServiceHistory, WorkOrder } from '~/types/models';

/**
 * SA-05 Chi tiet lich hen — FR-BOOK-22..26, FR-AI-12.
 * Ban thiet ke: ba the tom tat o tren, the phieu dich vu va bao gia lien ket,
 * hai cot dich vu da dat + goi y AI, o ghi chu noi bo, va hang hanh dong can
 * phai duoi mot duong ke. Ten man hinh va trang thai nam o CP-05.
 */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { i18n, money, dateTime, dayLabel, clock, number } = useFormat();

const id = route.params.id as string;

const { data: booking, refresh } = await useAsyncData(`admin-booking-${id}`, () =>
  api.get<Booking>(`/admin/bookings/${id}`),
);

if (!booking.value) throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy lịch hẹn' });

setScreenTitle(() => `Chi tiết lịch hẹn ${booking.value?.code ?? ''}`);

/** FR-AI-12 — hien lai ket qua chan doan AI khach da lam truoc khi dat lich. */
const { data: diagnosis } = await useAsyncData(`admin-booking-diag-${id}`, () =>
  booking.value?.aiDiagnosisId
    ? api.get<AiDiagnosis>(`/ai/diagnosis/sessions/${booking.value.aiDiagnosisId}`)
    : Promise.resolve(null),
);

/** Lich su gan nhat cua xe — giup le tan doi chieu ngay tai quay. */
const { data: history } = await useAsyncData(`admin-booking-history-${id}`, () =>
  booking.value?.vehicleId
    ? api.get<{ items: ServiceHistory[] }>(`/admin/vehicles/${booking.value.vehicleId}/history`, {
        limit: 3,
      })
    : Promise.resolve(null),
);

/** Phieu dich vu va bao gia mo tu lich hen nay, neu co. */
const { data: linked } = await useAsyncData(`admin-booking-docs-${id}`, async () => {
  try {
    const page = await api.get<{ items: WorkOrder[] }>('/admin/work-orders', {
      keyword: booking.value?.code,
      limit: 1,
    });
    const workOrder = page.items[0] ?? null;
    if (!workOrder) return { workOrder: null, quotation: null };
    const quotes = await api
      .get<Quotation[]>(`/admin/work-orders/${workOrder.id}/quotations`)
      .catch(() => []);
    return { workOrder, quotation: quotes[0] ?? null };
  } catch {
    return { workOrder: null, quotation: null };
  }
});

const busy = ref(false);
const confirmAction = ref<'CONFIRM' | 'CANCEL' | 'NO_SHOW' | null>(null);
const cancelReason = ref('');
const adminNote = ref('');

watchEffect(() => {
  adminNote.value = booking.value?.adminNote ?? '';
});

async function act(): Promise<void> {
  if (!confirmAction.value || !booking.value) return;
  busy.value = true;
  try {
    if (confirmAction.value === 'CONFIRM') {
      await api.put(`/admin/bookings/${id}/confirm`);
      ui.success('Đã xác nhận lịch hẹn', 'Mã QR đã được sinh và SMS đã gửi cho khách.');
    } else if (confirmAction.value === 'CANCEL') {
      await api.put(`/admin/bookings/${id}/cancel`, { reason: cancelReason.value || undefined });
      ui.success('Đã hủy lịch hẹn');
    } else {
      await api.put(`/admin/bookings/${id}/no-show`);
      ui.success('Đã đánh dấu khách không đến');
    }
    confirmAction.value = null;
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    busy.value = false;
  }
}

async function saveNote(): Promise<void> {
  try {
    await api.put(`/admin/bookings/${id}/note`, { note: adminNote.value });
    ui.success('Đã lưu ghi chú');
  } catch (error) {
    ui.error(normalizeError(error).message);
  }
}

const canConfirm = computed(() => booking.value?.status === 'PENDING');
const canCancel = computed(() => ['PENDING', 'CONFIRMED'].includes(booking.value?.status ?? ''));
const canIntake = computed(() => booking.value?.status === 'CONFIRMED');

const estimatedTotal = computed(() =>
  (booking.value?.services ?? []).reduce((sum, line) => sum + line.estimatedPrice, 0),
);

const historyEntries = computed(() =>
  (booking.value?.statusHistories ?? []).map((h) => ({
    id: h.id,
    createdAt: h.createdAt,
    actorType: h.actorType,
    action:
      h.action === 'RESCHEDULE'
        ? `Đổi lịch${h.previousScheduledAt ? ` (từ ${dateTime(h.previousScheduledAt)})` : ''}`
        : `${h.fromStatus ?? 'Tạo mới'} → ${h.toStatus}`,
    detail: h.note,
  })),
);

useHead({ title: `Lịch hẹn ${booking.value.code} — AOYAMA Admin` });
</script>

<template>
  <div v-if="booking" class="flex flex-col gap-[15px]">
    <!-- Ba the tom tat -->
    <div class="grid gap-[13px]" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))">
      <div class="card gap-1" style="background: #fff">
        <div class="card-kicker">Khách hàng</div>
        <p class="text-[14px] font-semibold">{{ booking.contactName }}</p>
        <p class="text-muted text-[12px]">
          {{ booking.contactPhone }}
          <template v-if="booking.contactEmail"> · {{ booking.contactEmail }}</template>
        </p>
        <p class="text-muted text-[12px]">
          {{ booking.createdByAdmin ? 'Nhân viên đặt thay' : 'Khách tự đặt' }}
        </p>
      </div>

      <div class="card gap-1" style="background: #fff">
        <div class="card-kicker">Xe</div>
        <p class="text-[14px] font-semibold">
          <template v-if="booking.vehicle">
            {{ booking.vehicle.maker }} {{ booking.vehicle.model }}
          </template>
          <template v-else>Chưa khai báo</template>
        </p>
        <p v-if="booking.vehicle" class="text-muted text-[12px]">
          {{ booking.vehicle.plateNumber }}
          <template v-if="booking.vehicle.currentOdometer">
            · {{ number(booking.vehicle.currentOdometer) }} km
          </template>
        </p>
      </div>

      <div class="card gap-1" style="background: #fff">
        <div class="card-kicker">Thời gian &amp; cửa hàng</div>
        <p class="text-[14px] font-semibold">
          {{ dayLabel(booking.scheduledAt) }}
          {{ clock(booking.slotStartTime) }}–{{ clock(booking.slotEndTime) }}
        </p>
        <p class="text-muted text-[12px]">{{ i18n(booking.store?.name ?? null) }}</p>
      </div>
    </div>

    <!-- Phieu dich vu va bao gia lien ket -->
    <section class="card gap-[11px]" style="background: #fff">
      <h5>Phiếu dịch vụ &amp; báo giá liên kết</h5>

      <p v-if="!linked?.workOrder" class="text-muted text-[12.5px]">
        Chưa có phiếu dịch vụ. Phiếu và báo giá được tạo sau khi tiếp nhận xe.
      </p>

      <div
        v-else
        class="grid gap-[11px]"
        style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))"
      >
        <NuxtLink :to="`/admin/work-orders/${linked.workOrder.id}`" class="ay-doc">
          <span class="card-kicker">Phiếu dịch vụ</span>
          <span class="font-heading text-[16px]">{{ linked.workOrder.code }}</span>
          <span class="flex flex-wrap items-center gap-2">
            <AyStatusTag :status="linked.workOrder.status" />
            <span class="text-muted text-[11.5px]">
              {{ money(linked.workOrder.totalAmount) }}
            </span>
          </span>
        </NuxtLink>

        <NuxtLink
          v-if="linked.quotation"
          :to="`/admin/quotations/${linked.quotation.id}`"
          class="ay-doc"
        >
          <span class="card-kicker">Báo giá</span>
          <span class="flex items-baseline justify-between gap-2">
            <span class="font-heading text-[16px]">
              {{ linked.quotation.code }} · v{{ linked.quotation.version }}
            </span>
            <span class="font-heading text-[16px]">{{ money(linked.quotation.totalAmount) }}</span>
          </span>
          <span class="text-muted text-[11.5px]">
            <template v-if="linked.quotation.sentAt">
              Gửi khách {{ dateTime(linked.quotation.sentAt) }}
            </template>
            <template v-else>Chưa gửi khách</template>
          </span>
        </NuxtLink>
      </div>
    </section>

    <div class="grid gap-[13px]" style="grid-template-columns: repeat(auto-fit, minmax(330px, 1fr))">
      <!-- Dich vu da dat -->
      <section class="card gap-2.5" style="background: #fff">
        <h5>Dịch vụ đã đặt</h5>
        <table class="table" style="min-width: 270px">
          <tbody>
            <tr v-for="line in booking.services ?? []" :key="line.id">
              <td>
                {{ line.serviceName }}
                <span class="text-muted">· {{ line.estimatedMinutes }} phút</span>
              </td>
              <td class="text-right">
                {{ line.estimatedPrice ? money(line.estimatedPrice) : 'báo giá riêng' }}
              </td>
            </tr>
          </tbody>
        </table>
        <div class="flex justify-between text-[13px]">
          <span class="text-muted">Tham khảo</span>
          <strong>{{ money(estimatedTotal) }}</strong>
        </div>

        <div
          v-if="booking.symptomDescription"
          class="pt-2.5 text-[13px]"
          style="border-top: 1px solid var(--color-divider)"
        >
          <p class="text-muted mb-1 text-[11px]">Mô tả của khách</p>
          <p class="whitespace-pre-line">“{{ booking.symptomDescription }}”</p>
          <ul v-if="booking.symptomPhotoUrls.length" class="mt-2 flex flex-wrap gap-2">
            <li v-for="(url, index) in booking.symptomPhotoUrls" :key="index">
              <img :src="url" alt="Ảnh khách gửi" class="h-20 w-20 rounded-xl object-cover" />
            </li>
          </ul>
        </div>
      </section>

      <!-- Goi y AI -->
      <section
        v-if="diagnosis && diagnosis.findings.length"
        class="flex flex-col gap-[11px] p-4"
        style="
          border: 1.5px dashed var(--color-accent-2-400);
          background: var(--color-accent-2-100);
          border-radius: 26px;
        "
      >
        <div class="flex items-center gap-2">
          <span class="tag" style="background: var(--color-accent-2-500); color: #fff">
            ✦ Gợi ý bởi AI
          </span>
          <span class="text-[11px]" style="color: var(--color-accent-2-800)">
            {{ diagnosis.vehicleMaker }} {{ diagnosis.vehicleModel }}
          </span>
        </div>

        <div class="flex flex-col gap-2.5">
          <div v-for="(finding, index) in diagnosis.findings" :key="index">
            <div class="mb-1 flex justify-between text-[13px] font-semibold">
              <span>{{ finding.label }}</span>
              <span>{{ Math.round(finding.matchPercent) }} %</span>
            </div>
            <div
              style="height: 7px; border-radius: 999px; background: var(--color-accent-2-200)"
              role="progressbar"
              :aria-valuenow="Math.round(finding.matchPercent)"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="finding.label"
            >
              <div
                style="height: 100%; border-radius: 999px; background: var(--color-accent-2-600)"
                :style="{ width: `${Math.min(100, Math.max(0, finding.matchPercent))}%` }"
              />
            </div>
          </div>
        </div>

        <p class="text-[11.5px] leading-[1.45]" style="color: var(--color-accent-2-800)">
          Kết quả AI kèm hội thoại, ảnh và ghi âm được đính vào lịch hẹn này (FR-AI-12). Cần kỹ
          thuật viên kiểm tra thực tế trước khi báo giá.
        </p>
      </section>
    </div>

    <div class="grid gap-[13px]" style="grid-template-columns: repeat(auto-fit, minmax(330px, 1fr))">
      <section class="card gap-[7px]" style="background: #fff">
        <h5>Ghi chú nội bộ</h5>
        <textarea
          v-model="adminNote"
          class="input"
          style="min-height: 70px"
          placeholder="Chỉ nhân viên thấy nội dung này"
        />
        <button
          type="button"
          class="btn btn-secondary self-end text-[12.5px]"
          @click="saveNote"
        >
          Lưu ghi chú
        </button>
      </section>

      <section v-if="(history?.items ?? []).length" class="card gap-2" style="background: #fff">
        <h5>Lịch sử gần nhất của xe</h5>
        <ul class="flex flex-col gap-1.5 text-[13.5px]">
          <li
            v-for="record in history?.items ?? []"
            :key="record.id"
            class="flex justify-between gap-3"
          >
            <span>{{ dateTime(record.servicedAt) }} · {{ record.summary }}</span>
            <span class="whitespace-nowrap">
              {{ money(record.totalAmount) }}
              <template v-if="record.odometer"> · {{ number(record.odometer) }} km</template>
            </span>
          </li>
        </ul>
      </section>

      <section class="card gap-2" style="background: #fff">
        <h5>Nhật ký thay đổi</h5>
        <AyChangeLog :entries="historyEntries" />
      </section>
    </div>

    <!-- Hang hanh dong -->
    <div
      class="flex flex-wrap items-center justify-end gap-2.5 pt-[15px]"
      style="border-top: 1px solid var(--color-divider)"
    >
      <NuxtLink
        v-if="canCancel"
        :to="`/admin/bookings/${id}/reschedule`"
        class="btn btn-secondary text-[13px]"
        style="min-height: 48px; padding-inline: 20px"
      >
        Đổi lịch
      </NuxtLink>
      <button
        v-if="booking.status === 'CONFIRMED'"
        type="button"
        class="btn btn-ghost text-[13px]"
        style="min-height: 48px"
        @click="confirmAction = 'NO_SHOW'"
      >
        Khách không đến
      </button>
      <button
        v-if="canCancel"
        type="button"
        class="btn btn-secondary text-[13px]"
        style="min-height: 48px; padding-inline: 20px"
        @click="confirmAction = 'CANCEL'"
      >
        Hủy lịch hẹn
      </button>
      <button
        v-if="canConfirm"
        type="button"
        class="btn btn-primary text-[15px]"
        style="min-height: 48px; padding-inline: 26px"
        @click="confirmAction = 'CONFIRM'"
      >
        Xác nhận
      </button>
      <NuxtLink
        v-if="canIntake"
        :to="`/admin/work-orders/intake?bookingId=${booking.id}`"
        class="btn btn-primary text-[15px]"
        style="min-height: 48px; padding-inline: 26px"
      >
        Tiếp nhận xe
      </NuxtLink>
    </div>

    <AyConfirmDialog
      :open="confirmAction !== null"
      :title="
        confirmAction === 'CONFIRM'
          ? 'Xác nhận lịch hẹn'
          : confirmAction === 'CANCEL'
            ? 'Hủy lịch hẹn'
            : 'Đánh dấu khách không đến'
      "
      :message="
        confirmAction === 'CONFIRM'
          ? 'Hệ thống sẽ sinh mã QR và gửi SMS xác nhận cho khách.'
          : confirmAction === 'CANCEL'
            ? 'Lịch hẹn sẽ bị hủy và khách nhận được SMS thông báo.'
            : 'Lịch hẹn chuyển sang trạng thái khách không đến và không mở phiếu dịch vụ được nữa.'
      "
      :danger="confirmAction !== 'CONFIRM'"
      :loading="busy"
      @confirm="act"
      @cancel="confirmAction = null"
    >
      <AyField v-if="confirmAction === 'CANCEL'" label="Lý do hủy" class="mt-3">
        <template #default="{ id: fieldId }">
          <input :id="fieldId" v-model="cancelReason" class="input" type="text" />
        </template>
      </AyField>
    </AyConfirmDialog>
  </div>
</template>

<style scoped>
.ay-doc {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-radius: 20px;
  background: var(--color-neutral-100);
  padding: 13px 15px;
  text-align: left;
  font-family: var(--font-body);
  color: var(--color-text);
}
.ay-doc:hover {
  background: var(--color-accent-100);
  text-decoration: none;
}
</style>
