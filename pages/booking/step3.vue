<script setup lang="ts">
import type { Vehicle } from '~/types/models';

/**
 * SC-14 Dat lich buoc 3 — thong tin khach va xe.
 * FR-BOOK-01: Guest chi bat buoc ten va so dien thoai. Khach da dang nhap thi
 * duoc dien san ho so va chon xe da co (FR-BOOK-06..08).
 */
const api = useApi();
const auth = useAuthStore();
const booking = useBookingStore();

const myVehicles = ref<Vehicle[]>([]);
const useExistingVehicle = ref(false);
const errors = reactive<Record<string, string>>({});

onMounted(async () => {
  booking.restore();
  if (!booking.step2Complete) {
    await navigateTo('/booking/step2');
    return;
  }

  if (auth.isCustomer) {
    if (!booking.contactName) booking.contactName = auth.user?.name ?? '';
    if (!booking.contactPhone) booking.contactPhone = auth.user?.phone ?? '';
    try {
      myVehicles.value = await api.get<Vehicle[]>('/account/vehicles');
      if (myVehicles.value.length > 0) useExistingVehicle.value = true;
    } catch {
      // Khong lay duoc danh sach xe thi khach van khai bao tay duoc.
      myVehicles.value = [];
    }
  }
});

function pickVehicle(vehicle: Vehicle): void {
  booking.vehicle = {
    vehicleId: vehicle.id,
    plateNumber: vehicle.plateNumber,
    maker: vehicle.maker,
    model: vehicle.model,
    engineCc: vehicle.engineCc,
    odometer: vehicle.currentOdometer,
  };
  booking.persist();
}

function clearVehicleSelection(): void {
  useExistingVehicle.value = false;
  booking.vehicle = { plateNumber: '', maker: '', model: '', engineCc: null, odometer: null };
}

function validateAndContinue(): void {
  Object.keys(errors).forEach((k) => delete errors[k]);

  if (!booking.contactName.trim()) errors.contactName = 'Vui lòng nhập họ tên';
  if (!booking.contactPhone.trim()) errors.contactPhone = 'Vui lòng nhập số điện thoại';
  else if (!/^[0-9+\-\s()]{8,20}$/.test(booking.contactPhone.trim())) {
    errors.contactPhone = 'Số điện thoại không hợp lệ';
  }

  if (Object.keys(errors).length > 0) return;
  booking.persist();
  navigateTo('/booking/confirm');
}

watch(
  () => [booking.contactName, booking.contactPhone, booking.contactEmail, booking.symptomDescription],
  () => booking.persist(),
);

useHead({ title: 'Đặt lịch — Bước 3' });
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-5">
    <AyPageHeader
      code="SC-14" title="Đặt lịch — Bước 3" back-to="/booking/step2"
      description="Chỉ cần họ tên và số điện thoại là đặt được. Thông tin xe giúp cửa hàng chuẩn bị trước."
    />
    <BookingSteps :current="3" />

    <section class="card grid gap-3 sm:grid-cols-2">
      <h2 class="font-heading text-[16px] sm:col-span-2">Thông tin liên hệ</h2>

      <AyField label="Họ tên" required :error="errors.contactName">
        <template #default="{ id, invalid }">
          <input :id="id" v-model="booking.contactName" class="input" type="text" :aria-invalid="invalid" autocomplete="name">
        </template>
      </AyField>

      <AyField label="Số điện thoại" required :error="errors.contactPhone" hint="Dùng để nhận mã lịch hẹn và nhắc lịch qua SMS">
        <template #default="{ id, invalid }">
          <input :id="id" v-model="booking.contactPhone" class="input" type="tel" :aria-invalid="invalid" autocomplete="tel" placeholder="090-1234-5678">
        </template>
      </AyField>

      <AyField label="Email" hint="Không bắt buộc" class="sm:col-span-2">
        <template #default="{ id }">
          <input :id="id" v-model="booking.contactEmail" class="input" type="email" autocomplete="email">
        </template>
      </AyField>
    </section>

    <section class="card flex flex-col gap-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-heading text-[16px]">Thông tin xe</h2>
        <button
          v-if="myVehicles.length > 0"
          type="button" class="btn btn-ghost text-[12.5px]"
          @click="useExistingVehicle ? clearVehicleSelection() : (useExistingVehicle = true)"
        >
          {{ useExistingVehicle ? 'Khai báo xe khác' : 'Chọn xe đã lưu' }}
        </button>
      </div>

      <div v-if="useExistingVehicle" class="grid gap-2 sm:grid-cols-2">
        <button
          v-for="vehicle in myVehicles" :key="vehicle.id" type="button"
          class="flex flex-col rounded-2xl border px-4 py-3 text-left"
          :class="booking.vehicle.vehicleId === vehicle.id ? 'border-accent bg-accent-100' : 'border-neutral-300 hover:bg-accent-100'"
          style="min-height: 48px"
          :aria-pressed="booking.vehicle.vehicleId === vehicle.id"
          @click="pickVehicle(vehicle)"
        >
          <span class="font-heading text-[15px]">{{ vehicle.plateNumber }}</span>
          <span class="text-[12.5px] text-muted">{{ vehicle.maker }} {{ vehicle.model }}</span>
        </button>
      </div>

      <AyVehicleForm v-else v-model="booking.vehicle" :errors="errors" />
    </section>

    <section class="card flex flex-col gap-3">
      <h2 class="font-heading text-[16px]">Mô tả tình trạng xe</h2>
      <AyField hint="Không bắt buộc, nhưng mô tả càng rõ thì cửa hàng chuẩn bị càng tốt">
        <template #default="{ id }">
          <textarea
            :id="id" v-model="booking.symptomDescription" class="input min-h-[110px]"
            placeholder="Ví dụ: xe kêu lạ khi phanh gấp, phanh trước không ăn"
          />
        </template>
      </AyField>
      <AyImageUpload v-model="booking.symptomPhotoUrls" label="Ảnh tình trạng xe" :max="4" />
    </section>

    <div class="sticky bottom-0 -mx-4 border-t border-divider bg-surface px-4 py-3 ay-safe-bottom">
      <AyButton block @click="validateAndContinue">Xem lại và xác nhận →</AyButton>
    </div>
  </div>
</template>
