<script setup lang="ts">
/** SC-09 Chinh sach du lieu — NFR-SE-11. */
const { t } = useI18n();

/** Nam muc cua ban thiet ke; moi muc mot cap tieu de / doan van. */
const SECTIONS = [1, 2, 3, 4, 5];

useHead({ title: () => `${t('privacy.title')} — AOYAMA Service` });
</script>

<template>
  <article class="flex max-w-prose flex-col gap-4">
    <AyPageHeader code="SC-09" :title="$t('privacy.title')" />

    <section class="card flex flex-col gap-3 text-[14px] leading-relaxed">
      <template v-for="n in SECTIONS" :key="n">
        <h2 class="font-heading text-[16px]">{{ $t(`privacy.h${n}`) }}</h2>
        <p>{{ $t(`privacy.p${n}`) }}</p>
      </template>
    </section>
  </article>
</template>
