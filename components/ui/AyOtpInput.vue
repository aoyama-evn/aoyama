<script setup lang="ts">
/**
 * O nhap ma OTP — SC-19 va lop phu xac thuc.
 * Ban thiet ke chia thanh sau o vuong rieng, chu font tieu de can giua.
 * Go mot chu so thi nhay sang o sau, xoa thi lui ve o truoc, dan ca ma cung duoc.
 */
const props = withDefaults(defineProps<{ modelValue: string; length?: number; size?: 'md' | 'lg' }>(), {
  length: 6,
  size: 'lg',
});
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

const cells = ref<HTMLInputElement[]>([]);

const digits = computed(() => {
  const clean = props.modelValue.replace(/\D/g, '').slice(0, props.length);
  return Array.from({ length: props.length }, (_, i) => clean[i] ?? '');
});

function write(next: string[]): void {
  emit('update:modelValue', next.join('').slice(0, props.length));
}

function onInput(index: number, event: Event): void {
  const input = event.target as HTMLInputElement;
  const typed = input.value.replace(/\D/g, '');

  // Dan ca ma vao mot o thi trai deu ra cac o con lai.
  if (typed.length > 1) {
    const next = digits.value.slice();
    typed.split('').forEach((char, offset) => {
      if (index + offset < props.length) next[index + offset] = char;
    });
    write(next);
    cells.value[Math.min(index + typed.length, props.length - 1)]?.focus();
    return;
  }

  const next = digits.value.slice();
  next[index] = typed;
  write(next);
  if (typed) cells.value[index + 1]?.focus();
}

function onKeydown(index: number, event: KeyboardEvent): void {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    event.preventDefault();
    const next = digits.value.slice();
    next[index - 1] = '';
    write(next);
    cells.value[index - 1]?.focus();
  }
  if (event.key === 'ArrowLeft') cells.value[index - 1]?.focus();
  if (event.key === 'ArrowRight') cells.value[index + 1]?.focus();
}
</script>

<template>
  <div
    class="grid gap-2"
    :style="{ gridTemplateColumns: `repeat(${length}, 1fr)` }"
    role="group"
    aria-label="Mã xác thực 6 chữ số"
  >
    <input
      v-for="(digit, index) in digits"
      :key="index"
      :ref="(el) => { if (el) cells[index] = el as HTMLInputElement; }"
      class="input font-heading text-center"
      :style="{
        paddingInline: '0',
        minHeight: size === 'lg' ? '54px' : '50px',
        fontSize: size === 'lg' ? '20px' : '18px',
      }"
      type="text"
      inputmode="numeric"
      :autocomplete="index === 0 ? 'one-time-code' : 'off'"
      maxlength="6"
      :value="digit"
      :aria-label="`Chữ số thứ ${index + 1}`"
      @input="onInput(index, $event)"
      @keydown="onKeydown(index, $event)"
    />
  </div>
</template>
