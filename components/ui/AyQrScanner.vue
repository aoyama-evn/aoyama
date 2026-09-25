<script setup lang="ts">
import jsQR from 'jsqr';

/**
 * CP-18 May quet ma QR — SA-07.
 * Luon co o nhap tay du phong: camera cua may quay quay hong, anh sang yeu,
 * hoac ma bi xuoc deu la tinh huong that o quay le tan (FR-QR-08).
 */
const emit = defineEmits<{ (e: 'scanned', token: string): void }>();

const ui = useUiStore();
const video = ref<HTMLVideoElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const scanning = ref(false);

let stream: MediaStream | null = null;
let frameId: number | null = null;

async function start(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) {
    ui.warning('Trình duyệt không hỗ trợ camera', 'Hãy nhập mã lịch hẹn bằng tay.');
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
    if (video.value) {
      video.value.srcObject = stream;
      await video.value.play();
    }
    scanning.value = true;
    tick();
  } catch {
    ui.warning('Không mở được camera', 'Hãy cho phép quyền camera hoặc nhập mã bằng tay.');
  }
}

function tick(): void {
  if (!scanning.value || !video.value || !canvas.value) return;

  const v = video.value;
  if (v.readyState === v.HAVE_ENOUGH_DATA) {
    const c = canvas.value;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(v, 0, 0, c.width, c.height);
      const image = ctx.getImageData(0, 0, c.width, c.height);
      const found = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
      if (found?.data) {
        stop();
        emit('scanned', found.data.trim());
        return;
      }
    }
  }
  frameId = requestAnimationFrame(tick);
}

function stop(): void {
  scanning.value = false;
  if (frameId) { cancelAnimationFrame(frameId); frameId = null; }
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
}

/** SA-07 — doc ma tu mot anh da chup, dung khi camera khong san sang. */
async function readFromImage(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file || !canvas.value) return;
  try {
    const bitmap = await createImageBitmap(file);
    const c = canvas.value;
    c.width = bitmap.width;
    c.height = bitmap.height;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(bitmap, 0, 0);
    const image = ctx.getImageData(0, 0, c.width, c.height);
    const found = jsQR(image.data, image.width, image.height);
    if (found?.data) emit('scanned', found.data.trim());
    else ui.warning('Không tìm thấy mã QR trong ảnh', 'Hãy thử ảnh rõ hơn hoặc nhập mã bằng tay.');
  } catch {
    ui.warning('Không đọc được ảnh', 'Hãy nhập mã lịch hẹn bằng tay.');
  }
}

onBeforeUnmount(stop);
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      class="relative grid place-items-center overflow-hidden"
      style="border-radius: 20px; background: #171614; aspect-ratio: 4 / 3"
    >
      <video ref="video" class="h-full w-full object-cover" playsinline muted />

      <p
        v-if="!scanning"
        class="absolute inset-0 grid place-items-center text-[12px]"
        style="color: var(--color-neutral-600)"
      >
        Xem trước camera · camera preview
      </p>

      <!-- Bon goc ngam, dung do day va bo tron cua ban thiet ke -->
      <div
        v-else
        class="pointer-events-none absolute"
        style="width: 58%; aspect-ratio: 1"
        aria-hidden="true"
      >
        <span class="ay-corner ay-corner-tl" />
        <span class="ay-corner ay-corner-tr" />
        <span class="ay-corner ay-corner-bl" />
        <span class="ay-corner ay-corner-br" />
      </div>
    </div>

    <canvas ref="canvas" class="hidden" />

    <div class="flex flex-wrap gap-2.5">
      <button
        v-if="!scanning"
        type="button"
        class="btn btn-secondary text-[12.5px]"
        style="min-height: 44px"
        @click="start"
      >
        Bật camera
      </button>
      <button
        v-else
        type="button"
        class="btn btn-secondary text-[12.5px]"
        style="min-height: 44px"
        @click="stop"
      >
        Tắt camera
      </button>

      <label class="btn btn-secondary cursor-pointer text-[12.5px]" style="min-height: 44px">
        Tải ảnh QR lên
        <input type="file" class="sr-only" accept="image/*" @change="readFromImage" />
      </label>
    </div>
  </div>
</template>

<style scoped>
.ay-corner {
  position: absolute;
  width: 40px;
  height: 40px;
}
.ay-corner-tl {
  top: 0;
  left: 0;
  border-top: 4px solid var(--color-accent-400);
  border-left: 4px solid var(--color-accent-400);
  border-radius: 14px 0 0 0;
}
.ay-corner-tr {
  top: 0;
  right: 0;
  border-top: 4px solid var(--color-accent-400);
  border-right: 4px solid var(--color-accent-400);
  border-radius: 0 14px 0 0;
}
.ay-corner-bl {
  bottom: 0;
  left: 0;
  border-bottom: 4px solid var(--color-accent-400);
  border-left: 4px solid var(--color-accent-400);
  border-radius: 0 0 0 14px;
}
.ay-corner-br {
  bottom: 0;
  right: 0;
  border-bottom: 4px solid var(--color-accent-400);
  border-right: 4px solid var(--color-accent-400);
  border-radius: 0 0 14px 0;
}
</style>
