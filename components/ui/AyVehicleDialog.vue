<script setup lang="ts">
import type { VehicleFormValue } from '~/components/ui/AyVehicleForm.vue';
import type { ApiError, Vehicle } from '~/types/models';
import { VehicleFuelType } from '~/types/enums';

/**
 * CP-13b Popup them xe nhanh — dung o SC-12 va SC-14.
 *
 * Ban thiet ke goi openBikeModal ngay tai buoc dat lich: them xe khong duoc
 * keo khach ra khoi luong dat lich. Truoc day nut nay dan sang trang SC-30,
 * luu xong lai do khach ve danh sach xe trong tai khoan nen ho mat cho dang
 * dat do.
 *
 * Bam luu thi tra chiec xe vua tao ve cho man hinh goi; bam quay lai hay bam
 * ra ngoai thi dong lai, khong tao gi ca.
 */
const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: 'saved', vehicle: Vehicle): void; (e: 'close'): void }>();

const { t } = useI18n();
const api = useApi();
const ui = useUiStore();
const overlayTarget = useOverlayTarget();

function blank(): VehicleFormValue {
  return {
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
  };
}

const form = ref<VehicleFormValue>(blank());
const errors = reactive<Record<string, string>>({});
const saving = ref(false);
const error = ref<ApiError | null>(null);

/** Moi lan mo lai la mot to giay trang, khong giu lai lan go do dang truoc. */
watch(
  () => props.open,
  (open) => {
    if (!open) return;
    form.value = blank();
    Object.keys(errors).forEach((key) => delete errors[key]);
    error.value = null;
  },
);

// Cung bo kiem tra voi SC-30 de hai duong vao khong doi hoi khac nhau.
function validate(): boolean {
  Object.keys(errors).forEach((key) => delete errors[key]);
  if (!form.value.plateNumber.trim()) errors.plateNumber = t('validate.plate');
  if (!form.value.maker.trim()) errors.maker = t('sc30.makerRequired');
  if (!form.value.model.trim()) errors.model = t('validate.model');
  return Object.keys(errors).length === 0;
}

async function save(): Promise<void> {
  if (!validate()) return;
  saving.value = true;
  error.value = null;
  try {
    const saved = await api.post<Vehicle>('/account/vehicles', form.value);
    ui.success(t('sc30.added'));
    emit('saved', saved);
  } catch (caught) {
    error.value = normalizeError(caught);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Teleport :to="overlayTarget">
    <div
      v-if="open"
      class="ay-overlay z-50 grid place-items-center px-4"
      style="background: rgb(32 30 29 / 50%)"
      role="dialog"
      aria-modal="true"
      :aria-label="$t('sc30.addTitle')"
      @click.self="emit('close')"
    >
      <form
        class="card w-full gap-3"
        style="max-height: 86%; overflow-y: auto"
        @submit.prevent="save"
      >
        <div class="flex items-center gap-2">
          <h4 class="min-w-0 flex-1">{{ $t('sc30.addTitle') }}</h4>
          <button
            type="button"
            class="btn btn-ghost flex-none p-1 text-[16px] leading-none"
            :aria-label="$t('common.close')"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <AyVehicleForm v-model="form" :errors="errors" />

        <AyErrorNote :error="error" />

        <button
          type="submit"
          class="btn btn-primary btn-block"
          style="min-height: 46px; margin: 0"
          :disabled="saving"
        >
          {{ saving ? $t('common.saving') : $t('sc30.save') }}
        </button>

        <button
          type="button"
          class="btn btn-ghost self-center text-[13px]"
          @click="emit('close')"
        >
          {{ $t('common.back') }}
        </button>
      </form>
    </div>
  </Teleport>
</template>
