<script setup lang="ts">
/** SY-05 Phien dang nhap het han. */
definePageMeta({ layout: 'blank' });

const { t } = useI18n();
const auth = useAuthStore();
const route = useRoute();

const isAdminSession = computed(() => route.query.scope === 'admin' || auth.isAdmin);

onMounted(() => auth.clear());

useHead({ title: () => t('sy.expiredTitle') });
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-neutral-200 px-4">
    <div class="card w-full max-w-md text-center">
      <h1 class="font-heading text-[20px]">{{ $t('sy.expiredTitle') }}</h1>
      <p class="mt-2 text-[13.5px] text-muted">
        {{ $t('sy.expiredLead') }}
      </p>
      <AyButton :to="isAdminSession ? '/admin/login' : '/login'" class="mt-5">{{ $t('sy.loginAgain') }}</AyButton>
    </div>
  </div>
</template>
