<script setup lang="ts">
import { VehicleFuelType } from '~/types/enums';

/**
 * CP-13 Bieu mau thong tin xe — SC-14, SC-30, SA-21.
 * Ban thiet ke xep hai cot: hang / dong xe, nhien lieu / bien so, roi so km va
 * ten goi nho trai het hai cot. Anh xe la o rieng o duoi.
 */
export interface VehicleFormValue {
  plateNumber: string;
  maker: string;
  model: string;
  modelYear?: number | null;
  engineCc?: number | null;
  color?: string | null;
  currentOdometer?: number | null;
  nickname?: string | null;
  fuelType?: VehicleFuelType;
  photoUrls?: string[];
  note?: string | null;
}

const props = withDefaults(
  defineProps<{
    modelValue: VehicleFormValue;
    errors?: Record<string, string>;
    /** SC-14 chi hoi nhung o toi thieu; SC-30 va SA-21 hoi day du. */
    compact?: boolean;
  }>(),
  { compact: false },
);
const emit = defineEmits<{ (e: 'update:modelValue', v: VehicleFormValue): void }>();

function set<K extends keyof VehicleFormValue>(key: K, value: VehicleFormValue[K]): void {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

// Danh sach hang dung chung voi chatbox — xem composables/useVehicleMakers.ts
const { t } = useI18n();
const { withOther: MAKERS } = useVehicleMakers();

const FUELS = computed(() => [
  { value: VehicleFuelType.GASOLINE, label: t('vehicle.fuelGasoline') },
  { value: VehicleFuelType.ELECTRIC, label: t('vehicle.fuelElectric') },
  { value: VehicleFuelType.HYBRID, label: t('vehicle.fuelHybrid') },
]);

const photos = computed({
  get: () => props.modelValue.photoUrls ?? [],
  set: (value: string[]) => set('photoUrls', value),
});
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <div class="grid grid-cols-2 gap-2.5">
      <AyField :label="$t('sc14.maker')" required :error="errors?.maker">
        <template #default="{ id }">
          <select
            :id="id"
            class="input"
            :value="modelValue.maker"
            @change="set('maker', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">{{ $t('vehicle.pickMaker') }}</option>
            <option v-for="m in MAKERS" :key="m" :value="m">{{ m }}</option>
          </select>
        </template>
      </AyField>

      <AyField :label="$t('sc14.model')" required :error="errors?.model">
        <template #default="{ id }">
          <input
            :id="id"
            class="input"
            type="text"
            :value="modelValue.model"
            placeholder="Lead 125"
            @input="set('model', ($event.target as HTMLInputElement).value)"
          />
        </template>
      </AyField>

      <AyField :label="$t('vehicle.fuel')" required>
        <template #default="{ id }">
          <select
            :id="id"
            class="input"
            :value="modelValue.fuelType ?? VehicleFuelType.GASOLINE"
            @change="set('fuelType', ($event.target as HTMLSelectElement).value as VehicleFuelType)"
          >
            <option v-for="fuel in FUELS" :key="fuel.value" :value="fuel.value">
              {{ fuel.label }}
            </option>
          </select>
        </template>
      </AyField>

      <AyField :label="$t('sc14.plate')" required :error="errors?.plateNumber">
        <template #default="{ id, invalid }">
          <input
            :id="id"
            class="input"
            type="text"
            :aria-invalid="invalid"
            :value="modelValue.plateNumber"
            placeholder="34A1-234.56"
            @input="set('plateNumber', ($event.target as HTMLInputElement).value)"
          />
        </template>
      </AyField>

      <div class="col-span-2">
        <AyField :label="$t('sc14.odometer')">
          <template #default="{ id }">
            <input
              :id="id"
              class="input"
              type="number"
              inputmode="numeric"
              min="0"
              :value="modelValue.currentOdometer ?? ''"
              @input="set('currentOdometer', Number(($event.target as HTMLInputElement).value) || null)"
            />
          </template>
        </AyField>
      </div>

      <div class="col-span-2">
        <AyField :label="$t('vehicle.nickname')">
          <template #default="{ id }">
            <input
              :id="id"
              class="input"
              type="text"
              :value="modelValue.nickname ?? ''"
              :placeholder="$t('vehicle.nicknamePlaceholder')"
              @input="set('nickname', ($event.target as HTMLInputElement).value)"
            />
          </template>
        </AyField>
      </div>

      <template v-if="!compact">
        <AyField :label="$t('sc14.engineCc')" :hint="$t('vehicle.ccHint')">
          <template #default="{ id }">
            <input
              :id="id"
              class="input"
              type="number"
              min="0"
              :value="modelValue.engineCc ?? ''"
              @input="set('engineCc', Number(($event.target as HTMLInputElement).value) || null)"
            />
          </template>
        </AyField>

        <AyField :label="$t('vehicle.modelYear')">
          <template #default="{ id }">
            <input
              :id="id"
              class="input"
              type="number"
              min="1970"
              :max="new Date().getFullYear()"
              :value="modelValue.modelYear ?? ''"
              @input="set('modelYear', Number(($event.target as HTMLInputElement).value) || null)"
            />
          </template>
        </AyField>

        <AyField :label="$t('vehicle.color')">
          <template #default="{ id }">
            <input
              :id="id"
              class="input"
              type="text"
              :value="modelValue.color ?? ''"
              @input="set('color', ($event.target as HTMLInputElement).value)"
            />
          </template>
        </AyField>
      </template>
    </div>

    <template v-if="!compact">
      <AyField :label="$t('vehicle.photos')">
        <AyImageUpload v-model="photos" :max="4" />
      </AyField>

      <AyField :label="$t('common.note')">
        <template #default="{ id }">
          <textarea
            :id="id"
            class="input min-h-[80px]"
            :value="modelValue.note ?? ''"
            @input="set('note', ($event.target as HTMLTextAreaElement).value)"
          />
        </template>
      </AyField>
    </template>
  </div>
</template>
