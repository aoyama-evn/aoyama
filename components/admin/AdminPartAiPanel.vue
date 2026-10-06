<script setup lang="ts">
import type { PartRecognition } from '~/types/models';

/**
 * SA-27 Nhan dang phu tung tu anh — AI-04, BR-43.
 *
 * Truoc day la mot man rieng: nhan vien tai anh len o do, bam nhan dang,
 * roi he thong nem ho sang bieu mau SA-26 kem du lieu dien san qua duong
 * dan. Di mot vong nhu the chi de dien may o, ma quay lai sua anh thi
 * phai lam lai tu dau. Gio nam ngay canh bieu mau.
 *
 * BR-43 — AI khong tu luu. Nhan dang xong van phai bam "dien vao bieu
 * mau", roi nguoi kiem tra va bam luu nhu thuong.
 */
const emit = defineEmits<{ (e: 'apply', value: PartRecognition): void }>();

const api = useApi();
const ui = useUiStore();
const { t, locale } = useI18n();

const images = ref<string[]>([]);
const analyzing = ref(false);

/**
 * Nhan dang xong la dien thang vao bieu mau.
 *
 * Truoc day ket qua nam trong mot khung rieng, nguoi nhap doc roi bam
 * them mot nut "dien vao bieu mau" nua. Khung do chep lai dung nhung gi
 * sap hien o bieu mau ngay ben canh, nen chi la mot buoc thua.
 *
 * BR-43 van giu: AI khong tu luu. Du lieu mot vao o la nguoi doc lai,
 * sua cho nao sai, roi moi bam Luu.
 */
async function analyze(): Promise<void> {
  if (images.value.length === 0) {
    ui.warning(t('sa27.needPhoto'));
    return;
  }
  analyzing.value = true;
  try {
    const found = await api.post<PartRecognition>(
      `/admin/ai/part-recognition?lang=${locale.value}`,
      { imageUrls: images.value },
    );
    if (found.isFallback) {
      ui.info(t('sa27.noMatch'), t('sa27.noMatchSub'));
      return;
    }
    emit('apply', { ...found, imageUrls: images.value });
    // Noi that ket qua den tu dau, khong de nguoi nhap tuong may vua doc anh.
    if (found.isDemo) ui.info(t('sa27.demoTitle'), t('sa27.demoSub'));
    else ui.success(t('sa27.applied'), t('sa27.disclaimer'));
  } catch (error) {
    ui.error(normalizeError(error).message, t('sa27.errorSub'));
  } finally {
    analyzing.value = false;
  }
}
</script>

<template>
  <section class="card gap-3" style="background: #fff">
    <div class="flex items-center gap-2">
      <h5>{{ $t('sa27.title') }}</h5>
      <AyAiBadge />
    </div>
    <p class="text-muted text-[12.5px] leading-[1.5]">{{ $t('sa27.lead') }}</p>

    <AyImageUpload v-model="images" :label="$t('sa27.photoLabel')" :max="3" />
    <AyButton size="sm" :loading="analyzing" :disabled="images.length === 0" @click="analyze">
      {{ $t('sa27.recognise') }}
    </AyButton>
  </section>
</template>
