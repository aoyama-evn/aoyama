<script setup lang="ts">
import type { PartRecognition } from '~/types/models';

/** SA-27 Nhap lieu phu tung bang AI — FR-PRT-04..07, AI-04, BR-43. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();

const images = ref<string[]>([]);
const result = ref<PartRecognition | null>(null);
const analyzing = ref(false);

async function analyze(): Promise<void> {
  if (images.value.length === 0) {
    ui.warning('Hãy tải lên ít nhất một ảnh phụ tùng hoặc hộp vỏ');
    return;
  }
  analyzing.value = true;
  result.value = null;
  try {
    result.value = await api.post<PartRecognition>('/admin/ai/part-recognition', {
      imageUrls: images.value,
    });
    if (result.value.isFallback) {
      ui.info('Trợ lý AI chưa nhận dạng được', 'Bạn vẫn có thể nhập thủ công như bình thường.');
    }
  } catch (error) {
    ui.error(normalizeError(error).message, 'Hãy nhập phụ tùng thủ công.');
  } finally {
    analyzing.value = false;
  }
}

/**
 * BR-43 — AI khong tu luu. Du lieu chuyen sang bieu mau SA-26 de nguoi kiem tra
 * roi moi bam luu.
 */
function reviewAndSave(): void {
  if (!result.value) return;
  const prefill = {
    name: result.value.name,
    maker: result.value.maker,
    makerPartNo: result.value.makerPartNo,
    category: result.value.category,
    specification: result.value.specification,
    compatibleVehicles: result.value.compatibleVehicles,
  };
  navigateTo(`/admin/parts/new/edit?prefill=${encodeURIComponent(JSON.stringify(prefill))}`);
}

useHead({ title: 'Nhập phụ tùng bằng AI — AOYAMA Admin' });
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-4">
    <AyPageHeader
      code="SA-27" title="Nhập phụ tùng bằng AI" back-to="/admin/parts"
      description="Chụp ảnh phụ tùng hoặc hộp vỏ, trợ lý sẽ đọc thông tin và điền sẵn biểu mẫu. Bạn luôn kiểm tra trước khi lưu."
    >
      <template #actions>
        <AyAiBadge />
      </template>
    </AyPageHeader>

    <section class="card flex flex-col gap-3">
      <AyImageUpload v-model="images" label="Ảnh phụ tùng hoặc hộp vỏ" :max="3" />
      <AyButton :loading="analyzing" :disabled="images.length === 0" @click="analyze">
        Nhận dạng bằng AI
      </AyButton>
    </section>

    <section v-if="result && !result.isFallback" class="card flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <h2 class="font-heading text-[16px]">Kết quả nhận dạng</h2>
        <AyAiBadge :confidence="result.confidence ?? null" />
      </div>

      <dl class="grid gap-2 text-[14px] sm:grid-cols-2">
        <div><dt class="text-muted">Tên</dt><dd>{{ result.name ?? '—' }}</dd></div>
        <div><dt class="text-muted">Hãng</dt><dd>{{ result.maker ?? '—' }}</dd></div>
        <div><dt class="text-muted">Mã hãng</dt><dd class="font-mono">{{ result.makerPartNo ?? '—' }}</dd></div>
        <div><dt class="text-muted">Nhóm</dt><dd>{{ result.category ?? '—' }}</dd></div>
        <div class="sm:col-span-2"><dt class="text-muted">Quy cách</dt><dd>{{ result.specification ?? '—' }}</dd></div>
        <div v-if="result.compatibleVehicles?.length" class="sm:col-span-2">
          <dt class="text-muted">Xe tương thích</dt>
          <dd>
            <ul class="mt-1 flex flex-wrap gap-1.5">
              <li v-for="v in result.compatibleVehicles" :key="v" class="tag bg-neutral-200 text-neutral-700">
                {{ v }}
              </li>
            </ul>
          </dd>
        </div>
      </dl>

      <p class="rounded-xl bg-warning-bg px-3 py-2 text-[12.5px] text-warning">
        Đây là gợi ý của AI. Hãy đối chiếu với hộp vỏ thật rồi bổ sung giá nhập, giá bán trước khi lưu.
      </p>

      <div class="flex gap-2">
        <AyButton @click="reviewAndSave">Kiểm tra &amp; tạo phụ tùng →</AyButton>
        <AyButton variant="secondary" @click="result = null">Nhận dạng lại</AyButton>
      </div>
    </section>

    <section v-else-if="result?.isFallback" class="card flex flex-col gap-2">
      <p class="text-[14px] font-semibold">Chưa nhận dạng được phụ tùng</p>
      <p class="text-[13px] text-muted">
        Ảnh có thể bị mờ hoặc thiếu mã trên hộp. Bạn có thể chụp lại rõ phần mã hãng, hoặc nhập thủ công.
      </p>
      <AyButton to="/admin/parts/new/edit" variant="secondary" size="sm" class="self-start">
        Nhập thủ công
      </AyButton>
    </section>
  </div>
</template>
