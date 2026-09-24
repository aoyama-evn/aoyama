<script setup lang="ts">
import type { AiDiagnosis, ServiceItem } from '~/types/models';

/**
 * SC-10 Chatbox AI chan doan.
 * Tai lieu mo ta day la lop phu tren moi trang; o day lam thanh mot trang rieng
 * de duong dan chia se duoc va nut quay lai cua trinh duyet hoat dong dung.
 */
const api = useApi();
const booking = useBookingStore();
const ui = useUiStore();

const session = ref<AiDiagnosis | null>(null);
const intent = ref<'MAINTENANCE' | 'REPAIR' | null>(null);
const text = ref('');
const images = ref<string[]>([]);
const transcript = ref<string | null>(null);
const sending = ref(false);
const scroller = ref<HTMLElement | null>(null);

async function ensureSession(): Promise<AiDiagnosis> {
  if (session.value) return session.value;
  session.value = await api.post<AiDiagnosis>('/ai/diagnosis/sessions', {
    sessionKey: `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    serviceIntent: intent.value ?? undefined,
  });
  return session.value;
}

async function send(): Promise<void> {
  if (!text.value.trim() && images.value.length === 0 && !transcript.value) return;
  sending.value = true;
  try {
    const current = await ensureSession();
    session.value = await api.post<AiDiagnosis>(`/ai/diagnosis/sessions/${current.id}/messages`, {
      text: text.value.trim() || undefined,
      imageUrls: images.value.length ? images.value : undefined,
      transcript: transcript.value ?? undefined,
    });
    text.value = '';
    images.value = [];
    transcript.value = null;
    await nextTick();
    scroller.value?.scrollTo({ top: scroller.value.scrollHeight, behavior: 'smooth' });
  } catch (error) {
    ui.error(normalizeError(error).message, 'Bạn vẫn có thể đặt lịch và mô tả trực tiếp tại cửa hàng.');
  } finally {
    sending.value = false;
  }
}

/** SC-11 — bam dat lich tu ket qua chan doan thi mang theo phien AI sang. */
async function bookFromFinding(serviceCodes: string[] | undefined): Promise<void> {
  const services = await api.get<ServiceItem[]>('/services');
  const matched = services.filter((s) => (serviceCodes ?? []).includes(s.code));

  booking.restore();
  booking.applyDiagnosis({
    diagnosisId: session.value?.id ?? '',
    description: session.value?.messages.find((m) => m.role === 'user')?.text,
    services: matched,
  });
  await navigateTo('/booking/step1');
}

const hasFindings = computed(() => (session.value?.findings ?? []).length > 0);
const analysisFailed = computed(() => session.value?.status === 'FAILED');

useHead({ title: 'Trợ lý AOYAMA — chẩn đoán xe' });
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-4">
    <AyPageHeader code="SC-10" title="Trợ lý AOYAMA" description="Mô tả tình trạng xe bằng chữ, ảnh hoặc giọng nói — trợ lý sẽ gợi ý các khả năng và dịch vụ phù hợp.">
      <template #actions>
        <AyAiBadge />
      </template>
    </AyPageHeader>

    <!-- Chon y dinh truoc, giup goi y sat hon -->
    <div v-if="!session" class="card flex flex-col gap-3">
      <p class="text-[14px]">Bạn cần hỗ trợ gì cho xe của mình?</p>
      <div class="flex gap-2">
        <AyButton
          :variant="intent === 'MAINTENANCE' ? 'primary' : 'secondary'"
          class="flex-1" @click="intent = 'MAINTENANCE'"
        >
          Bảo dưỡng
        </AyButton>
        <AyButton
          :variant="intent === 'REPAIR' ? 'primary' : 'secondary'"
          class="flex-1" @click="intent = 'REPAIR'"
        >
          Sửa chữa
        </AyButton>
      </div>
      <p class="text-[12.5px] text-muted">
        Chọn xong, hãy mô tả triệu chứng ở ô bên dưới. Ví dụ: “xe kêu lạ khi phanh gấp”.
      </p>
    </div>

    <div v-if="session" ref="scroller" class="flex max-h-[50vh] flex-col gap-3 overflow-y-auto">
      <template v-for="(message, index) in session.messages" :key="index">
        <div
          v-if="message.text || message.transcript"
          class="max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px]"
          :class="message.role === 'user' ? 'self-end bg-accent-200' : 'self-start bg-surface'"
        >
          {{ message.text || message.transcript }}
        </div>
        <div v-if="message.imageUrls?.length" class="flex gap-2 self-end">
          <img
            v-for="(url, i) in message.imageUrls" :key="i" :src="url" alt=""
            class="h-16 w-16 rounded-xl object-cover"
          >
        </div>
      </template>

      <div v-if="sending" class="self-start rounded-2xl bg-surface px-4 py-2.5 text-[13.5px] text-muted">
        Đang phân tích… (tối đa 10 giây)
      </div>
    </div>

    <!-- SC-11 Ket qua chan doan -->
    <section v-if="hasFindings" class="flex flex-col gap-3">
      <h2 class="font-heading text-[17px]">Kết quả chẩn đoán</h2>
      <p class="text-[12.5px] text-muted">
        Đây là gợi ý của trợ lý AI dựa trên mô tả của bạn, không phải kết luận. Kỹ thuật viên sẽ
        kiểm tra thực tế trước khi báo giá.
      </p>
      <AyDiagnosisCard
        v-for="(finding, index) in session?.findings ?? []"
        :key="index" :finding="finding" :rank="index + 1"
        @book="bookFromFinding(finding.suggestedServiceCodes)"
      />
    </section>

    <div v-else-if="analysisFailed" class="card flex flex-col gap-2">
      <p class="text-[14px] font-semibold">Chưa đủ thông tin để chẩn đoán</p>
      <p class="text-[13px] text-muted">
        Bạn có thể mô tả thêm, hoặc đặt lịch để kỹ thuật viên kiểm tra trực tiếp — cách này luôn
        chính xác nhất.
      </p>
      <AyButton to="/booking/step1" variant="secondary" size="sm" class="self-start">
        Đặt lịch kiểm tra
      </AyButton>
    </div>

    <!-- O soan -->
    <div class="card flex flex-col gap-2">
      <AyImageUpload v-model="images" :max="3" label="Gửi kèm ảnh (không bắt buộc)" />
      <AyVoiceRecorder @recorded="transcript = 'Ghi âm đã gửi kèm'" />

      <div class="flex gap-2">
        <textarea
          v-model="text" class="input min-h-[52px] flex-1"
          placeholder="Mô tả tình trạng xe của bạn…"
          @keydown.enter.exact.prevent="send"
        />
        <AyButton :loading="sending" :disabled="!text.trim() && images.length === 0" @click="send">
          Gửi
        </AyButton>
      </div>
    </div>

    <p class="text-center text-[12.5px] text-muted">
      Ảnh và ghi âm chỉ dùng cho phiên chẩn đoán này và được xóa sau thời hạn lưu trữ.
      Xem <NuxtLink to="/privacy" class="underline">Chính sách dữ liệu</NuxtLink>.
    </p>
  </div>
</template>
