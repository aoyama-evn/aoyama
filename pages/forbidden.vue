<script setup lang="ts">
/** SY-02 Khong co quyen truy cap. */
definePageMeta({ layout: 'blank' });
const { t } = useI18n();
useHead({ title: () => t('sy.forbiddenTitle') });
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-neutral-200 px-4">
    <div class="card w-full max-w-md text-center">
      <p class="font-heading text-[56px] leading-none text-accent-300">403</p>
      <h1 class="mt-2 font-heading text-[20px]">{{ $t('sy.forbiddenTitle') }}</h1>
      <p class="mt-2 text-[13.5px] text-muted">
        {{ $t('sy.forbiddenLead') }}
      </p>
      <div class="mt-5 flex justify-center gap-2">
        <AyButton to="/" variant="secondary" size="sm">{{ $t('common.backHome') }}</AyButton>
        <AyButton to="/admin" size="sm">{{ $t('sy.toAdmin') }}</AyButton>
      </div>
    </div>
  </div>
</template>
