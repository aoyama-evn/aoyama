<script setup lang="ts">
import type { ApiError, Vehicle } from '~/types/models';
import type { VehicleFormValue } from '~/components/ui/AyVehicleForm.vue';

/** SC-30 Them hoac sua xe — FR-VEH-01, FR-VEH-02. */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const api = useApi();
const ui = useUiStore();

const id = route.params.id as string;
const isNew = id === 'new';

const form = ref<VehicleFormValue>({
  plateNumber: '', maker: '', model: '', modelYear: null, engineCc: null,
  color: null, currentOdometer: null, note: null,
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
      note: data.value.note,
    };
  }
}

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k]);
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
    if (isNew) await api.post('/account/vehicles', form.value);
    else await api.put(`/account/vehicles/${id}`, form.value);
    ui.success(isNew ? 'Đã thêm xe' : 'Đã lưu thay đổi');
    await navigateTo('/account/vehicles');
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    saving.value = false;
  }
}

useHead({ title: isNew ? 'Thêm xe' : 'Sửa thông tin xe' });
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-5">
    <AyPageHeader code="SC-30" :title="isNew ? 'Thêm xe' : 'Sửa thông tin xe'" back-to="/account/vehicles" />

    <form class="card flex flex-col gap-4" @submit.prevent="save">
      <AyVehicleForm v-model="form" :errors="errors" />
      <AyErrorNote :error="error" />
      <div class="flex gap-2">
        <AyButton type="submit" :loading="saving">Lưu</AyButton>
        <AyButton to="/account/vehicles" variant="secondary">Hủy</AyButton>
      </div>
    </form>
  </div>
</template>
