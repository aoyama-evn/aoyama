<script setup lang="ts">
/** CP-14 O tai anh — keo tha, xem truoc, gioi han dung luong va loai tep. */
const props = withDefaults(
  defineProps<{
    modelValue: string[];
    max?: number;
    maxSizeMb?: number;
    label?: string;
    /** SC-10 ve o gui anh thanh mot nut nho canh o soan, khong phai o keo tha. */
    compact?: boolean;
  }>(),
  { max: 5, maxSizeMb: 8 },
);
const emit = defineEmits<{ (e: 'update:modelValue', v: string[]): void }>();

const ui = useUiStore();
const dragging = ref(false);
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

/**
 * Giai doan nay anh duoc doc thanh data URL de xem truoc va gui kem yeu cau.
 * Khi co dich vu luu tru tep, thay cho nay bang mot lan tai len roi giu lai URL.
 */
async function handleFiles(files: FileList | null): Promise<void> {
  if (!files) return;
  const room = props.max - props.modelValue.length;
  if (room <= 0) {
    ui.warning(`Chỉ tải được tối đa ${props.max} ảnh`);
    return;
  }

  const accepted: string[] = [];
  for (const file of Array.from(files).slice(0, room)) {
    if (!ACCEPT.includes(file.type)) {
      ui.warning('Chỉ nhận ảnh JPG, PNG, WebP hoặc HEIC', file.name);
      continue;
    }
    if (file.size > props.maxSizeMb * 1024 * 1024) {
      ui.warning(`Ảnh vượt quá ${props.maxSizeMb} MB`, file.name);
      continue;
    }
    accepted.push(await readAsDataUrl(file));
  }
  if (accepted.length > 0) emit('update:modelValue', [...props.modelValue, ...accepted]);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function remove(index: number): void {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index));
}
</script>

<template>
  <label v-if="compact" class="btn btn-secondary cursor-pointer gap-1.5 text-[12px]">
    <svg
      width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m5 17 5-4.5 4 3.5 2.5-2 2.5 3" />
    </svg>
    {{ $t('sc10.photos', { n: modelValue.length, max }) }}
    <input
      type="file" class="sr-only" multiple :accept="ACCEPT.join(',')"
      @change="handleFiles(($event.target as HTMLInputElement).files)"
    >
  </label>

  <div v-else class="flex flex-col gap-2">
    <span v-if="label" class="label">{{ label }}</span>

    <div
      class="rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors"
      :class="dragging ? 'border-accent bg-accent-100' : 'border-neutral-300 bg-surface'"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="dragging = false; handleFiles($event.dataTransfer?.files ?? null)"
    >
      <p class="text-[13.5px] text-muted">Kéo thả ảnh vào đây hoặc</p>
      <label class="btn btn-secondary text-[12.5px] mt-2 cursor-pointer">
        Chọn ảnh
        <input type="file" class="sr-only" multiple :accept="ACCEPT.join(',')"
          @change="handleFiles(($event.target as HTMLInputElement).files)">
      </label>
      <p class="mt-2 text-[11.5px] text-muted">
        Tối đa {{ max }} ảnh, mỗi ảnh dưới {{ maxSizeMb }} MB
      </p>
    </div>

    <ul v-if="modelValue.length" class="flex flex-wrap gap-2">
      <li v-for="(url, index) in modelValue" :key="index" class="relative">
        <img :src="url" alt="" class="h-20 w-20 rounded-xl object-cover">
        <button
          type="button"
          class="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-neutral-900 text-white"
          :aria-label="`Xóa ảnh ${index + 1}`"
          @click="remove(index)"
        >
          ×
        </button>
      </li>
    </ul>
  </div>
</template>
