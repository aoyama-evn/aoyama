<script setup lang="ts">
import type { AiDiagnosis, Booking, ServiceHistory, WorkOrder } from '~/types/models';

/** SA-05 Chi tiet lich hen — FR-BOOK-22..26, FR-AI-12. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const { i18n, money, dateTime, clock, number } = useFormat();

const id = route.params.id as string;

const { data: booking, refresh } = await useAsyncData(`admin-booking-${id}`, () =>
  api.get<Booking>(`/admin/bookings/${id}`),
);

if (!booking.value) throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy lịch hẹn' });

/** FR-AI-12 — hien lai ket qua chan doan AI khach da lam truoc khi dat lich. */
const { data: diagnosis } = await useAsyncData(
  `admin-booking-diag-${id}`,
  () =>
    booking.value?.aiDiagnosisId
      ? api.get<AiDiagnosis>(`/ai/diagnosis/sessions/${booking.value.aiDiagnosisId}`)
      : Promise.resolve(null),
);

/** Lich su gan nhat cua xe — giup le tan doi chieu ngay tai quay. */
const { data: history } = await useAsyncData(
  `admin-booking-history-${id}`,
  () =>
    booking.value?.vehicleId
      ? api.get<{ items: ServiceHistory[] }>(`/admin/vehicles/${booking.value.vehicleId}/history`, { limit: 3 })
      : Promise.resolve(null),
);

/** Tim phieu dich vu da mo tu lich hen nay, neu co. */
const { data: workOrder } = await useAsyncData(`admin-booking-wo-${id}`, async () => {
  try {
    const page = await api.get<{ items: WorkOrder[] }>('/admin/work-orders', {
      keyword: booking.value?.code,
      limit: 1,
    });
    return page.items[0] ?? null;
  } catch {
    return null;
  }
});

const busy = ref(false);
const confirmAction = ref<'CONFIRM' | 'CANCEL' | 'NO_SHOW' | null>(null);
const cancelReason = ref('');
const adminNote = ref('');

watchEffect(() => { adminNote.value = booking.value?.adminNote ?? ''; });

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
  <div v-if="booking" class="flex flex-col gap-4">
    <AyPageHeader code="SA-05" :title="`Lịch hẹn ${booking.code}`" back-to="/admin/bookings">
      <template #actions>
        <AyStatusTag :status="booking.status" />
        <AyButton v-if="canConfirm" size="sm" @click="confirmAction = 'CONFIRM'">Xác nhận</AyButton>
        <AyButton v-if="canIntake" size="sm" :to="`/admin/work-orders/intake?bookingId=${booking.id}`">
          Tiếp nhận xe
        </AyButton>
        <AyButton v-if="canCancel" variant="secondary" size="sm" :to="`/admin/bookings/${id}/reschedule`">
          Đổi lịch
        </AyButton>
        <AyButton v-if="canCancel" variant="ghost" size="sm" @click="confirmAction = 'CANCEL'">Hủy</AyButton>
        <AyButton
          v-if="booking.status === 'CONFIRMED'" variant="ghost" size="sm"
          @click="confirmAction = 'NO_SHOW'"
        >
          Khách không đến
        </AyButton>
      </template>
    </AyPageHeader>

    <div class="grid gap-4 lg:grid-cols-3">
      <div class="flex flex-col gap-4 lg:col-span-2">
        <section class="card">
          <h2 class="mb-2 font-heading text-[16px]">Thông tin lịch hẹn</h2>
          <dl class="grid gap-2 text-[14px] sm:grid-cols-2">
            <div><dt class="text-muted">Thời gian</dt><dd class="font-semibold">{{ dateTime(booking.scheduledAt) }} ({{ clock(booking.slotStartTime) }}–{{ clock(booking.slotEndTime) }})</dd></div>
            <div><dt class="text-muted">Cửa hàng</dt><dd>{{ i18n(booking.store?.name ?? null) }}</dd></div>
            <div><dt class="text-muted">Khách hàng</dt><dd>{{ booking.contactName }} · {{ booking.contactPhone }}</dd></div>
            <div><dt class="text-muted">Email</dt><dd>{{ booking.contactEmail ?? '—' }}</dd></div>
            <div><dt class="text-muted">Xe</dt><dd>{{ booking.vehicle ? `${booking.vehicle.plateNumber} · ${booking.vehicle.maker} ${booking.vehicle.model}` : 'Chưa khai báo' }}</dd></div>
            <div><dt class="text-muted">Nguồn</dt><dd>{{ booking.createdByAdmin ? 'Nhân viên đặt thay' : 'Khách tự đặt' }}</dd></div>
          </dl>

          <div v-if="booking.symptomDescription" class="mt-3 border-t border-divider pt-3">
            <p class="text-[12.5px] text-muted">Mô tả của khách</p>
            <p class="whitespace-pre-line text-[14px]">{{ booking.symptomDescription }}</p>
          </div>

          <ul v-if="booking.symptomPhotoUrls.length" class="mt-2 flex flex-wrap gap-2">
            <li v-for="(url, i) in booking.symptomPhotoUrls" :key="i">
              <img :src="url" alt="" class="h-20 w-20 rounded-xl object-cover">
            </li>
          </ul>
        </section>

        <section class="card">
          <h2 class="mb-2 font-heading text-[16px]">Dịch vụ đã đặt</h2>
          <ul class="flex flex-col gap-1.5 text-[14px]">
            <li v-for="line in booking.services ?? []" :key="line.id" class="flex justify-between gap-3">
              <span>{{ line.serviceName }} <span class="text-muted">· {{ line.estimatedMinutes }} phút</span></span>
              <span>{{ line.estimatedPrice ? money(line.estimatedPrice) : 'báo giá riêng' }}</span>
            </li>
          </ul>
        </section>

        <section v-if="diagnosis && diagnosis.findings.length" class="card">
          <div class="mb-2 flex items-center gap-2">
            <h2 class="font-heading text-[16px]">Chẩn đoán AI của khách</h2>
            <AyAiBadge />
          </div>
          <ul class="flex flex-col gap-2">
            <li v-for="(finding, i) in diagnosis.findings" :key="i" class="flex items-start gap-3 text-[14px]">
              <span class="tag bg-teal-100 text-teal-800">{{ Math.round(finding.matchPercent) }}%</span>
              <span>
                <strong>{{ finding.label }}</strong>
                <span v-if="finding.description" class="block text-[12.5px] text-muted">{{ finding.description }}</span>
              </span>
            </li>
          </ul>
          <p class="mt-2 text-[12px] text-muted">Kết quả tham khảo — kỹ thuật viên kết luận sau khi kiểm tra thực tế.</p>
        </section>

        <section v-if="(history?.items ?? []).length" class="card">
          <h2 class="mb-2 font-heading text-[16px]">Lịch sử gần nhất của xe</h2>
          <ul class="flex flex-col gap-1.5 text-[13.5px]">
            <li v-for="record in history?.items ?? []" :key="record.id" class="flex justify-between gap-3">
              <span>{{ dateTime(record.servicedAt) }} · {{ record.summary }}</span>
              <span class="whitespace-nowrap">
                {{ money(record.totalAmount) }}
                <template v-if="record.odometer"> · {{ number(record.odometer) }}km</template>
              </span>
            </li>
          </ul>
        </section>
      </div>

      <div class="flex flex-col gap-4">
        <section v-if="workOrder" class="card">
          <h2 class="mb-2 font-heading text-[16px]">Phiếu dịch vụ</h2>
          <p class="font-mono text-[13px]">{{ workOrder.code }}</p>
          <AyStatusTag :status="workOrder.status" class="mt-1" />
          <AyButton :to="`/admin/work-orders/${workOrder.id}`" variant="secondary" size="sm" block class="mt-3">
            Mở phiếu dịch vụ
          </AyButton>
        </section>

        <section class="card">
          <h2 class="mb-2 font-heading text-[16px]">Ghi chú nội bộ</h2>
          <textarea v-model="adminNote" class="input min-h-[100px]" placeholder="Chỉ nhân viên thấy nội dung này" />
          <AyButton variant="secondary" size="sm" class="mt-2" @click="saveNote">Lưu ghi chú</AyButton>
        </section>

        <section class="card">
          <h2 class="mb-3 font-heading text-[16px]">Nhật ký thay đổi</h2>
          <AyChangeLog :entries="historyEntries" />
        </section>
      </div>
    </div>

    <AyConfirmDialog
      :open="confirmAction !== null"
      :title="
        confirmAction === 'CONFIRM' ? 'Xác nhận lịch hẹn'
        : confirmAction === 'CANCEL' ? 'Hủy lịch hẹn'
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
          <input :id="fieldId" v-model="cancelReason" class="input" type="text">
        </template>
      </AyField>
    </AyConfirmDialog>
  </div>
</template>
