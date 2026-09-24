import { defineStore } from 'pinia';

export interface ToastItem {
  id: number;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  detail?: string;
}

let nextId = 1;

/**
 * CP-09 Thong bao ket qua thao tac — tu an sau 5 giay.
 * Va CP-05: cua hang dang chon o thanh tieu de trang quan tri.
 */
export const useUiStore = defineStore('ui', () => {
  const toasts = ref<ToastItem[]>([]);
  const sidebarCollapsed = ref(false);
  const activeStoreId = ref<string | null>(null);

  function push(type: ToastItem['type'], message: string, detail?: string): number {
    const id = nextId++;
    toasts.value = [...toasts.value, { id, type, message, detail }];
    // Loi giu lau hon de nguoi dung kip doc noi dung.
    const ttl = type === 'error' ? 8000 : 5000;
    if (import.meta.client) {
      setTimeout(() => dismiss(id), ttl);
    }
    return id;
  }

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  const success = (message: string, detail?: string) => push('success', message, detail);
  const warning = (message: string, detail?: string) => push('warning', message, detail);
  const error = (message: string, detail?: string) => push('error', message, detail);
  const info = (message: string, detail?: string) => push('info', message, detail);

  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function setActiveStore(storeId: string | null): void {
    activeStoreId.value = storeId;
    if (import.meta.client) {
      try {
        if (storeId) localStorage.setItem('aoyama_active_store', storeId);
        else localStorage.removeItem('aoyama_active_store');
      } catch {
        // Khong luu duoc thi chi mat lua chon khi tai lai trang.
      }
    }
  }

  function restoreActiveStore(): void {
    if (!import.meta.client) return;
    try {
      activeStoreId.value = localStorage.getItem('aoyama_active_store');
    } catch {
      activeStoreId.value = null;
    }
  }

  return {
    toasts,
    sidebarCollapsed,
    activeStoreId,
    push,
    dismiss,
    success,
    warning,
    error,
    info,
    toggleSidebar,
    setActiveStore,
    restoreActiveStore,
  };
});
