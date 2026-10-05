<script setup lang="ts">
import type { PartRecognition } from '~/types/models';

/** SA-27 Nhap lieu phu tung bang AI — FR-PRT-04..07, AI-04, BR-43. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const { t, locale } = useI18n();
const api = useApi();
const ui = useUiStore();

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

/**
 * BR-43 — AI khong tu luu. Du lieu chuyen sang bieu mau SA-26 de nguoi kiem tra
 * roi moi bam luu.
 */
function reviewAndSave(): void {
  if (!result.value) return;
  const prefill = {
    name: result.value.name,
    maker: result.value.maker,
    makerPartNo: result.value.makerPartNo,
    category: result.value.category,
    specification: result.value.specification,
    compatibleVehicles: result.value.compatibleVehicles,
  };
  navigateTo(`/admin/parts/new/edit?prefill=${encodeURIComponent(JSON.stringify(prefill))}`);
}

setScreenTitle(() => t('sa27.title'));
useHead({ title: () => `${t('sa27.title')} — AOYAMA Admin` });
</script>

<template>
  <div class="admin-form">
    <AyPageHeader
      code="SA-27" :title="$t('sa27.title')" back-to="/admin/parts"
      :description="$t('sa27.lead')"
    >
      <template #actions>
        <AyAiBadge />
      </template>
    </AyPageHeader>

    <section class="card flex flex-col gap-3" style="background: #fff">
      <AyImageUpload v-model="images" :label="$t('sa27.photoLabel')" :max="3" />
      <AyButton :loading="analyzing" :disabled="images.length === 0" @click="analyze">
        {{ $t('sa27.recognise') }}
      </AyButton>
    </section>

    <section v-if="result && !result.isFallback" class="card flex flex-col gap-3" style="background: #fff">
      <div class="flex items-center gap-2">
        <h2 class="font-heading text-[16px]">{{ $t('sa27.result') }}</h2>
        <AyAiBadge :confidence="result.confidence ?? null" />
      </div>

      <dl class="grid gap-2 text-[14px] sm:grid-cols-2">
        <div><dt class="text-muted">{{ $t('sa27.colName') }}</dt><dd>{{ result.name ?? '—' }}</dd></div>
        <div><dt class="text-muted">{{ $t('sa25.colMaker') }}</dt><dd>{{ result.maker ?? '—' }}</dd></div>
        <div><dt class="text-muted">{{ $t('sa26.makerPartNo') }}</dt><dd class="font-mono">{{ result.makerPartNo ?? '—' }}</dd></div>
        <div><dt class="text-muted">{{ $t('sa25.colCategory') }}</dt><dd>{{ result.category ?? '—' }}</dd></div>
        <div class="ay-col-full"><dt class="text-muted">{{ $t('sa26.spec') }}</dt><dd>{{ result.specification ?? '—' }}</dd></div>
        <div v-if="result.compatibleVehicles?.length" class="ay-col-full">
          <dt class="text-muted">{{ $t('sa26.compatible') }}</dt>
          <dd>
            <ul class="mt-1 flex flex-wrap gap-1.5">
              <li v-for="v in result.compatibleVehicles" :key="v" class="tag bg-neutral-200 text-neutral-700">
                {{ v }}
              </li>
            </ul>
          </dd>
        </div>
      </dl>

      <p class="rounded-xl bg-warning-bg px-3 py-2 text-[12.5px] text-warning">
        {{ $t('sa27.disclaimer') }}
      </p>

      <!--
        Noi that ket qua nay den tu dau. Khong de nhan vien tuong may da
        doc duoc anh trong khi thuc ra day la du lieu mau.
      -->
      <p
        v-if="result.isDemo"
        class="rounded-xl px-3 py-2 text-[12px] leading-[1.5]"
        style="background: var(--color-accent-2-100); color: var(--color-accent-2-800)"
      >
        {{ $t('sa27.demoNote') }}
      </p>

      <div class="admin-actions">
        <AyButton variant="secondary" @click="result = null">{{ $t('sa27.again') }}</AyButton>
        <AyButton @click="reviewAndSave">{{ $t('sa27.reviewSave') }}</AyButton>
      </div>
    </section>

    <section v-else-if="result?.isFallback" class="card flex flex-col gap-2">
      <p class="text-[14px] font-semibold">{{ $t('sa27.failTitle') }}</p>
      <p class="text-[13px] text-muted">
        {{ $t('sa27.failLead') }}
      </p>
      <AyButton to="/admin/parts/new/edit" variant="secondary" size="sm" class="self-start">
        {{ $t('sa27.manualCta') }}
      </AyButton>
    </section>
  </div>
</template>
