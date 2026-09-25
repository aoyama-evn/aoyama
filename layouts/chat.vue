<script setup lang="ts">
import { SCREEN_ID } from '~/composables/useOverlayTarget';

/**
 * Bo cuc cho SC-10. Van la khung dien thoai nhu bo cuc thuong, nhung man hinh
 * tro chuyen tu lo phan cuon cua no (dai tro ly o tren, o soan ghim duoi), nen
 * o day khong boc them lop cuon nao nua.
 */
</script>

<template>
  <div class="ay-device">
    <div class="ay-device-frame">
      <span class="ay-device-btn ay-device-btn-up" aria-hidden="true" />
      <span class="ay-device-btn ay-device-btn-down" aria-hidden="true" />
      <span class="ay-device-btn ay-device-btn-power" aria-hidden="true" />

      <div :id="SCREEN_ID" class="ay-device-screen">
        <span class="ay-device-notch" aria-hidden="true" />
        <PhoneStatusBar class="ay-device-statusbar" />
        <SiteHeader />
        <slot />
        <SiteMenu />
        <span class="ay-device-home" aria-hidden="true" />
      </div>
    </div>
  </div>
</template>
