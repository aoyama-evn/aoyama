<script setup lang="ts">
/** CP-15 Nut ghi am — SC-10. Ghi toi da 120 giay, nghe lai, ghi lai. */
const MAX_SECONDS = 120;

/** SC-10 ve nut ghi am thanh mot the nho canh o soan. */
defineProps<{ compact?: boolean }>();

const emit = defineEmits<{ (e: 'recorded', payload: { dataUrl: string; seconds: number }): void }>();

const { t } = useI18n();
const ui = useUiStore();
const recording = ref(false);
const seconds = ref(0);
const audioUrl = ref<string | null>(null);

let recorder: MediaRecorder | null = null;
let chunks: Blob[] = [];
let timer: ReturnType<typeof setInterval> | null = null;

async function start(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) {
    ui.error(t('rec.noSupport'), t('rec.useText'));
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
    ui.error(t('rec.noMic'), t('rec.micPerm'));
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
    <button
      v-if="!recording && !audioUrl"
      type="button"
      class="btn btn-secondary gap-1.5"
      :class="compact ? 'text-[12px]' : 'text-[12.5px]'"
      @click="start"
    >
      <svg
        width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.75" stroke-linecap="round" aria-hidden="true"
      >
        <path d="M12 3v12M12 19v2M8 8v6M16 7v8M4 10v2M20 10v2" />
      </svg>
      {{ compact ? $t('sc10.voice') : $t('sc10.recordDesc') }}
    </button>

    <template v-if="recording">
      <span class="tag bg-danger-bg text-danger">
        <span class="h-2 w-2 animate-pulse rounded-full bg-current" aria-hidden="true" />
        {{ $t('rec.recording', { time: display }) }}
      </span>
      <AyButton variant="secondary" size="sm" @click="stop">{{ $t('rec.stop') }}</AyButton>
    </template>

    <template v-if="audioUrl && !recording">
      <audio :src="audioUrl" controls class="h-9" />
      <AyButton variant="ghost" size="sm" @click="reset">{{ $t('rec.again') }}</AyButton>
    </template>
  </div>
</template>
