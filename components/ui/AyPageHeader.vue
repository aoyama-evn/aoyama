<script setup lang="ts">
/**
 * Tieu de man hinh.
 *
 * Ban thiet ke dung hai kieu khac han nhau:
 *  - Site khach hang dat ten ngay trong noi dung: h3 kem mot dong mo ta mo.
 *  - Trang quan tri khong dat ten trong noi dung — ten nam o CP-05, nen o day
 *    chi con duong quay lai va cac nut hanh dong.
 * Ma man hinh chi de doi chieu voi SM-2026-001, khong hien ra giao dien.
 */
const props = defineProps<{
  code?: string;
  title: string;
  description?: string;
  backTo?: string;
}>();

const route = useRoute();
const isAdmin = computed(() => route.path.startsWith('/admin'));

setScreenTitle(() => props.title);
</script>

<template>
  <!--
    Khong dat ca justify-between lan justify-end trong cung mot the: Tailwind
    xep justify-between sau nen no luon thang, hang nut cua trang quan tri bi
    dat ve trai. Chon dung mot lop.
  -->
  <header
    :data-screen="code"
    class="flex flex-wrap items-start gap-3"
    :class="isAdmin ? 'justify-end' : 'justify-between'"
  >
    <div v-if="!isAdmin">
      <NuxtLink v-if="backTo" :to="backTo" class="btn btn-ghost -ml-2 mb-1 text-[12.5px]">
        ← Quay lại
      </NuxtLink>
      <h3 class="m-0">{{ title }}</h3>
      <p v-if="description" class="text-muted mt-1 max-w-prose text-[12.5px]">{{ description }}</p>
    </div>

    <NuxtLink v-else-if="backTo" :to="backTo" class="btn btn-ghost -ml-2 text-[12.5px]">
      ← Quay lại
    </NuxtLink>

    <div class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
