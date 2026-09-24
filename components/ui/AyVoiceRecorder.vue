<script setup lang="ts">
/** CP-15 Nut ghi am — SC-10. Ghi toi da 120 giay, nghe lai, ghi lai. */
const MAX_SECONDS = 120;

const emit = defineEmits<{ (e: 'recorded', payload: { dataUrl: string; seconds: number }): void }>();

const ui = useUiStore();
const recording = ref(false);
const seconds = ref(0);
const audioUrl = ref<string | null>(null);

let recorder: MediaRecorder | null = null;
let chunks: Blob[] = [];
let timer: ReturnType<typeof setInterval> | null = null;

async function start(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) {
    ui.error('Trình duyệt không hỗ trợ ghi âm', 'Bạn có thể mô tả bằng văn bản thay thế.');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => chunks.push(event.data);
    recorder.onstop = () => {
      // Dong micro ngay khi ngung ghi, khong giu quyen truy cap thua.
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks, { type: recorder?.mimeType ?? 'audio/webm' });
      const reader = new FileReader();
      reader.onload = () => {
        audioUrl.value = String(reader.result);
        emit('recorded', { dataUrl: audioUrl.value, seconds: seconds.value });
      };
      reader.readAsDataURL(blob);
    };

    recorder.start();
    recording.value = true;
    seconds.value = 0;
    timer = setInterval(() => {
      seconds.value += 1;
      if (seconds.value >= MAX_SECONDS) stop();
    }, 1000);
  } catch {
    ui.error('Không truy cập được micro', 'Hãy cho phép quyền ghi âm trong trình duyệt.');
  }
}

function stop(): void {
  if (timer) { clearInterval(timer); timer = null; }
  recorder?.stop();
  recording.value = false;
}

function reset(): void {
  audioUrl.value = null;
  seconds.value = 0;
}

onBeforeUnmount(() => { if (timer) clearInterval(timer); recorder?.stop(); });

const display = computed(() => {
  const m = Math.floor(seconds.value / 60);
  const s = seconds.value % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
});
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <AyButton v-if="!recording && !audioUrl" variant="secondary" size="sm" @click="start">
      <template #icon>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
          <path d="M12 3v12M12 19v2M8 8v6M16 7v8M4 10v2M20 10v2" />
        </svg>
      </template>
      Ghi âm mô tả
    </AyButton>

    <template v-if="recording">
      <span class="tag bg-danger-bg text-danger">
        <span class="h-2 w-2 animate-pulse rounded-full bg-current" aria-hidden="true" />
        Đang ghi {{ display }} / 2:00
      </span>
      <AyButton variant="secondary" size="sm" @click="stop">Dừng</AyButton>
    </template>

    <template v-if="audioUrl && !recording">
      <audio :src="audioUrl" controls class="h-9" />
      <AyButton variant="ghost" size="sm" @click="reset">Ghi lại</AyButton>
    </template>
  </div>
</template>
