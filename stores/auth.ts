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
  /**
   * SA-01 "Ghi nho dang nhap". Bo danh dau thi phien chi song trong tab dang
   * mo: token nam o sessionStorage thay vi localStorage.
   */
  const remember = ref(true);

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value));
  const isAdmin = computed(() => user.value?.role === 'R-ADMIN');
  const isCustomer = computed(() => user.value?.role === 'R-USER');
  const isSuperAdmin = computed(() => user.value?.adminRole === 'ADMIN');

  function store(): Storage {
    return remember.value ? localStorage : sessionStorage;
  }

  /** Doc lai phien khi tai lai trang. */
  function restore(): void {
    if (!import.meta.client) return;
    try {
      // Phien khong ghi nho nam o sessionStorage, nen phai thu ca hai cho.
      const from = localStorage.getItem(ACCESS_KEY) ? localStorage : sessionStorage;
      remember.value = from === localStorage;
      accessToken.value = from.getItem(ACCESS_KEY);
      refreshToken.value = from.getItem(REFRESH_KEY);
      const raw = from.getItem(USER_KEY);
      user.value = raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      // Trinh duyet chan luu tru hoac du lieu hong — coi nhu chua dang nhap.
      clear();
    }
  }

  function persist(): void {
    if (!import.meta.client) return;
    try {
      const target = store();
      const other = target === localStorage ? sessionStorage : localStorage;
      for (const key of [ACCESS_KEY, REFRESH_KEY, USER_KEY]) other.removeItem(key);

      if (accessToken.value) target.setItem(ACCESS_KEY, accessToken.value);
      else target.removeItem(ACCESS_KEY);

      if (refreshToken.value) target.setItem(REFRESH_KEY, refreshToken.value);
      else target.removeItem(REFRESH_KEY);

      if (user.value) target.setItem(USER_KEY, JSON.stringify(user.value));
      else target.removeItem(USER_KEY);
    } catch {
      // Khong luu duoc thi phien chi song trong tab hien tai — van dung duoc.
    }
  }

  function setRemember(value: boolean): void {
    remember.value = value;
    persist();
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
    remember,
    setRemember,
    setSession,
    setTokens,
    clear,
  };
});
