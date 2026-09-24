<script setup lang="ts">
/** CP-13 Bieu mau thong tin xe — SC-14, SC-30, SA-21. */
export interface VehicleFormValue {
  plateNumber: string;
  maker: string;
  model: string;
  modelYear?: number | null;
  engineCc?: number | null;
  color?: string | null;
  currentOdometer?: number | null;
  note?: string | null;
}

const props = defineProps<{ modelValue: VehicleFormValue; errors?: Record<string, string> }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: VehicleFormValue): void }>();

function set<K extends keyof VehicleFormValue>(key: K, value: VehicleFormValue[K]): void {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

const MAKERS = ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Vespa', 'Khác'];
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2">
    <AyField label="Biển số" required :error="errors?.plateNumber" class="sm:col-span-2">
      <template #default="{ id, invalid }">
        <input
          :id="id" class="input" type="text" :aria-invalid="invalid"
          :value="modelValue.plateNumber" placeholder="浜松 あ 12-34"
          @input="set('plateNumber', ($event.target as HTMLInputElement).value)"
        >
      </template>
    </AyField>

    <AyField label="Hãng xe" required :error="errors?.maker">
      <template #default="{ id }">
        <select :id="id" class="input" :value="modelValue.maker"
          @change="set('maker', ($event.target as HTMLSelectElement).value)">
          <option value="">— Chọn hãng —</option>
          <option v-for="m in MAKERS" :key="m" :value="m">{{ m }}</option>
        </select>
      </template>
    </AyField>

    <AyField label="Dòng xe" required :error="errors?.model">
      <template #default="{ id }">
        <input :id="id" class="input" type="text" :value="modelValue.model"
          placeholder="PCX 125" @input="set('model', ($event.target as HTMLInputElement).value)">
      </template>
    </AyField>

    <AyField label="Dung tích (cc)" hint="Dùng để tính giá theo phân khúc xe">
      <template #default="{ id }">
        <input :id="id" class="input" type="number" min="0" :value="modelValue.engineCc ?? ''"
          @input="set('engineCc', Number(($event.target as HTMLInputElement).value) || null)">
      </template>
    </AyField>

    <AyField label="Số km hiện tại">
      <template #default="{ id }">
        <input :id="id" class="input" type="number" min="0" :value="modelValue.currentOdometer ?? ''"
          @input="set('currentOdometer', Number(($event.target as HTMLInputElement).value) || null)">
      </template>
    </AyField>

    <AyField label="Năm sản xuất">
      <template #default="{ id }">
        <input :id="id" class="input" type="number" min="1970" :max="new Date().getFullYear()"
          :value="modelValue.modelYear ?? ''"
          @input="set('modelYear', Number(($event.target as HTMLInputElement).value) || null)">
      </template>
    </AyField>

    <AyField label="Màu xe">
      <template #default="{ id }">
        <input :id="id" class="input" type="text" :value="modelValue.color ?? ''"
          @input="set('color', ($event.target as HTMLInputElement).value)">
      </template>
    </AyField>

    <AyField label="Ghi chú" class="sm:col-span-2">
      <template #default="{ id }">
        <textarea :id="id" class="input min-h-[80px]" :value="modelValue.note ?? ''"
          @input="set('note', ($event.target as HTMLTextAreaElement).value)" />
      </template>
    </AyField>
  </div>
</template>
