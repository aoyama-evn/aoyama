// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt', '@vueuse/nuxt', '@nuxtjs/i18n'],

  // Dung PostCSS san co cua Nuxt thay vi module @nuxtjs/tailwindcss: module do
  // nap cau hinh ngoai tien trinh Vite va bao loi import.meta tren du an ESM.
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  // organic.css la tep goc cua he thong thiet ke, phai nap truoc main.css.
  css: ['~/assets/css/organic.css', '~/assets/css/main.css'],

  // Ten thanh phan lay thang tu ten tep, khong gan tien to thu muc — AyButton
  // doc de hon UiAyButton. Vi vay ten tep phai duy nhat tren toan bo components/.
  components: [{ path: '~/components', pathPrefix: false }],

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3001/api/v1',
      /** C-03 — moi moc thoi gian hien thi theo gio Nhat Ban. */
      timezone: 'Asia/Tokyo',
      appName: 'AOYAMA Service',
    },
  },

  // C-02 — ba ngon ngu, mac dinh tieng Nhat.
  // @nuxtjs/i18n v9 doc tep ngon ngu trong thu muc i18n/, nen langDir tinh
  // tuong doi tu do (i18n/locales).
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'ja',
    locales: [
      { code: 'ja', name: '日本語', file: 'ja.json' },
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'vi', name: 'Tiếng Việt', file: 'vi.json' },
    ],
    langDir: 'locales',
    lazy: true,
    bundle: { optimizeTranslationDirective: false },
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'aoyama_lang',
      redirectOn: 'root',
      alwaysRedirect: false,
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'ja' },
      title: 'AOYAMA Service',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content:
            'Dat lich bao duong va sua chua xe may tai chuoi cua hang AOYAMA — Mobility Enshu Railway.',
        },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  typescript: { strict: true, typeCheck: false },

  /**
   * Trang quan tri la SPA (khong can SEO va luon sau dang nhap), con site khach
   * hang chay SSR de trang cong khai len chi muc tim kiem — OV-2026-001 muc 7.
   */
  routeRules: {
    '/admin/**': { ssr: false },
    '/account/**': { ssr: false },
  },
});
