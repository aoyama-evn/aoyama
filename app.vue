<script setup lang="ts">
const auth = useAuthStore();

// Doc lai phien tu localStorage ngay khi trinh duyet dung len.
onMounted(() => auth.restore());
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AyToastHost />
  </div>
</template>
