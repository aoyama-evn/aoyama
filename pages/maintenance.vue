<script setup lang="ts">
/** SY-04 Dang bao tri. */
definePageMeta({ layout: 'blank' });
const { t } = useI18n();
useHead({ title: () => t('sy.maintTitle') });
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-neutral-200 px-4">
    <div class="card w-full max-w-md text-center">
      <p class="text-[40px]" aria-hidden="true">🛠</p>
      <h1 class="mt-2 font-heading text-[20px]">{{ $t('sy.maintTitle') }}</h1>
      <p class="mt-2 text-[13.5px] text-muted">
        {{ $t('sy.maintLead') }}
      </p>
    </div>
  </div>
</template>
