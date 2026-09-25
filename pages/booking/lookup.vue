<script setup lang="ts">
import type { ApiError, Booking } from '~/types/models';

/**
 * SC-20 Tra cuu lich hen cho khach chua dang nhap — FR-BOOK-15.
 * Ban thiet ke dat o tai anh ma QR len truoc, roi moi den o nhap ma. Anh QR
 * duoc giai ma ngay tren may de khong phai gui anh len may chu.
 */
const api = useApi();
const route = useRoute();
const ui = useUiStore();

const code = ref((route.query.code as string) ?? '');
const phone = ref('');
const loading = ref(false);
const decoding = ref(false);
const error = ref<ApiError | null>(null);

async function lookup(): Promise<void> {
  error.value = null;
  loading.value = true;
  try {
    const booking = await api.post<Booking>('/bookings/lookup', {
      code: code.value.trim().toUpperCase(),
      phone: phone.value.trim(),
    });
    await navigateTo(`/bookings/${booking.code}/progress`);
  } catch (caught) {
    error.value = normalizeError(caught);
  } finally {
    loading.value = false;
  }
}

/**
 * Doc ma QR tu anh khach chon. BarcodeDetector chi co tren mot so trinh duyet,
 * nen khi khong co thi bao khach nhap ma bang tay thay vi de man hinh im lang.
 */
async function decodeQrImage(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const Detector = (window as unknown as { BarcodeDetector?: new (o: object) => object })
    .BarcodeDetector;
  if (!Detector) {
    ui.warning('Trình duyệt không đọc được ảnh QR', 'Bạn hãy nhập mã lịch hẹn bên dưới.');
    return;
  }

  decoding.value = true;
  try {
    const bitmap = await createImageBitmap(file);
    const detector = new Detector({ formats: ['qr_code'] }) as {
      detect(source: ImageBitmap): Promise<{ rawValue: string }[]>;
    };
    const found = await detector.detect(bitmap);
    const raw = found[0]?.rawValue;
    if (!raw) {
      ui.warning('Không tìm thấy mã QR trong ảnh', 'Bạn hãy thử ảnh rõ hơn hoặc nhập mã bằng tay.');
      return;
    }
    // Ma QR chua duong dan hoac chinh ma lich hen.
    const matched = raw.match(/B-\d{8}-\d{4}/i);
    code.value = (matched?.[0] ?? raw).toUpperCase();
    ui.success('Đã đọc mã từ ảnh', 'Nhập số điện thoại để tra cứu.');
  } catch {
    ui.warning('Không đọc được ảnh', 'Bạn hãy nhập mã lịch hẹn bên dưới.');
  } finally {
    decoding.value = false;
  }
}

useHead({ title: 'Tra cứu lịch hẹn' });
</script>

<template>
  <form class="flex flex-col gap-3.5 pb-4 pt-2" @submit.prevent="lookup">
    <div>
      <h3 class="mb-1.5">Tra cứu lịch hẹn</h3>
      <p class="text-muted text-[12.5px]">
        Dành cho khách chưa đăng nhập — xem, đổi hoặc hủy lịch hẹn của bạn.
      </p>
    </div>

    <div
      class="flex flex-col items-center gap-2.5 p-4"
      style="
        border: 1.5px dashed var(--color-accent-400);
        background: var(--color-accent-100);
        border-radius: 22px;
      "
    >
      <svg
        width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-700)"
        stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
      >
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <path d="M14 14h3v3M21 21h.01M17 21h.01M21 17h.01" />
      </svg>
      <p class="text-[13.5px] font-semibold">Tải ảnh mã QR lên</p>
      <p class="text-muted text-center text-[11.5px] leading-[1.5]">
        Chọn ảnh QR đã lưu — hệ thống tự tìm lịch hẹn<br />Upload your saved QR image
      </p>
      <label class="btn btn-primary cursor-pointer text-[13px]" style="min-height: 44px">
        {{ decoding ? 'Đang đọc ảnh…' : 'Chọn ảnh QR' }}
        <input type="file" class="sr-only" accept="image/*" @change="decodeQrImage" />
      </label>
    </div>

    <div class="flex items-center gap-2.5">
      <span class="h-px flex-1" style="background: var(--color-divider)" />
      <span class="text-muted text-[11.5px]">hoặc nhập mã</span>
      <span class="h-px flex-1" style="background: var(--color-divider)" />
    </div>

    <AyField for="code" label="Mã lịch hẹn" required>
      <input
        id="code"
        v-model="code"
        class="input"
        placeholder="B-20261008-0421"
        autocomplete="off"
      />
    </AyField>

    <AyField for="phone" label="Số điện thoại đã dùng khi đặt" required>
      <input
        id="phone"
        v-model="phone"
        class="input"
        type="tel"
        inputmode="tel"
        autocomplete="tel"
        placeholder="090-1234-5678"
      />
    </AyField>

    <AyErrorNote :error="error" />

    <button
      type="submit"
      class="btn btn-primary btn-block"
      style="min-height: 48px; font-size: 15px; margin: 0"
      :disabled="loading || !code.trim() || !phone.trim()"
    >
      {{ loading ? 'Đang tra cứu…' : 'Tra cứu' }}
    </button>

    <NuxtLink to="/" class="btn btn-ghost self-center text-[13px]">Trở về trang chủ</NuxtLink>
  </form>
</template>
