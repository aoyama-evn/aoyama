<script setup lang="ts">
/** SY-05 Phien dang nhap het han. */
definePageMeta({ layout: 'blank' });

const auth = useAuthStore();
const route = useRoute();

const isAdminSession = computed(() => route.query.scope === 'admin' || auth.isAdmin);

onMounted(() => auth.clear());

useHead({ title: 'Phiên đăng nhập đã hết hạn' });
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-neutral-200 px-4">
    <div class="card w-full max-w-md text-center">
      <h1 class="font-heading text-[20px]">Phiên đăng nhập đã hết hạn</h1>
      <p class="mt-2 text-[13.5px] text-muted">
        Vì lý do an toàn, phiên làm việc tự kết thúc sau một thời gian không hoạt động.
        Vui lòng đăng nhập lại để tiếp tục.
      </p>
      <AyButton :to="isAdminSession ? '/admin/login' : '/login'" class="mt-5">Đăng nhập lại</AyButton>
    </div>
  </div>
</template>
