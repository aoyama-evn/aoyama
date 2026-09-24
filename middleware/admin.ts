/**
 * Chan toan bo trang quan tri — RD muc 8.
 * Guard nay chi la lop chan o giao dien; quyen that su van do backend quyet dinh.
 */
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();
  if (import.meta.server) return;

  auth.restore();
  if (!auth.isAuthenticated) {
    return navigateTo(`/admin/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
  if (!auth.isAdmin) {
    return navigateTo('/forbidden');
  }
  // Tai khoan moi tao bat buoc doi mat khau truoc khi lam viec khac — NFR-SE-02.
  if (auth.user?.mustChangePassword && to.path !== '/admin/change-password') {
    return navigateTo('/admin/change-password');
  }
});
