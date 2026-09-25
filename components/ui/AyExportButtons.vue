<script setup lang="ts">
/** CP-23 Nut xuat tep — FR-RPT-12. Tai ve Excel hoac PDF tu API bao cao. */
const props = defineProps<{
  report: 'summary' | 'revenue' | 'parts';
  from: string;
  to: string;
  storeId?: string | null;
}>();

const config = useRuntimeConfig();
const auth = useAuthStore();
const { t } = useI18n();
const ui = useUiStore();
const busy = ref<'excel' | 'pdf' | null>(null);

async function download(format: 'excel' | 'pdf'): Promise<void> {
  busy.value = format;
  try {
    const query = new URLSearchParams({
      report: props.report,
      format,
      from: props.from,
      to: props.to,
    });
    if (props.storeId) query.set('storeId', props.storeId);

    const response = await fetch(`${config.public.apiBase}/admin/reports/export?${query}`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    if (!response.ok) throw new Error(String(response.status));

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aoyama-${props.report}-${props.from}_${props.to}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    ui.error(t('ui.exportFailed'), t('ui.tryLater'));
  } finally {
    busy.value = null;
  }
}
</script>

<template>
  <div class="flex gap-2">
    <AyButton variant="secondary" size="sm" :loading="busy === 'excel'" @click="download('excel')">
      {{ $t('ui.exportExcel') }}
    </AyButton>
    <AyButton variant="secondary" size="sm" :loading="busy === 'pdf'" @click="download('pdf')">
      {{ $t('ui.exportPdf') }}
    </AyButton>
  </div>
</template>
