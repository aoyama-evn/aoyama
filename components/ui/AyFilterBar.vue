<script setup lang="ts">
/**
 * CP-07 Thanh loc va tim kiem.
 *
 * Ban thiet ke boc toan bo phan loc trong mot the trang: hang o loc o tren
 * (nut hanh dong chinh day sang phai), roi dai "Dang loc: …" khi co bo loc dat
 * san, cuoi cung la hang the trang thai ngan bang mot duong ke.
 */
defineProps<{
  hasActiveFilters?: boolean;
  /** Dong mo ta bo loc dang ap dung, vi du "Dang loc: Cho xac nhan". */
  activeLabel?: string;
  activeHint?: string;
}>();

const emit = defineEmits<{ (e: 'reset'): void }>();

const slots = useSlots();
</script>

<template>
  <div class="card gap-3" style="background: #fff">
    <div class="flex flex-wrap items-end gap-2.5">
      <slot />
    </div>

    <div
      v-if="activeLabel"
      class="flex flex-wrap items-center gap-2.5 px-3.5 py-2.5 text-[12.5px]"
      style="background: var(--color-accent-100); border-radius: 16px"
    >
      <strong>{{ activeLabel }}</strong>
      <span v-if="activeHint" class="text-muted">{{ activeHint }}</span>
      <button type="button" class="btn btn-ghost ml-auto p-0 text-[12px]" @click="emit('reset')">
        Bỏ lọc
      </button>
    </div>

    <div
      v-if="slots.chips"
      class="flex flex-wrap items-center gap-2 pt-[11px]"
      style="border-top: 1px solid var(--color-divider)"
    >
      <slot name="chips" />
      <button
        v-if="hasActiveFilters"
        type="button"
        class="btn btn-ghost ml-auto p-0 text-[12px]"
        @click="emit('reset')"
      >
        Xóa bộ lọc
      </button>
    </div>

    <button
      v-else-if="hasActiveFilters"
      type="button"
      class="btn btn-ghost self-end p-0 text-[12px]"
      @click="emit('reset')"
    >
      Xóa bộ lọc
    </button>
  </div>
</template>
