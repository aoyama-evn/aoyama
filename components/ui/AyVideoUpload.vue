<script setup lang="ts">
/**
 * O gui video ngan — SC-12.
 * Cung cach lam nhu AyImageUpload: doc tep thanh data URL de xem truoc va gui
 * kem yeu cau. Khi co dich vu luu tru tep, thay cho nay bang mot lan tai len
 * roi giu lai URL.
 */
const props = withDefaults(
  defineProps<{
    modelValue: string | null;
    maxSeconds?: number;
    maxSizeMb?: number;
    /** SC-12 ve o nay thanh mot nut nho canh o soan. */
    compact?: boolean;
  }>(),
  { maxSeconds: 30, maxSizeMb: 12 },
);
const emit = defineEmits<{ (e: 'update:modelValue', v: string | null): void }>();

const ui = useUiStore();
const ACCEPT = ['video/mp4', 'video/quicktime', 'video/webm'];

async function handleFile(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  if (!ACCEPT.includes(file.type)) {
    ui.warning('Chỉ nhận video MP4, MOV hoặc WebM', file.name);
    return;
  }
  if (file.size > props.maxSizeMb * 1024 * 1024) {
    ui.warning(`Video vượt quá ${props.maxSizeMb} MB`, file.name);
    return;
  }

  const dataUrl = await readAsDataUrl(file);
  const seconds = await durationOf(dataUrl);
  if (seconds !== null && seconds > props.maxSeconds) {
    ui.warning(`Video dài quá ${props.maxSeconds} giây`, `Đoạn này ${Math.round(seconds)} giây.`);
    return;
  }
  emit('update:modelValue', dataUrl);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Doc do dai video; tra null khi trinh duyet khong doc duoc. */
function durationOf(src: string): Promise<number | null> {
  return new Promise((resolve) => {
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => resolve(Number.isFinite(probe.duration) ? probe.duration : null);
    probe.onerror = () => resolve(null);
    probe.src = src;
  });
}
</script>

<template>
  <label v-if="compact" class="btn btn-secondary cursor-pointer gap-1.5 text-[12px]">
    <svg
      width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
    >
      <rect x="3" y="6" width="13" height="12" rx="3" />
      <path d="m16 10 5-3v10l-5-3" />
    </svg>
    {{ modelValue ? 'Đã có video' : 'Video' }}
    <input type="file" class="sr-only" :accept="ACCEPT.join(',')" @change="handleFile" />
  </label>

  <div v-else class="flex flex-col gap-2">
    <video
      v-if="modelValue"
      :src="modelValue"
      controls
      class="w-full"
      style="border-radius: 16px; max-height: 220px"
    />
    <div class="flex flex-wrap gap-2">
      <label class="btn btn-secondary cursor-pointer text-[12.5px]">
        {{ modelValue ? 'Chọn video khác' : 'Chọn video' }}
        <input type="file" class="sr-only" :accept="ACCEPT.join(',')" @change="handleFile" />
      </label>
      <button
        v-if="modelValue"
        type="button"
        class="btn btn-ghost text-[12.5px]"
        @click="emit('update:modelValue', null)"
      >
        Gỡ video
      </button>
    </div>
    <p class="text-muted text-[11.5px]">
      Tối đa {{ maxSeconds }} giây, dưới {{ maxSizeMb }} MB.
    </p>
  </div>
</template>
