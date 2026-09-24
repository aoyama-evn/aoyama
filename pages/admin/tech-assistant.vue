<script setup lang="ts">
import type { TechAnswer } from '~/types/models';

/** SA-30 Tro ly AI ky thuat — FR-TEC-01..04, FR-TEC-06, FR-TEC-07, AI-03. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();

interface Turn {
  question: string;
  answer: TechAnswer | null;
  pending: boolean;
}

const question = ref('');
const maker = ref('');
const model = ref('');
const turns = ref<Turn[]>([]);

const EXAMPLES = [
  'Quy trình thay má phanh trước PCX 125',
  'Mã lỗi FI nháy 8 lần trên Honda Wave nghĩa là gì',
  'Thông số lực siết bu lông bánh sau Super Cub',
];

async function ask(text?: string): Promise<void> {
  const q = (text ?? question.value).trim();
  if (!q) return;

  const turn: Turn = { question: q, answer: null, pending: true };
  turns.value = [...turns.value, turn];
  question.value = '';

  try {
    turn.answer = await api.post<TechAnswer>('/admin/ai/tech-assistant', {
      question: q,
      maker: maker.value || undefined,
      model: model.value || undefined,
    });
  } catch (error) {
    ui.error(normalizeError(error).message);
    turn.answer = { answer: 'Không truy vấn được trợ lý kỹ thuật lúc này.', citations: [] };
  } finally {
    turn.pending = false;
  }
}

useHead({ title: 'Trợ lý AI kỹ thuật — AOYAMA Admin' });
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <AyPageHeader
      code="SA-30" title="Trợ lý AI kỹ thuật"
      description="Hỏi bằng ngôn ngữ tự nhiên về quy trình sửa chữa, mã lỗi, thông số. Câu trả lời luôn kèm trích dẫn tài liệu nguồn."
    >
      <template #actions>
        <AyAiBadge />
        <AyButton to="/admin/knowledge-base" variant="secondary" size="sm">Kho tài liệu</AyButton>
      </template>
    </AyPageHeader>

    <section class="card grid gap-3 sm:grid-cols-2">
      <AyField label="Hãng xe" hint="Không bắt buộc — giúp lọc tài liệu đúng dòng">
        <template #default="{ id }">
          <input :id="id" v-model="maker" class="input" type="text" placeholder="Honda">
        </template>
      </AyField>
      <AyField label="Dòng xe">
        <template #default="{ id }">
          <input :id="id" v-model="model" class="input" type="text" placeholder="PCX 125">
        </template>
      </AyField>
    </section>

    <div v-if="turns.length === 0" class="card flex flex-col gap-2">
      <p class="text-[13.5px] text-muted">Ví dụ câu hỏi:</p>
      <ul class="flex flex-col gap-1.5">
        <li v-for="example in EXAMPLES" :key="example">
          <button type="button" class="text-left text-[13.5px] underline" @click="ask(example)">
            {{ example }}
          </button>
        </li>
      </ul>
    </div>

    <section v-for="(turn, index) in turns" :key="index" class="flex flex-col gap-2">
      <p class="self-end max-w-[85%] rounded-2xl bg-accent-200 px-4 py-2.5 text-[14px]">
        {{ turn.question }}
      </p>

      <div v-if="turn.pending" class="card text-[13.5px] text-muted">Đang tra cứu tài liệu…</div>

      <div v-else-if="turn.answer" class="card flex flex-col gap-3">
        <p class="whitespace-pre-line text-[14px]">{{ turn.answer.answer }}</p>

        <div v-if="turn.answer.citations.length">
          <p class="mb-1.5 text-[12.5px] font-semibold text-muted">Nguồn trích dẫn</p>
          <ul class="flex flex-col gap-1.5">
            <li
              v-for="citation in turn.answer.citations" :key="citation.documentId"
              class="rounded-xl bg-neutral-100 px-3 py-2 text-[12.5px]"
            >
              <p class="font-semibold">{{ citation.title }}</p>
              <p class="text-muted">{{ citation.excerpt }}</p>
            </li>
          </ul>
        </div>

        <p v-else class="text-[12.5px] text-muted">
          Không tìm thấy tài liệu phù hợp. Hãy bổ sung tài liệu kỹ thuật vào kho để trợ lý trả lời chính xác hơn.
        </p>
      </div>
    </section>

    <div class="card flex gap-2">
      <textarea
        v-model="question" class="input min-h-[52px] flex-1"
        placeholder="Nhập câu hỏi kỹ thuật…"
        @keydown.enter.exact.prevent="ask()"
      />
      <AyButton :disabled="!question.trim()" @click="ask()">Hỏi</AyButton>
    </div>
  </div>
</template>
