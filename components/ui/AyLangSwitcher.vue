<script setup lang="ts">
/**
 * CP-03 Bo chuyen ngon ngu — FR-I18N-02.
 * Ban thiet ke dung nut gat ba o VI / EN / JA, khong phai danh sach tha xuong.
 */
const { locale, setLocale } = useI18n();

const OPTIONS = [
  { code: 'vi', label: 'VI' },
  { code: 'en', label: 'EN' },
  { code: 'ja', label: 'JA' },
] as const;
</script>

<template>
  <div class="seg" role="radiogroup" aria-label="Ngôn ngữ">
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
