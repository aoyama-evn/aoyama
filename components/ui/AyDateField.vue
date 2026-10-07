<script setup lang="ts">
/**
 * O nhap ngay theo dung dang YYYY/MM/DD.
 *
 * `<input type="date">` ve theo ngon ngu cua trinh duyet chu khong phai
 * cua ung dung: tren may dang dung no ra "10/07/2026" va goi y
 * "mm/dd/yyyy", trong khi ca he thong hien ngay kieu 2026/10/07. Doc
 * nguoc ngay voi thang la dat nham lich, nen phai thong nhat.
 *
 * Ban cho ngay gio co gio phut nam o AyDateTimeField.
 */
const props = defineProps<{
  /**
   * Dang may chu dung: `YYYY-MM-DD`. Rong, null hay thieu deu la chua
   * chon — vai man giu truong nay la nullable nen phai nhan ca ba.
   */
  modelValue: string | null | undefined;
  id?: string;
}>();
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const FORMAT = 'YYYY/MM/DD';

function toDisplay(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  return m ? `${m[1]}/${m[2]}/${m[3]}` : '';
}

/**
 * Nhan ca dau `/`, `-` va `.` vi ba kieu nay deu quen tay, va cho go
 * thieu so 0 dung dau ("2026/10/7"). Khong doc duoc thi tra ve rong —
 * man cha hieu la chua chon.
 */
function toValue(text: string): string {
  const m = /^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/.exec(text.trim());
  if (!m) return '';
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  // Chan "2026/02/31": Date tu tran sang thang sau thay vi bao loi.
  if (
    date.getFullYear() !== Number(y) ||
    date.getMonth() !== Number(mo) - 1 ||
    date.getDate() !== Number(d)
  ) {
    return '';
  }
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${y}-${pad(Number(mo))}-${pad(Number(d))}`;
}

const text = ref(toDisplay(props.modelValue ?? ''));

watch(
  () => props.modelValue,
  (value) => {
    if (toValue(text.value) !== (value ?? '')) text.value = toDisplay(value ?? '');
  },
);

const invalid = computed(() => text.value.trim().length > 0 && toValue(text.value) === '');

function onInput(event: Event): void {
  text.value = (event.target as HTMLInputElement).value;
  emit('update:modelValue', toValue(text.value));
}

/** Go xong roi thi don lai cho dep: "2026/10/7" -> "2026/10/07". */
function onBlur(): void {
  const value = toValue(text.value);
  if (value) text.value = toDisplay(value);
}
</script>

<template>
  <input
    :id="id"
    class="input"
    type="text"
    inputmode="numeric"
    autocomplete="off"
    :value="text"
    :placeholder="FORMAT"
    :aria-invalid="invalid || undefined"
    @input="onInput"
    @blur="onBlur"
  >
  <span v-if="invalid" class="field-error">
    {{ $t('ui.dateTimeFormat', { format: FORMAT }) }}
  </span>
</template>
