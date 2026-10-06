<script setup lang="ts">
/**
 * O nhap ngay gio theo dung dang YYYY/MM/DD HH:MM.
 *
 * `<input type="datetime-local">` ve theo ngon ngu cua trinh duyet, khong
 * phai cua ung dung: tren may dang dung no ra "10/06/2026 05:20 PM", va
 * thuoc tinh lang cung khong doi duoc. Ca ung dung hien ngay gio kieu
 * 2026/10/06 17:20, rieng mot o lai doc nguoc ngay/thang va 12 gio thi
 * nguoi nhap rat de dat nham ngay.
 *
 * Nen dung o chu thuong, tu doc va tu ghep. Doi lai mat cai lich bam cua
 * trinh duyet — chap nhan duoc: nhan vien go "2026/10/06 17:20" nhanh hon
 * la mo lich chon.
 */
const props = defineProps<{
  /** Dang may chu dung: `YYYY-MM-DDTHH:mm`. Rong la chua dat. */
  modelValue: string;
  id?: string;
}>();
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const FORMAT = 'YYYY/MM/DD HH:MM';

/** `2026-10-06T17:20` -> `2026/10/06 17:20` */
function toDisplay(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(value.trim());
  return m ? `${m[1]}/${m[2]}/${m[3]} ${m[4]}:${m[5]}` : '';
}

/**
 * Doc nguoc lai. Nhan ca dau `/`, `-` va `.` vi ba kieu nay deu quen tay,
 * va cho go thieu so 0 dung dau ("2026/10/6 9:05"). Khong doc duoc thi
 * tra ve rong — man cha hieu la chua dat.
 */
function toValue(text: string): string {
  const m = /^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2}))?$/.exec(text.trim());
  if (!m) return '';
  const [, y, mo, d, h = '0', mi = '0'] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  // Chan "2026/02/31": Date tu tran sang thang sau thay vi bao loi.
  if (
    date.getFullYear() !== Number(y) ||
    date.getMonth() !== Number(mo) - 1 ||
    date.getDate() !== Number(d) ||
    Number(h) > 23 ||
    Number(mi) > 59
  ) {
    return '';
  }
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${y}-${pad(Number(mo))}-${pad(Number(d))}T${pad(Number(h))}:${pad(Number(mi))}`;
}

const text = ref(toDisplay(props.modelValue));

/** Man cha nap lai gia tri (vi du sau khi luu) thi o nhap theo. */
watch(
  () => props.modelValue,
  (value) => {
    if (toValue(text.value) !== value) text.value = toDisplay(value);
  },
);

const invalid = computed(() => text.value.trim().length > 0 && toValue(text.value) === '');

function onInput(event: Event): void {
  text.value = (event.target as HTMLInputElement).value;
  emit('update:modelValue', toValue(text.value));
}

/** Go xong roi thi don lai cho dep: "2026/10/6 9:5" -> "2026/10/06 09:05". */
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
    :aria-describedby="invalid ? `${id}-loi` : undefined"
    @input="onInput"
    @blur="onBlur"
  >
  <span v-if="invalid" :id="`${id}-loi`" class="field-error">
    {{ $t('ui.dateTimeFormat', { format: FORMAT }) }}
  </span>
</template>
