<script setup lang="ts">
/** CP-03 Bo chuyen ngon ngu — FR-I18N-02. */
const { locale, locales, setLocale } = useI18n();
const open = ref(false);

const options = computed(() =>
  (locales.value as { code: string; name: string }[]).map((l) => ({ code: l.code, name: l.name })),
);
const current = computed(() => options.value.find((o) => o.code === locale.value));

function choose(code: string): void {
  setLocale(code as 'ja' | 'en' | 'vi');
  open.value = false;
}
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="ay-btn ay-btn-secondary ay-btn-sm"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="open = !open"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" />
      </svg>
      {{ current?.name }}
    </button>

    <ul
      v-if="open"
      class="absolute right-0 z-30 mt-1 w-40 overflow-hidden rounded-xl bg-surface shadow-card"
      role="listbox"
    >
      <li v-for="option in options" :key="option.code">
        <button
          type="button"
          role="option"
          :aria-selected="option.code === locale"
          class="w-full px-3 py-2.5 text-left text-[14px] hover:bg-accent-200"
          :class="option.code === locale ? 'font-semibold text-accent-800' : ''"
          @click="choose(option.code)"
        >
          {{ option.name }}
        </button>
      </li>
    </ul>
  </div>
</template>
