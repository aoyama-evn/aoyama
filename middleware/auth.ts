/** Chan man hinh cua khach chua dang nhap — SC-21, SC-29..SC-34. */
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();
  if (import.meta.server) return;

  auth.restore();
  if (!auth.isAuthenticated) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});
