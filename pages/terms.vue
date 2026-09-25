<script setup lang="ts">
/** SC-09 Dieu khoan su dung. */
const { t } = useI18n();

/** Nam muc cua ban thiet ke; moi muc mot cap tieu de / doan van. */
const SECTIONS = [1, 2, 3, 4, 5];

useHead({ title: () => `${t('terms.title')} — AOYAMA Service` });
</script>

<template>
  <article class="prose-ay flex max-w-prose flex-col gap-4">
    <AyPageHeader code="SC-09" :title="$t('terms.title')" />

    <section class="card flex flex-col gap-3 text-[14px] leading-relaxed">
      <template v-for="n in SECTIONS" :key="n">
        <h2 class="font-heading text-[16px]">{{ $t(`terms.h${n}`) }}</h2>
        <p>{{ $t(`terms.p${n}`) }}</p>
      </template>
    </section>

    <p class="text-[12.5px] text-muted">
      <i18n-t keypath="terms.seeAlso" tag="span">
        <template #link>
          <NuxtLink to="/privacy" class="underline">{{ $t('privacy.title') }}</NuxtLink>
        </template>
      </i18n-t>
    </p>
  </article>
</template>
