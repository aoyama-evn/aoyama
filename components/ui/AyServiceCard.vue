<script setup lang="ts">
import type { ServiceItem } from '~/types/models';

/** CP-12 The dich vu — SC-02, SC-03, SC-12. */
const props = defineProps<{ service: ServiceItem; selectable?: boolean; selected?: boolean; to?: string }>();
const emit = defineEmits<{ (e: 'toggle', id: string): void }>();

const { i18n, money } = useFormat();

const priceLabel = computed(() =>
  props.service.quoteOnly ? 'báo giá riêng' : `~ ${money(props.service.basePrice)}`,
);
</script>

<template>
  <component
    :is="selectable ? 'button' : to ? 'NuxtLink' : 'div'"
    :to="to"
    :type="selectable ? 'button' : undefined"
    :aria-pressed="selectable ? selected : undefined"
    class="flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-left transition-colors"
    :class="selected ? 'ring-2 ring-accent-400 bg-accent-100' : 'hover:bg-accent-200'"
    style="min-height: 48px"
    @click="selectable && emit('toggle', service.id)"
  >
    <AyServiceIcon :icon-key="service.iconKey" />

    <span class="flex-1">
      <span class="block text-[14.5px] font-semibold">{{ i18n(service.name) }}</span>
      <span class="block text-[12.5px] ay-muted">
        {{ i18n(service.shortDescription) }}
        <template v-if="service.durationMinutes"> · {{ service.durationMinutes }} phút</template>
      </span>
    </span>

    <span class="font-heading text-[13.5px] whitespace-nowrap">{{ priceLabel }}</span>
  </component>
</template>
