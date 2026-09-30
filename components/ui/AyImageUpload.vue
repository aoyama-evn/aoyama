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

const { t } = useI18n();
const ui = useUiStore();
const dragging = ref(false);
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

/**
 * Giai doan nay anh duoc doc thanh data URL de xem truoc va gui kem yeu cau.
 * Khi co dich vu luu tru tep, thay cho nay bang mot lan tai len roi giu lai URL.
 *
 * Vi anh di thang trong than yeu cau, phai thu nho truoc khi ma hoa. Anh chup
 * dien thoai thuong 3–5 MB, ma hoa base64 con phinh them 37%: ba anh la vuot
 * gioi han 15 MB cua may chu va yeu cau do 500. Thu ve canh dai 1600px roi
 * xuat JPEG chat luong 0,82 thi moi anh con vai tram KB, van du ro de soi vet
 * xuoc tren man hinh.
 */
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;
/** Duoi muc nay thi anh da du nhe, giu nguyen cho khoi ma hoa lai mat net. */
const KEEP_AS_IS_BYTES = 600 * 1024;
async function handleFiles(files: FileList | null): Promise<void> {
  if (!files) return;
  const room = props.max - props.modelValue.length;
  if (room <= 0) {
    ui.warning(t('upload.tooMany', { max: props.max }));
    return;
  }

  const accepted: string[] = [];
  for (const file of Array.from(files).slice(0, room)) {
    if (!ACCEPT.includes(file.type)) {
      ui.warning(t('upload.badImage'), file.name);
      continue;
    }
    if (file.size > props.maxSizeMb * 1024 * 1024) {
      ui.warning(t('upload.imageTooBig', { mb: props.maxSizeMb }), file.name);
      continue;
    }
    accepted.push(await toStoredDataUrl(file));
  }
  if (accepted.length > 0) emit('update:modelValue', [...props.modelValue, ...accepted]);
}

/** Thu nho roi ma hoa. Trinh duyet khong giai ma duoc thi giu nguyen tep goc. */
async function toStoredDataUrl(file: File): Promise<string> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // HEIC va vai dinh dang khac canvas khong doc duoc.
    return readAsDataUrl(file);
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= KEEP_AS_IS_BYTES) return readAsDataUrl(file);

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return readAsDataUrl(file);

    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } finally {
    bitmap.close?.();
  }
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
      <p class="text-[13.5px] text-muted">{{ $t('upload.dropHere') }}</p>
      <label class="btn btn-secondary text-[12.5px] mt-2 cursor-pointer">
        {{ $t('upload.pickImage') }}
        <input type="file" class="sr-only" multiple :accept="ACCEPT.join(',')"
          @change="handleFiles(($event.target as HTMLInputElement).files)">
      </label>
      <p class="mt-2 text-[11.5px] text-muted">
        {{ $t('upload.imageLimit', { max, mb: maxSizeMb }) }}
      </p>
    </div>

    <ul v-if="modelValue.length" class="flex flex-wrap gap-2">
      <li v-for="(url, index) in modelValue" :key="index" class="relative">
        <img :src="url" alt="" class="h-20 w-20 rounded-xl object-cover">
        <button
          type="button"
          class="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-neutral-900 text-white"
          :aria-label="$t('upload.removeImage', { n: index + 1 })"
          @click="remove(index)"
        >
          ×
        </button>
      </li>
    </ul>
  </div>
</template>
