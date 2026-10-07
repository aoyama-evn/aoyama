import type { ApiError } from '~/types/models';

/**
 * Chi nhung tuy chon lop nay thuc su dung. Lay thang FetchOptions cua ofetch
 * thi kieu method rong hon kieu $fetch cua Nitro chap nhan.
 */
type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, unknown>;
  body?: Record<string, unknown> | BodyInit | null;
  headers?: Record<string, string>;
};

/**
 * Lop goi API dung chung.
 *
 * Hai viec quan trong o day:
 *  1. Tu dong gan Bearer token.
 *  2. Gap 401 thi thu xoay refresh token dung mot lan roi goi lai; that bai
 *     thi dua nguoi dung ve man hinh phien het han (SY-05).
 */

let refreshPromise: Promise<boolean> | null = null;

/**
 * Dia chi API tinh theo chinh dia chi trang dang mo.
 *
 * Cau hinh mac dinh tro ve "http://localhost:3001". Mo trang tu dien
 * thoai bang IP cua may chu thi "localhost" lai la chinh cai dien thoai
 * do — moi loi goi API deu truot. Nen khi trang khong mo bang localhost,
 * doi ten may trong dia chi API theo ten may cua trang, giu nguyen cong.
 *
 * Dat NUXT_PUBLIC_API_BASE tro ra ten mien that thi khong dong vao nua.
 */
function resolveApiBase(configured: string): string {
  if (!import.meta.client) return configured;
  try {
    const api = new URL(configured, window.location.origin);
    const local = ['localhost', '127.0.0.1', '[::1]'];
    if (!local.includes(api.hostname) || local.includes(window.location.hostname)) {
      return configured;
    }
    api.hostname = window.location.hostname;
    api.protocol = window.location.protocol;
    return api.toString().replace(/\/$/, '');
  } catch {
    return configured;
  }
}

export function useApi() {
  const config = useRuntimeConfig();
  const auth = useAuthStore();
  const baseURL = resolveApiBase(config.public.apiBase);

  async function tryRefresh(): Promise<boolean> {
    if (!auth.refreshToken) return false;

    // Nhieu yeu cau cung gap 401 mot luc chi duoc xoay token mot lan.
    if (!refreshPromise) {
      refreshPromise = $fetch<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
        baseURL,
        method: 'POST',
        body: { refreshToken: auth.refreshToken },
      })
        .then((res) => {
          auth.setTokens(res.accessToken, res.refreshToken);
          return true;
        })
        .catch(() => {
          auth.clear();
          return false;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }
    return refreshPromise;
  }

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = { ...(options.headers ?? {}) };
    if (auth.accessToken) {
      headers.Authorization = `Bearer ${auth.accessToken}`;
    }

    try {
      return await $fetch<T>(path, { baseURL, ...options, headers });
    } catch (error) {
      const status = (error as { statusCode?: number; status?: number }).statusCode
        ?? (error as { status?: number }).status;

      if (status === 401 && auth.refreshToken) {
        const refreshed = await tryRefresh();
        if (refreshed) {
          const retryHeaders = { ...headers, Authorization: `Bearer ${auth.accessToken}` };
          return $fetch<T>(path, { baseURL, ...options, headers: retryHeaders });
        }
        if (import.meta.client) {
          await navigateTo('/session-expired');
        }
      }
      throw normalizeError(error);
    }
  }

  return {
    get: <T>(path: string, query?: Record<string, unknown>) =>
      request<T>(path, { method: 'GET', query }),
    post: <T>(path: string, body?: RequestOptions['body']) =>
      request<T>(path, { method: 'POST', body }),
    put: <T>(path: string, body?: RequestOptions['body']) =>
      request<T>(path, { method: 'PUT', body }),
    patch: <T>(path: string, body?: RequestOptions['body']) =>
      request<T>(path, { method: 'PATCH', body }),
    del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
    raw: request,
  };
}

/** Dua moi loi ve dang ApiError de man hinh chi phai xu ly mot kieu. */
export function normalizeError(error: unknown): ApiError {
  const data = (error as { data?: ApiError }).data;
  if (data?.code) return data;

  /**
   * Lop goi API da chuan hoa truoc khi nem ra, nhung gan nhu man hinh nao
   * cung goi lai ham nay trong khoi catch. Khong nhan ra ban da chuan hoa
   * thi no roi xuong nhanh cuoi va bien moi loi thanh UNKNOWN_ERROR — nguoi
   * dung thay "Ma loi: UNKNOWN_ERROR" thay vi ma that de bao ho tro.
   */
  const already = error as Partial<ApiError>;
  if (typeof already?.code === 'string' && typeof already?.statusCode === 'number') {
    return already as ApiError;
  }

  const statusCode =
    (error as { statusCode?: number }).statusCode ?? (error as { status?: number }).status ?? 0;

  if (statusCode === 0) {
    return {
      statusCode: 0,
      code: 'NETWORK_ERROR',
      message: 'Khong ket noi duoc may chu. Vui long kiem tra duong truyen.',
    };
  }
  return {
    statusCode,
    code: 'UNKNOWN_ERROR',
    message: (error as Error)?.message ?? 'Da co loi xay ra',
  };
}
