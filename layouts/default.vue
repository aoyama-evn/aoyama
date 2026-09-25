<script setup lang="ts">
import { SCREEN_ID } from '~/composables/useOverlayTarget';

/**
 * Bo cuc site khach hang.
 *
 * Ban thiet ke ve toan bo site nay trong mot khung dien thoai 392 × 772: thanh
 * trang thai va dau trang dung yen o tren, chi phan noi dung cuon. Tren dien
 * thoai that vo may bien mat va ung dung chiem tron man hinh (xem .ay-device
 * trong main.css).
 */
</script>

<template>
  <div class="ay-device">
    <div class="ay-device-frame">
      <div :id="SCREEN_ID" class="ay-device-screen">
        <PhoneStatusBar class="ay-device-statusbar" />
        <SiteHeader />

        <div class="ay-device-scroll">
          <main class="sp-shell w-full px-4 py-4">
            <slot />
          </main>
          <SiteFooter />
        </div>

        <SiteMenu />
      </div>
    </div>
  </div>
</template>
