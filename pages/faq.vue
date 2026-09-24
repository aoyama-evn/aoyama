<script setup lang="ts">
import type { Faq } from '~/types/models';

/** SC-07 Cau hoi thuong gap. */
const api = useApi();
const { i18n } = useFormat();

const { data: faqs } = await useAsyncData('faqs', () => api.get<Faq[]>('/faqs'));
const openId = ref<string | null>(null);

useHead({ title: 'Câu hỏi thường gặp — AOYAMA Service' });
</script>

<template>
  <div class="flex flex-col gap-5">
    <AyPageHeader code="SC-07" title="Câu hỏi thường gặp" />

    <div class="flex flex-col gap-2">
      <article v-for="faq in faqs ?? []" :key="faq.id" class="ay-card !p-0 overflow-hidden">
        <h2>
          <button
            type="button"
            class="flex w-full items-center gap-3 px-4 py-3.5 text-left"
            :aria-expanded="openId === faq.id"
            @click="openId = openId === faq.id ? null : faq.id"
          >
            <span class="flex-1 text-[15px] font-semibold">{{ i18n(faq.question) }}</span>
            <span class="text-[18px] ay-muted" aria-hidden="true">{{ openId === faq.id ? '−' : '+' }}</span>
          </button>
        </h2>
        <div v-if="openId === faq.id" class="border-t border-divider px-4 py-3.5 text-[14px] whitespace-pre-line">
          {{ i18n(faq.answer) }}
        </div>
      </article>
    </div>

    <AyEmptyState v-if="(faqs ?? []).length === 0" title="Chưa có câu hỏi nào" hint="Bạn có thể gửi câu hỏi qua trang liên hệ.">
      <AyButton to="/contact" variant="secondary" size="sm">Gửi câu hỏi</AyButton>
    </AyEmptyState>
  </div>
</template>
