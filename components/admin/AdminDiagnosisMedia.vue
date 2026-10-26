<script setup lang="ts">
import type { AiDiagnosis } from '~/types/models';

/**
 * Nhung gi khach gui kem trong phien chan doan — anh, video, ghi am, loi ta.
 *
 * Truoc day may chu luu het nhung khong man nao mo ra duoc: khoi chan doan
 * o SA-05 chi hien khi co ket qua suy doan, ma khach gui moi mot doan video
 * thi khong suy ra duoc gi nen khoi do an luon. Ket qua la khach quay xe,
 * thu am tieng ken ket, gui len — roi khong ai xem.
 *
 * Khoi nay doc lap voi ket qua suy doan: co tep la hien, du may co doan
 * duoc benh hay khong. Day moi la cho tieng ken ket phat huy tac dung —
 * tai nguoi tho nghe ra duoc thu ma may khong nghe ra.
 */
const props = defineProps<{ diagnosis: AiDiagnosis | null }>();

const { dateTime } = useFormat();

/** Gom tep tu moi tin khach gui, giu thu tu thoi gian. */
const anh = computed(() =>
  (props.diagnosis?.messages ?? [])
    .filter((m) => m.role === 'user')
    .flatMap((m) => m.imageUrls ?? []),
);

const video = computed(() =>
  (props.diagnosis?.messages ?? []).filter((m) => m.role === 'user').map((m) => m.videoUrl).filter(Boolean) as string[],
);

const ghiAm = computed(() =>
  (props.diagnosis?.messages ?? []).filter((m) => m.role === 'user').map((m) => m.audioUrl).filter(Boolean) as string[],
);

/** Loi khach ta — go tay hay doc ra chu thi den day deu la chu. */
const loiKhach = computed(() =>
  (props.diagnosis?.messages ?? [])
    .filter((m) => m.role === 'user')
    .map((m) => ({ chu: (m.text || m.transcript || '').trim(), luc: m.at }))
    .filter((x) => x.chu.length > 0),
);

const coGi = computed(
  () => anh.value.length + video.value.length + ghiAm.value.length + loiKhach.value.length > 0,
);

/** Mo anh ra tab moi de xem co lon — anh chup bang dien thoai thuong rat to. */
function moAnh(url: string): void {
  const w = window.open();
  if (w) w.document.write(`<img src="${url}" style="width:100%" alt="">`);
}
</script>

<template>
  <section v-if="coGi" class="card gap-2.5" style="background: #fff">
    <div class="flex items-baseline justify-between gap-2.5">
      <h5>{{ $t('sa05.media.title') }}</h5>
      <span class="text-muted text-[11.5px]">{{ $t('sa05.media.lead') }}</span>
    </div>

    <!-- Loi khach ta, ke ca phan doc ra chu tu giong noi. -->
    <ul v-if="loiKhach.length" class="flex flex-col gap-1.5">
      <li v-for="(dong, i) in loiKhach" :key="i" class="text-[13.5px] leading-[1.55]">
        <span class="text-muted mr-1.5 text-[11.5px]">{{ dateTime(dong.luc) }}</span>
        {{ dong.chu }}
      </li>
    </ul>

    <!-- Anh: bam vao mo to ra tab moi. -->
    <div v-if="anh.length" class="flex flex-wrap gap-2">
      <button
        v-for="(url, i) in anh"
        :key="i"
        type="button"
        class="p-0"
        style="border: 0; background: none; cursor: zoom-in"
        :aria-label="$t('sa05.media.openPhoto', { n: i + 1 })"
        @click="moAnh(url)"
      >
        <img
          :src="url"
          alt=""
          class="object-cover"
          style="width: 86px; height: 86px; border-radius: 14px"
        >
      </button>
    </div>

    <!--
      Video va ghi am de nguyen trinh phat cua trinh duyet: tho can tua di
      tua lai dung doan nghe thay tieng la, ma mot thanh keo tu ve thi khong
      lam duoc tot hon thanh keo san co.
    -->
    <video
      v-for="(url, i) in video"
      :key="`v${i}`"
      :src="url"
      controls
      playsinline
      preload="metadata"
      style="width: 100%; max-width: 320px; border-radius: 14px"
    />

    <div v-if="ghiAm.length" class="flex flex-col gap-1.5">
      <span class="text-muted text-[11.5px]">{{ $t('sa05.media.audio') }}</span>
      <audio v-for="(url, i) in ghiAm" :key="`a${i}`" :src="url" controls class="h-9 w-full" />
    </div>
  </section>
</template>
