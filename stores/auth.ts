import { defineStore } from 'pinia';
import type { AdminRole, UserRole } from '~/types/enums';
import type { TokenResponse } from '~/types/models';

interface SessionUser {
  id: string;
  name: string;
  role: UserRole;
  adminRole?: AdminRole;
  phone?: string;
  username?: string;
  storeId?: string | null;
  mustChangePassword?: boolean;
}

const ACCESS_KEY = 'aoyama_access_token';
const REFRESH_KEY = 'aoyama_refresh_token';
const USER_KEY = 'aoyama_user';

/**
 * Phien dang nhap cua ca hai site.
 * Token nam trong localStorage: trang quan tri chay SPA nen khong dung duoc
 * cookie httpOnly cua SSR; bu lai access token co han ngan va refresh token
 * duoc xoay moi lan dung (xem TokenService cua backend).
 */
export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const user = ref<SessionUser | null>(null);

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value));
  const isAdmin = computed(() => user.value?.role === 'R-ADMIN');
  const isCustomer = computed(() => user.value?.role === 'R-USER');
  const isSuperAdmin = computed(() => user.value?.adminRole === 'ADMIN');

  /** Doc lai phien tu localStorage khi tai lai trang. */
  function restore(): void {
    if (!import.meta.client) return;
    try {
      accessToken.value = localStorage.getItem(ACCESS_KEY);
      refreshToken.value = localStorage.getItem(REFRESH_KEY);
      const raw = localStorage.getItem(USER_KEY);
      user.value = raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      // Trinh duyet chan luu tru hoac du lieu hong — coi nhu chua dang nhap.
      clear();
    }
  }

  function persist(): void {
    if (!import.meta.client) return;
    try {
      if (accessToken.value) localStorage.setItem(ACCESS_KEY, accessToken.value);
      else localStorage.removeItem(ACCESS_KEY);

      if (refreshToken.value) localStorage.setItem(REFRESH_KEY, refreshToken.value);
      else localStorage.removeItem(REFRESH_KEY);

      if (user.value) localStorage.setItem(USER_KEY, JSON.stringify(user.value));
      else localStorage.removeItem(USER_KEY);
    } catch {
      // Khong luu duoc thi phien chi song trong tab hien tai — van dung duoc.
    }
  }

  function setSession(payload: TokenResponse, role: UserRole): void {
    accessToken.value = payload.accessToken;
    refreshToken.value = payload.refreshToken;

    const raw = payload.user as Record<string, unknown>;
    user.value = {
      id: String(raw.id ?? ''),
      name: String(raw.fullName ?? raw.name ?? ''),
      role,
      adminRole: raw.role as AdminRole | undefined,
      phone: raw.phone as string | undefined,
      username: raw.username as string | undefined,
      storeId: (raw.storeId as string | null | undefined) ?? null,
      mustChangePassword: Boolean(raw.mustChangePassword),
    };
    persist();
  }

  function setTokens(access: string, refresh: string): void {
    accessToken.value = access;
    refreshToken.value = refresh;
    persist();
  }

  function clear(): void {
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
    persist();
  }

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated,
    isAdmin,
    isCustomer,
    isSuperAdmin,
    restore,
    setSession,
    setTokens,
    clear,
  };
});
