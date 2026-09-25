<script setup lang="ts">
import type { TechAnswer } from '~/types/models';

/**
 * SA-30 Tro ly AI ky thuat — FR-TEC-01..04, FR-TEC-06, FR-TEC-07, AI-03.
 * Ban thiet ke chia hai cot: khung tro chuyen ben trai (co the ngu canh xe va
 * o soan ghim duoi), cot phai la cau hoi gan day va loi vao kho tai lieu.
 */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const { t } = useI18n();
const api = useApi();
const ui = useUiStore();

interface Turn {
  question: string;
  answer: TechAnswer | null;
  pending: boolean;
  helpful: boolean | null;
}

setScreenTitle(() => t('sa30.title'));

const question = ref('');
const maker = ref('');
const model = ref('');
const turns = ref<Turn[]>([]);

/**
 * Cau hoi gan day la tien ich cua rieng may dang dung, khong phai du lieu dung
 * chung, nen giu trong sessionStorage.
 */
const RECENT_KEY = 'aoyama_tech_questions';
const recent = ref<string[]>([]);

const EXAMPLES = computed(() => [
  t('sa30.example1'),
  t('sa30.example2'),
  t('sa30.example3'),
]);

onMounted(() => {
  try {
    recent.value = JSON.parse(sessionStorage.getItem(RECENT_KEY) ?? '[]') as string[];
  } catch {
    recent.value = [];
  }
});

const contextLabel = computed(() =>
  [maker.value, model.value].filter(Boolean).join(' ').trim() || null,
);

function remember(text: string): void {
  recent.value = [text, ...recent.value.filter((q) => q !== text)].slice(0, 6);
  try {
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(recent.value));
  } catch {
    // Trinh duyet chan luu tru — danh sach chi song trong phien nay.
  }
}

async function ask(text?: string): Promise<void> {
  const q = (text ?? question.value).trim();
  if (!q) return;

  const turn: Turn = { question: q, answer: null, pending: true, helpful: null };
  turns.value = [...turns.value, turn];
  question.value = '';
  remember(q);

  try {
    turn.answer = await api.post<TechAnswer>('/admin/ai/tech-assistant', {
      question: q,
      maker: maker.value || undefined,
      model: model.value || undefined,
    });
  } catch (error) {
    ui.error(normalizeError(error).message);
    turn.answer = { answer: t('sa30.unavailable'), citations: [] };
  } finally {
    turn.pending = false;
  }
}

/** FR-TEC-07 — danh gia cau tra loi de cai thien kho tai lieu. */
function rate(turn: Turn, helpful: boolean): void {
  turn.helpful = helpful;
  ui.success(helpful ? t('sa30.thanks') : t('sa30.noted'));
}

useHead({ title: () => `${t('sa30.title')} — AOYAMA Admin` });
</script>

<template>
  <div
    class="grid items-start gap-3.5"
    style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))"
  >
    <section class="card gap-3" style="background: #fff">
      <div class="flex flex-wrap items-center gap-2.5">
        <h5>{{ $t('sa30.panelTitle') }}</h5>
        <button
          v-if="contextLabel"
          type="button"
          class="tag tag-accent-2 ml-auto"
          @click="maker = ''; model = ''"
        >
          {{ $t('sa30.context', { label: contextLabel }) }}
        </button>
      </div>

      <div class="grid gap-2.5 sm:grid-cols-2">
        <AyField :label="$t('sa30.maker')" :hint="$t('sa30.makerHint')">
          <template #default="{ id }">
            <input :id="id" v-model="maker" class="input" type="text" placeholder="Honda" />
          </template>
        </AyField>
        <AyField :label="$t('sa30.model')">
          <template #default="{ id }">
            <input :id="id" v-model="model" class="input" type="text" placeholder="Lead 125" />
          </template>
        </AyField>
      </div>

      <div class="flex flex-col gap-3">
        <div v-if="turns.length === 0" class="flex flex-col gap-2">
          <p class="text-muted text-[13px]">{{ $t('sa30.examples') }}</p>
          <button
            v-for="example in EXAMPLES"
            :key="example"
            type="button"
            class="btn btn-secondary btn-block justify-start font-body text-[12.5px]"
            style="margin: 0; min-height: 44px"
            @click="ask(example)"
          >
            {{ example }}
          </button>
        </div>

        <template v-for="(turn, index) in turns" :key="index">
          <p class="ay-bubble-me">{{ turn.question }}</p>

          <p v-if="turn.pending" class="ay-bubble-bot text-muted">{{ $t('sa30.searching') }}</p>

          <div v-else-if="turn.answer" class="ay-bubble-bot flex flex-col gap-2.5">
            <p class="whitespace-pre-line text-[13.5px] leading-[1.55]">{{ turn.answer.answer }}</p>

            <div
              v-for="citation in turn.answer.citations"
              :key="citation.documentId"
              class="flex gap-2 text-[12px] leading-[1.5]"
              style="background: #fff; border-radius: 16px; padding: 10px 12px"
            >
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                class="mt-0.5 flex-none" aria-hidden="true"
              >
                <path d="M6 3h8l4 4v14H6z" />
                <path d="M14 3v4h4" />
              </svg>
              <span>
                <strong>{{ $t('sa30.source') }}</strong> {{ citation.title }}
                <span v-if="citation.excerpt" class="text-muted block">{{ citation.excerpt }}</span>
              </span>
            </div>

            <p v-if="turn.answer.citations.length === 0" class="text-muted text-[12px]">
              {{ $t('sa30.noSource') }}
            </p>

            <div class="flex gap-2">
              <button
                type="button"
                class="btn btn-secondary text-[12px]"
                :style="turn.helpful === true ? 'border-color: var(--color-accent)' : ''"
                @click="rate(turn, true)"
              >
                {{ $t('sa30.helpful') }}
              </button>
              <button
                type="button"
                class="btn btn-secondary text-[12px]"
                :style="turn.helpful === false ? 'border-color: var(--color-accent)' : ''"
                @click="rate(turn, false)"
              >
                {{ $t('sa30.notHelpful') }}
              </button>
            </div>
          </div>
        </template>
      </div>

      <div class="flex gap-2 pt-3" style="border-top: 1px solid var(--color-divider)">
        <input
          v-model="question"
          class="input flex-1"
          :placeholder="$t('sa30.askPlaceholder')"
          :aria-label="$t('sa30.askAria')"
          @keydown.enter.exact.prevent="ask()"
        />
        <button
          type="button"
          class="btn btn-primary flex-none"
          :disabled="!question.trim()"
          @click="ask()"
        >
          {{ $t('sc10.send') }}
        </button>
      </div>
    </section>

    <div class="flex flex-col gap-[13px]">
      <section v-if="recent.length" class="card gap-2" style="background: #fff">
        <h5>{{ $t('sa30.recent') }}</h5>
        <button
          v-for="item in recent"
          :key="item"
          type="button"
          class="btn btn-secondary btn-block justify-start font-body text-[12.5px]"
          style="margin: 0; min-height: 44px"
          @click="ask(item)"
        >
          {{ item }}
        </button>
      </section>

      <NuxtLink to="/admin/knowledge-base" class="btn btn-secondary text-[13px]">
        {{ $t('sa30.kbCta') }}
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.ay-bubble-bot,
.ay-bubble-me {
  max-width: 92%;
  padding: 12px 14px;
  font-size: 13.5px;
  line-height: 1.45;
}
.ay-bubble-bot {
  align-self: flex-start;
  border-radius: 20px 20px 20px 6px;
  background: var(--color-surface);
}
.ay-bubble-me {
  align-self: flex-end;
  max-width: 84%;
  border-radius: 20px 20px 6px 20px;
  background: var(--color-accent-200);
}
</style>
