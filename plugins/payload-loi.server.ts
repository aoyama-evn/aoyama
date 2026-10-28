/**
 * Chua moi trang bao loi cua site khach hang khoi tra ve 500.
 *
 * Khi khong tim thay trang, Nuxt goi lai chinh no qua `/__nuxt_error?...` roi
 * doc cac tham so bang `getQuery`. Ham do dung `Object.create(null)`, nen doi
 * tuong loi nam trong payload khong co nguyen mau. Den luc dong goi payload,
 * `shouldHydrate` cua Pinia goi thang `obj.hasOwnProperty(...)` — ma doi tuong
 * khong nguyen mau thi khong co ham do — va nem TypeError. Ket qua: moi dia
 * chi sai tren site khach hang tra ve 500 kem vet goi ham, thay vi trang 404.
 *
 * Pinia 3.0.4 da doi sang `Object.prototype.hasOwnProperty.call(...)`, nhung
 * do la buoc nhay phien ban lon (keo theo ca @pinia/nuxt). Cho den khi nang
 * cap, chi can chep lai doi tuong loi thanh doi tuong thuong la du: `app:rendered`
 * chay ngay truoc khi payload duoc dong goi.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:rendered', ({ ssrContext }) => {
    const payload = ssrContext?.payload as { error?: unknown } | undefined;
    const error = payload?.error;
    if (payload && error && typeof error === 'object' && Object.getPrototypeOf(error) === null) {
      payload.error = { ...(error as Record<string, unknown>) };
    }
  });
});
