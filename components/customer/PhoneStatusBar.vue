<script setup lang="ts">
/**
 * Thanh trang thai cua khung dien thoai — chi hien khi dang xem tren man hinh
 * rong. Dong ho chay theo gio Nhat Ban (C-03) chu khong phai gio gia trong ban
 * thiet ke, de nhin vao la biet khung nay dang song.
 */
const { date } = useFormat();

const now = ref(new Date());
let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  // Chi can dung tung phut; khong dat dong ho giay cho mot chi tiet trang tri.
  timer = setInterval(() => {
    now.value = new Date();
  }, 30_000);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

const clock = computed(() => date(now.value, 'HH:mm'));
</script>

<template>
  <div
    class="flex flex-none items-center justify-between px-[22px] pb-[3px] pt-[9px] text-[11.5px] font-semibold"
    style="color: var(--color-neutral-800)"
    aria-hidden="true"
  >
    <span class="tabular-nums">{{ clock }}</span>
    <span class="flex items-center gap-1">
      <span
        style="
          display: block;
          width: 15px;
          height: 8px;
          border: 1px solid var(--color-neutral-700);
          border-radius: 2px;
        "
      />
    </span>
  </div>
</template>
