/** Thu hep them cho cac man hinh chi vai tro ADMIN duoc vao — SA-39, SA-43, SA-44. */
export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore();
  if (import.meta.server) return;

  if (!auth.isSuperAdmin) {
    return navigateTo('/forbidden');
  }
});
