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
const result = ref<PartRecognition | null>(null);
const analyzing = ref(false);

async function analyze(): Promise<void> {
  if (images.value.length === 0) {
    ui.warning(t('sa27.needPhoto'));
    return;
  }
  analyzing.value = true;
  result.value = null;
  try {
    result.value = await api.post<PartRecognition>(
      `/admin/ai/part-recognition?lang=${locale.value}`,
      { imageUrls: images.value },
    );
    if (result.value.isFallback) {
      ui.info(t('sa27.noMatch'), t('sa27.noMatchSub'));
    } else if (result.value.isDemo) {
      ui.info(t('sa27.demoTitle'), t('sa27.demoSub'));
    }
  } catch (error) {
    ui.error(normalizeError(error).message, t('sa27.errorSub'));
  } finally {
    analyzing.value = false;
  }
}

/** Dong anh vua nhan dang vao bieu mau luon, de nguoi nhap khoi tai lai. */
function apply(): void {
  if (!result.value) return;
  emit('apply', { ...result.value, imageUrls: images.value });
  ui.success(t('sa27.applied'));
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

    <template v-if="result && !result.isFallback">
      <div class="flex items-center gap-2">
        <h5 class="text-[14px]">{{ $t('sa27.result') }}</h5>
        <AyAiBadge :confidence="result.confidence ?? null" />
      </div>

      <dl class="flex flex-col gap-1.5 text-[13px]">
        <div><dt class="text-muted text-[11.5px]">{{ $t('sa27.colName') }}</dt><dd>{{ result.name ?? '—' }}</dd></div>
        <div><dt class="text-muted text-[11.5px]">{{ $t('sa25.colMaker') }}</dt><dd>{{ result.maker ?? '—' }}</dd></div>
        <div>
          <dt class="text-muted text-[11.5px]">{{ $t('sa26.makerPartNo') }}</dt>
          <dd class="font-mono">{{ result.makerPartNo ?? '—' }}</dd>
        </div>
        <div><dt class="text-muted text-[11.5px]">{{ $t('sa25.colCategory') }}</dt><dd>{{ result.category ?? '—' }}</dd></div>
        <div><dt class="text-muted text-[11.5px]">{{ $t('sa26.spec') }}</dt><dd>{{ result.specification ?? '—' }}</dd></div>
        <div v-if="result.compatibleVehicles?.length">
          <dt class="text-muted text-[11.5px]">{{ $t('sa26.compatible') }}</dt>
          <dd>
            <ul class="mt-1 flex flex-wrap gap-1.5">
              <li v-for="v in result.compatibleVehicles" :key="v" class="tag bg-neutral-200 text-neutral-700">
                {{ v }}
              </li>
            </ul>
          </dd>
        </div>
      </dl>

      <p class="rounded-xl bg-warning-bg px-3 py-2 text-[12px] leading-[1.5] text-warning">
        {{ $t('sa27.disclaimer') }}
      </p>

      <!--
        Noi that ket qua nay den tu dau. Khong de nhan vien tuong may da
        doc duoc anh trong khi thuc ra day la du lieu mau.
      -->
      <p
        v-if="result.isDemo"
        class="rounded-xl px-3 py-2 text-[11.5px] leading-[1.5]"
        style="background: var(--color-accent-2-100); color: var(--color-accent-2-800)"
      >
        {{ $t('sa27.demoNote') }}
      </p>

      <AyButton size="sm" @click="apply">{{ $t('sa27.applyToForm') }}</AyButton>
    </template>

    <p v-else-if="result?.isFallback" class="text-muted text-[12.5px] leading-[1.5]">
      {{ $t('sa27.failLead') }}
    </p>
  </section>
</template>
