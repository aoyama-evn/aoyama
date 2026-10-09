/**
 * Duong dan toi mot tep trong public/, ghep san tien to thu muc goc.
 *
 * Nuxt tu ghep tien to cho NuxtLink va cho router, nen `to="/stores"` chay
 * dung ca khi ung dung nam o thu muc con. Nhung `src` cua the <img> va
 * `href` cua the <link> thi khong: chung di thang vao HTML, trinh duyet doc
 * "/design/xe.jpg" la hieu goc ten mien, va tren GitHub Pages — noi ung dung
 * nam o /<ten-repo>/ — anh se hong.
 *
 * Moi tham chieu toi tep trong public/ deu phai di qua day.
 */
export function assetUrl(path: string): string {
  const base = useRuntimeConfig().app.baseURL || '/';
  const goc = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${goc}${path.startsWith('/') ? path : `/${path}`}`;
}
