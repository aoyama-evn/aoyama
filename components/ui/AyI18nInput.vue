<script setup lang="ts">
import type { I18nText, LanguageCode } from '~/types/models';

/** CP-24 O nhap da ngon ngu — ba tab EN / VI / JA, FR-I18N-04. */
const props = withDefaults(
  defineProps<{ modelValue: I18nText | null; label?: string; multiline?: boolean; required?: boolean }>(),
  { multiline: false },
);
const emit = defineEmits<{ (e: 'update:modelValue', value: I18nText): void }>();

const TABS: { code: LanguageCode; label: string }[] = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
];

const active = ref<LanguageCode>('ja');

function update(code: LanguageCode, value: string): void {
  emit('update:modelValue', { ...(props.modelValue ?? {}), [code]: value });
}

/** Danh dau tab con trong de nguoi soan thay ngay con thieu ban dich nao. */
function isEmpty(code: LanguageCode): boolean {
  return !(props.modelValue?.[code] ?? '').trim();
}
</script>

<template>
  <div class="flex flex-col">
    <span v-if="label" class="label">
      {{ label }}<span v-if="required" class="text-danger" aria-hidden="true">*</span>
    </span>

    <div class="mb-1.5 flex gap-1" role="tablist">
      <button
        v-for="tab in TABS"
        :key="tab.code"
        type="button"
        role="tab"
        :aria-selected="active === tab.code"
        class="rounded-full px-3 py-1 text-[12.5px] font-semibold transition-colors"
        :class="active === tab.code ? 'bg-accent-200 text-accent-800' : 'text-muted hover:bg-neutral-200'"
        @click="active = tab.code"
      >
        {{ tab.label }}
        <span v-if="isEmpty(tab.code)" class="text-danger" aria-label="chưa nhập">•</span>
      </button>
    </div>

    <textarea
      v-if="multiline"
      class="input min-h-[96px]"
      :value="modelValue?.[active] ?? ''"
      @input="update(active, ($event.target as HTMLTextAreaElement).value)"
    />
    <input
      v-else
      class="input"
      type="text"
      :value="modelValue?.[active] ?? ''"
      @input="update(active, ($event.target as HTMLInputElement).value)"
    >
  </div>
</template>
