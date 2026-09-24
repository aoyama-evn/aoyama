<script setup lang="ts">
import type { NotificationTemplate } from '~/types/models';

/** SA-41 Mau thong bao — FR-NOT-09, FR-NOT-10, FR-NOT-11. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const api = useApi();
const ui = useUiStore();

const { data: templates, refresh } = await useAsyncData('notif-templates', () =>
  api.get<NotificationTemplate[]>('/admin/notifications/templates'),
);

const EVENT_LABELS: Record<string, string> = {
  OTP: 'Mã xác thực',
  BOOKING_CREATED: 'Đã nhận yêu cầu đặt lịch',
  BOOKING_CONFIRMED: 'Đã xác nhận lịch hẹn',
  BOOKING_REMINDER: 'Nhắc lịch hẹn',
  BOOKING_CANCELLED: 'Đã hủy lịch hẹn',
  BOOKING_RESCHEDULED: 'Đã đổi lịch hẹn',
  QUOTATION_SENT: 'Gửi báo giá',
  WORK_ORDER_COMPLETED: 'Xe đã sửa xong',
  VEHICLE_DELIVERED: 'Đã bàn giao xe',
  MAINTENANCE_DUE: 'Đến kỳ bảo dưỡng',
};

const LANG_LABELS: Record<string, string> = { ja: '日本語', en: 'English', vi: 'Tiếng Việt' };

const editing = ref<NotificationTemplate | null>(null);
const draft = reactive({ subject: '', body: '', isActive: true });
const saving = ref(false);

function startEdit(template: NotificationTemplate): void {
  editing.value = template;
  draft.subject = template.subject ?? '';
  draft.body = template.body;
  draft.isActive = template.isActive;
}

/** Canh bao som neu mau dung bien khong nam trong danh sach cho phep. */
const unknownVariables = computed(() => {
  if (!editing.value) return [];
  const used = [...draft.body.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((m) => m[1]);
  return [...new Set(used)].filter((v) => !editing.value!.availableVariables.includes(v));
});

/** SMS tinh phi theo do dai — hien so ky tu de nguoi soan biet (RK-03). */
const smsLength = computed(() => draft.body.length);

/**
 * Bao bien bang cap ngoac nhon. Tach thanh ham vi viet thang trong the
 * se bi trinh bien dich mau doc nham la mot bieu thuc long nhau.
 */
const OPEN = '{' + '{';
const CLOSE = '}' + '}';

function braced(variable: string): string {
  return OPEN + variable + CLOSE;
}

function insertVariable(variable: string): void {
  draft.body += braced(variable);
}

async function save(): Promise<void> {
  if (!editing.value) return;
  saving.value = true;
  try {
    await api.put(`/admin/notifications/templates/${editing.value.id}`, {
      subject: draft.subject || undefined,
      body: draft.body,
      isActive: draft.isActive,
    });
    ui.success('Đã lưu mẫu thông báo');
    editing.value = null;
    await refresh();
  } catch (error) {
    ui.error(normalizeError(error).message);
  } finally {
    saving.value = false;
  }
}

const grouped = computed(() => {
  const map = new Map<string, NotificationTemplate[]>();
  for (const template of templates.value ?? []) {
    map.set(template.event, [...(map.get(template.event) ?? []), template]);
  }
  return [...map.entries()];
});

useHead({ title: 'Mẫu thông báo — AOYAMA Admin' });
</script>

<template>
  <div class="flex flex-col gap-4">
    <AyPageHeader
      code="SA-41" title="Mẫu thông báo"
      description="Mỗi sự kiện có mẫu riêng cho từng kênh và ngôn ngữ. Thiếu bản dịch nào, hệ thống lùi về tiếng Nhật."
    >
      <template #actions>
        <AyButton to="/admin/notifications/logs" variant="secondary" size="sm">Nhật ký gửi</AyButton>
      </template>
    </AyPageHeader>

    <section v-for="[event, list] in grouped" :key="event" class="ay-card">
      <h2 class="mb-2 font-heading text-[16px]">{{ EVENT_LABELS[event] ?? event }}</h2>

      <ul class="flex flex-col gap-1.5">
        <li
          v-for="template in list" :key="template.id"
          class="flex flex-wrap items-center gap-3 border-b border-divider pb-1.5 text-[13.5px] last:border-0"
        >
          <span class="ay-tag bg-neutral-200 text-neutral-700">{{ template.channel }}</span>
          <span class="w-20">{{ LANG_LABELS[template.language] }}</span>
          <span class="min-w-0 flex-1 truncate ay-muted">{{ template.body }}</span>
          <span v-if="!template.isActive" class="ay-tag bg-danger-bg text-danger">tắt</span>
          <button type="button" class="text-[12.5px] underline" @click="startEdit(template)">Sửa</button>
        </li>
      </ul>
    </section>

    <AyConfirmDialog
      :open="Boolean(editing)"
      title="Sửa mẫu thông báo"
      confirm-label="Lưu mẫu"
      :loading="saving"
      @confirm="save"
      @cancel="editing = null"
    >
      <div v-if="editing" class="mt-3 flex flex-col gap-3 text-left">
        <p class="text-[12.5px] ay-muted">
          {{ EVENT_LABELS[editing.event] ?? editing.event }} · {{ editing.channel }} ·
          {{ LANG_LABELS[editing.language] }}
        </p>

        <AyField v-if="editing.channel === 'EMAIL'" label="Tiêu đề">
          <template #default="{ id: fid }">
            <input :id="fid" v-model="draft.subject" class="ay-input" type="text">
          </template>
        </AyField>

        <AyField
          label="Nội dung"
          :hint="editing.channel === 'SMS' ? `${smsLength} ký tự — tin nhắn dài làm tăng chi phí` : undefined"
        >
          <template #default="{ id: fid }">
            <textarea :id="fid" v-model="draft.body" class="ay-input min-h-[120px]" />
          </template>
        </AyField>

        <div>
          <p class="mb-1 text-[12.5px] font-semibold">Biến được phép</p>
          <ul class="flex flex-wrap gap-1">
            <li
              v-for="variable in editing.availableVariables" :key="variable"
              class="ay-tag cursor-pointer bg-neutral-200 text-neutral-700"
              @click="insertVariable(variable)"
            >
              {{ braced(variable) }}
            </li>
          </ul>
        </div>

        <p v-if="unknownVariables.length" class="rounded-xl bg-warning-bg px-3 py-2 text-[12.5px] text-warning">
          Biến không hợp lệ sẽ hiện thành chuỗi rỗng: {{ unknownVariables.join(', ') }}
        </p>

        <label class="flex items-center gap-2.5 text-[13.5px]">
          <input v-model="draft.isActive" type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]">
          Đang dùng
        </label>
      </div>
    </AyConfirmDialog>
  </div>
</template>
