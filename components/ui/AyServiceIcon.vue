<script setup lang="ts">
/** Bieu tuong dich vu — anh xa tu iconKey trong danh muc sang hinh ve san. */
defineProps<{ iconKey: string | null }>();

const PATHS: Record<string, string> = {
  leaf: 'M14.7 6.3a4 4 0 0 0 5 5L21 21H3l8-8a4 4 0 0 1 0-5 4 4 0 0 1 3.7-1.7Z',
  clock: 'M12 8v4l3 2',
  target: '',
  wrench: 'M15 4a5 5 0 0 0-6.6 6.2L3 15.6V21h5.4l5.4-5.4A5 5 0 0 0 20 9l-3 3-2-2 3-3a5 5 0 0 0-3-3Z',
  brush: 'M18 3 21 6l-9.5 9.5H8v-3.5L18 3M4 20h16',
  shield: 'M12 3l7 3v6c0 4.2-2.9 7.7-7 9-4.1-1.3-7-4.8-7-9V6l7-3M9 12l2 2 4-4',
};
</script>

<template>
  <svg
    width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="var(--color-accent-700)" stroke-width="2.5"
    stroke-linecap="round" stroke-linejoin="round"
    class="flex-none" aria-hidden="true"
  >
    <template v-if="iconKey === 'clock' || iconKey === 'target'">
      <circle cx="12" cy="12" r="8.5" />
      <circle v-if="iconKey === 'target'" cx="12" cy="12" r="3" />
    </template>
    <path v-if="PATHS[iconKey ?? '']" :d="PATHS[iconKey ?? '']" />
    <circle v-if="!iconKey" cx="12" cy="12" r="8.5" />
  </svg>
</template>
