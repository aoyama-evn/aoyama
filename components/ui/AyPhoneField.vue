<script setup lang="ts">
/**
 * O nhap so dien thoai co chon ma quoc gia.
 *
 * Cua hang o Nhat nhung phuc vu nhieu khach Viet, nen go nham dau so la
 * chuyen thuong: khach Viet go "0969..." theo thoi quen trong nuoc, he
 * thong hieu thanh so Nhat va khong tim ra ho so cu. Tach ma quoc gia ra
 * mot o chon rieng thi khong con nham duoc.
 *
 * Mac dinh theo ngon ngu khach dang xem: tieng Viet thi +84, con lai +81
 * (tieng Anh cung +81 vi cua hang nam o Nhat).
 */
const props = defineProps<{ modelValue: string; id?: string; invalid?: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

const { locale } = useI18n();

/** Nhat va Viet truoc; may nuoc con lai la cong dong dong o Shizuoka. */
const COUNTRIES = [
  { code: '+81', iso: 'JP' },
  { code: '+84', iso: 'VN' },
  { code: '+82', iso: 'KR' },
  { code: '+86', iso: 'CN' },
  { code: '+63', iso: 'PH' },
  { code: '+1', iso: 'US' },
];

function defaultCode(): string {
  return locale.value === 'vi' ? '+84' : '+81';
}

const dialCode = ref(defaultCode());
const localPart = ref('');

/**
 * Doi ngon ngu giua chung thi doi theo, nhung chi khi khach chua go gi —
 * dang go do ma ma vung tu nhay thi ho khong hieu chuyen gi xay ra.
 */
watch(locale, () => {
  if (!localPart.value) dialCode.value = defaultCode();
});

/**
 * Ghep lai thanh mot chuoi E.164. Bo so 0 dung dau phan noi dia: nguoi
 * Nhat va nguoi Viet deu quen viet "090..." / "096...", ma dang quoc te
 * thi khong co so 0 do.
 */
function emitValue(): void {
  const digits = localPart.value.replace(/\D/g, '').replace(/^0+/, '');
  emit('update:modelValue', digits ? `${dialCode.value}${digits}` : '');
}

watch([dialCode, localPart], emitValue);

/** Man cha dat lai gia tri (vi du nap ban nhap cu) thi tach nguoc ra hai o. */
watch(
  () => props.modelValue,
  (value) => {
    if (!value || value === `${dialCode.value}${localPart.value.replace(/\D/g, '').replace(/^0+/, '')}`) {
      return;
    }
    const found = COUNTRIES.find((c) => value.startsWith(c.code));
    if (found) {
      dialCode.value = found.code;
      localPart.value = value.slice(found.code.length);
    } else {
      localPart.value = value.replace(/^\+/, '');
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex gap-2">
    <select
      v-model="dialCode"
      class="input flex-none"
      style="width: 112px"
      :aria-label="$t('sc17.countryCode')"
    >
      <option v-for="c in COUNTRIES" :key="c.code" :value="c.code">
        {{ c.code }} ({{ c.iso }})
      </option>
    </select>
    <input
      :id="id"
      v-model="localPart"
      class="input min-w-0 flex-1"
      type="tel"
      inputmode="tel"
      autocomplete="tel-national"
      :aria-invalid="invalid || undefined"
      :placeholder="dialCode === '+84' ? '969 376 966' : '90-1234-5678'"
    >
  </div>
</template>
