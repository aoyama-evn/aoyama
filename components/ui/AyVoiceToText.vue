<script setup lang="ts">
/**
 * CP-15b Noi thay vi go — SC-10, FR-AI-04.
 *
 * Khach dang dung giua duong, xe hong, mot tay cam dien thoai: go mot doan
 * ta trieu chung tren ban phim dien thoai la viec kho chiu nhat trong ca
 * luong. Noi ra thi nhanh hon nhieu.
 *
 * Dung bo nhan dang giong noi san co cua trinh duyet chu khong gui tep len
 * may chu: chu hien ra ngay trong luc noi, khong phai cho tai len roi cho
 * xu ly, va he thong khong phai giu lai ban ghi am giong khach. Trinh duyet
 * nao khong co thi man cha quay ve AyVoiceRecorder — gui thang ban ghi am
 * cho cua hang nghe, van hon la bat khach go.
 *
 * Luu y: Chrome gui am thanh len dich vu nhan dang cua Google de chuyen
 * thanh chu; Safari dung dich vu cua Apple. Day la co che cua trinh duyet,
 * khong phai cua he thong nay.
 */

/** Toi da 120 giay moi lan, bang voi ban ghi am — du de ta mot trieu chung. */
const MAX_SECONDS = 120;

defineProps<{ compact?: boolean }>();

const emit = defineEmits<{
  /** Chu nghe duoc tinh den luc nay, ke ca phan con doan dang do. */
  (e: 'text', value: string): void;
}>();

const { t, locale } = useI18n();
const ui = useUiStore();

const listening = ref(false);
const seconds = ref(0);

type KetQua = { 0: { transcript: string }; isFinal: boolean };
type NhanDang = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<KetQua> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

let nhanDang: NhanDang | null = null;
let dongHo: ReturnType<typeof setInterval> | null = null;
let daChot = '';

/** Ma ngon ngu bo nhan dang can, suy ra tu ngon ngu dang chon tren giao dien. */
const MA_NGON_NGU: Record<string, string> = { ja: 'ja-JP', en: 'en-US', vi: 'vi-VN' };

function boNhanDang(): NhanDang | null {
  if (!import.meta.client) return null;
  const w = window as unknown as { SpeechRecognition?: new () => NhanDang; webkitSpeechRecognition?: new () => NhanDang };
  const Lop = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Lop ? new Lop() : null;
}

function start(): void {
  const bo = boNhanDang();
  if (!bo) {
    ui.error(t('rec.noSupport'), t('rec.useText'));
    return;
  }

  nhanDang = bo;
  bo.lang = MA_NGON_NGU[locale.value] ?? 'ja-JP';
  // continuous: khach ta trieu chung thuong dut quang vai cau, dung lai mot
  // nhip de nghi khong co nghia la ho noi xong.
  bo.continuous = true;
  bo.interimResults = true;
  daChot = '';

  bo.onresult = (e) => {
    let dangDo = '';
    for (let i = e.resultIndex; i < e.results.length; i += 1) {
      const doan = e.results[i][0].transcript;
      if (e.results[i].isFinal) daChot += doan;
      else dangDo += doan;
    }
    // Gui ca phan con dang do de chu chay theo loi noi; chot lai sau.
    emit('text', (daChot + dangDo).trim());
  };

  bo.onerror = (e) => {
    if (e.error === 'no-speech') ui.warning(t('rec.noSpeech'), t('rec.speakCloser'));
    else if (e.error === 'not-allowed') ui.error(t('rec.noMic'), t('rec.micPerm'));
    else if (e.error !== 'aborted') ui.error(t('rec.sttFailed'), t('rec.useText'));
    stop();
  };

  // Bo nhan dang tu ngat khi im lang qua lau; coi nhu nguoi dung da noi xong.
  bo.onend = () => {
    if (listening.value) stop();
  };

  try {
    bo.start();
  } catch {
    ui.error(t('rec.sttFailed'), t('rec.useText'));
    return;
  }

  listening.value = true;
  seconds.value = 0;
  dongHo = setInterval(() => {
    seconds.value += 1;
    if (seconds.value >= MAX_SECONDS) stop();
  }, 1000);
}

function stop(): void {
  if (dongHo) { clearInterval(dongHo); dongHo = null; }
  listening.value = false;
  try { nhanDang?.stop(); } catch { /* da dung roi thi thoi */ }
  nhanDang = null;
}

// Roi khoi man ma con dang nghe thi phai tat micro.
onBeforeUnmount(stop);

const dongHoHien = computed(() => {
  const m = Math.floor(seconds.value / 60);
  const s = seconds.value % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
});
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <button
      v-if="!listening"
      type="button"
      class="btn btn-secondary gap-1.5"
      :class="compact ? 'text-[12px]' : 'text-[12.5px]'"
      @click="start"
    >
      <svg
        width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
      >
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </svg>
      {{ $t('rec.speakToType') }}
    </button>

    <template v-else>
      <span class="tag bg-danger-bg text-danger">
        <span class="h-2 w-2 animate-pulse rounded-full bg-current" aria-hidden="true" />
        {{ $t('rec.listening', { time: dongHoHien }) }}
      </span>
      <AyButton variant="secondary" size="sm" @click="stop">{{ $t('rec.stop') }}</AyButton>
    </template>
  </div>
</template>
