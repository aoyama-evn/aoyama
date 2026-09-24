import type { FetchOptions } from 'ofetch';
import type { ApiError } from '~/types/models';

/**
 * Lop goi API dung chung.
 *
 * Hai viec quan trong o day:
 *  1. Tu dong gan Bearer token.
 *  2. Gap 401 thi thu xoay refresh token dung mot lan roi goi lai; that bai
 *     thi dua nguoi dung ve man hinh phien het han (SY-05).
 */

let refreshPromise: Promise<boolean> | null = null;

export function useApi() {
  const config = useRuntimeConfig();
  const auth = useAuthStore();
  const baseURL = config.public.apiBase;

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

  async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) ?? {}),
    };
    if (auth.accessToken) {
      headers.Authorization = `Bearer ${auth.accessToken}`;
    }

    try {
      return await $fetch<T>(path, { baseURL, ...options, headers } as FetchOptions<'json'>);
    } catch (error) {
      const status = (error as { statusCode?: number; status?: number }).statusCode
        ?? (error as { status?: number }).status;

      if (status === 401 && auth.refreshToken) {
        const refreshed = await tryRefresh();
        if (refreshed) {
          const retryHeaders = { ...headers, Authorization: `Bearer ${auth.accessToken}` };
          return $fetch<T>(path, {
            baseURL,
            ...options,
            headers: retryHeaders,
          } as FetchOptions<'json'>);
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
    post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
    put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
    patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
    del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
    raw: request,
  };
}

/** Dua moi loi ve dang ApiError de man hinh chi phai xu ly mot kieu. */
export function normalizeError(error: unknown): ApiError {
  const data = (error as { data?: ApiError }).data;
  if (data?.code) return data;

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
