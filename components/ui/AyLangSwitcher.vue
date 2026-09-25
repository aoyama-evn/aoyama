<script setup lang="ts">
/**
 * Bo chuyen ngon ngu: mot nut gat ba o JA / EN / VI, khong phai danh sach tha
 * xuong. Chon xong thi @nuxtjs/i18n ghi vao cookie aoyama_lang nen lua chon
 * con lai o lan vao sau.
 */
const { locale, setLocale } = useI18n();

/** Tieng Nhat dung truoc vi day la ngon ngu mac dinh cua he thong. */
const OPTIONS = [
  { code: 'ja', label: 'JA' },
  { code: 'en', label: 'EN' },
  { code: 'vi', label: 'VI' },
] as const;
</script>

<template>
  <div class="seg" role="radiogroup" :aria-label="$t('ui.lang')">
    <label v-for="option in OPTIONS" :key="option.code" class="seg-opt">
      <input
        type="radio"
        name="ay-lang"
        :value="option.code"
        :checked="locale === option.code"
        @change="setLocale(option.code)"
      >
      {{ option.label }}
    </label>
  </div>
</template>
