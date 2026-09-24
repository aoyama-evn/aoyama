<script setup lang="ts">
import jsQR from 'jsqr';

/**
 * CP-18 May quet ma QR — SA-07.
 * Luon co o nhap tay du phong: camera cua may quay quay hong, anh sang yeu,
 * hoac ma bi xuoc deu la tinh huong that o quay le tan (FR-QR-08).
 */
const emit = defineEmits<{ (e: 'scanned', token: string): void; (e: 'manual', code: string): void }>();

const ui = useUiStore();
const video = ref<HTMLVideoElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const scanning = ref(false);
const manualCode = ref('');

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

function submitManual(): void {
  const code = manualCode.value.trim().toUpperCase();
  if (code) emit('manual', code);
}

onBeforeUnmount(stop);
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="ay-card flex flex-col items-center gap-3">
      <div class="relative w-full max-w-sm overflow-hidden rounded-2xl bg-neutral-900" style="aspect-ratio: 1">
        <video ref="video" class="h-full w-full object-cover" playsinline muted />
        <div
          v-if="!scanning"
          class="absolute inset-0 grid place-items-center text-center text-[13px] text-neutral-300"
        >
          Camera chưa bật
        </div>
        <div
          v-else
          class="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/80"
          aria-hidden="true"
        />
      </div>
      <canvas ref="canvas" class="hidden" />

      <AyButton v-if="!scanning" @click="start">Bật camera quét mã</AyButton>
      <AyButton v-else variant="secondary" @click="stop">Tắt camera</AyButton>
    </div>

    <div class="ay-card">
      <AyField label="Hoặc nhập mã lịch hẹn" hint="Dùng khi camera không đọc được mã">
        <template #default="{ id }">
          <div class="flex gap-2">
            <input
              :id="id" v-model="manualCode" class="ay-input font-heading tracking-widest"
              type="text" placeholder="AY-XXXXXXXX" autocomplete="off"
              @keyup.enter="submitManual"
            >
            <AyButton :disabled="!manualCode.trim()" @click="submitManual">Tra cứu</AyButton>
          </div>
        </template>
      </AyField>
    </div>
  </div>
</template>
