<script setup lang="ts">
import type { VehicleFormValue } from '~/components/ui/AyVehicleForm.vue';
import type { ApiError, Vehicle } from '~/types/models';
import { VehicleFuelType } from '~/types/enums';

/**
 * SC-30 Them / sua xe — FR-VEH-01, FR-VEH-02.
 * Den tu luong dat lich (?next=booking) thi luu xong quay lai buoc xac nhan,
 * dung nhu nhanh "Luu va dat lich" cua ban thiet ke.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();
const booking = useBookingStore();

const id = route.params.id as string;
const isNew = id === 'new';
const fromBooking = route.query.next === 'booking';

const form = ref<VehicleFormValue>({
  plateNumber: '',
  maker: '',
  model: '',
  modelYear: null,
  engineCc: null,
  color: null,
  currentOdometer: null,
  nickname: null,
  fuelType: VehicleFuelType.GASOLINE,
  photoUrls: [],
  note: null,
});
const errors = reactive<Record<string, string>>({});
const saving = ref(false);
const error = ref<ApiError | null>(null);

if (!isNew) {
  const { data } = await useAsyncData(`vehicle-${id}`, () =>
    api.get<Vehicle>(`/account/vehicles/${id}`),
  );
  if (data.value) {
    form.value = {
      plateNumber: data.value.plateNumber,
      maker: data.value.maker,
      model: data.value.model,
      modelYear: data.value.modelYear,
      engineCc: data.value.engineCc,
      color: data.value.color,
      currentOdometer: data.value.currentOdometer,
      nickname: data.value.nickname,
      fuelType: data.value.fuelType,
      photoUrls: data.value.photoUrls,
      note: data.value.note,
    };
  }
}

function validate(): boolean {
  Object.keys(errors).forEach((key) => delete errors[key]);
  if (!form.value.plateNumber.trim()) errors.plateNumber = 'Vui lòng nhập biển số';
  if (!form.value.maker.trim()) errors.maker = 'Vui lòng chọn hãng xe';
  if (!form.value.model.trim()) errors.model = 'Vui lòng nhập dòng xe';
  return Object.keys(errors).length === 0;
}

async function save(): Promise<void> {
  if (!validate()) return;
  saving.value = true;
  error.value = null;
  try {
    const saved = isNew
      ? await api.post<Vehicle>('/account/vehicles', form.value)
      : await api.put<Vehicle>(`/account/vehicles/${id}`, form.value);
    ui.success(isNew ? 'Đã thêm xe' : 'Đã lưu thay đổi');

    if (fromBooking) {
      booking.restore();
      booking.setVehicle(saved);
      await navigateTo('/booking/confirm');
      return;
    }
    await navigateTo('/account/vehicles');
  } catch (caught) {
    error.value = normalizeError(caught);
  } finally {
    saving.value = false;
  }
}

useHead({ title: isNew ? 'Thêm xe' : 'Sửa thông tin xe' });
</script>

<template>
  <form class="flex flex-col gap-3 pb-4 pt-1" @submit.prevent="save">
    <h4>{{ isNew ? 'Thêm xe' : 'Thêm / sửa xe' }}</h4>

    <AyVehicleForm v-model="form" :errors="errors" />

    <AyErrorNote :error="error" />

    <button
      type="submit"
      class="btn btn-primary btn-block"
      style="min-height: 48px; font-size: 15px; margin: 0"
      :disabled="saving"
    >
      {{ saving ? 'Đang lưu…' : fromBooking ? 'Lưu và đặt lịch' : 'Lưu xe' }}
    </button>

    <NuxtLink
      :to="fromBooking ? '/booking/confirm' : '/account/vehicles'"
      class="btn btn-ghost self-center text-[13px]"
    >
      {{ fromBooking ? 'Hủy' : '← Quay lại' }}
    </NuxtLink>
  </form>
</template>
