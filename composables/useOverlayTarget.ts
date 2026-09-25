/**
 * Noi de dua lop phu (menu, hop thoai, thong bao) den.
 *
 * Site khach hang ve theo khung dien thoai: tren man hinh rong, ung dung nam
 * trong mot khung may co vien, va lop phu phai nam **trong** khung do chu khong
 * phu kin ca trinh duyet. Bo cuc cua site khach hang dat id "ay-screen" cho
 * vung man hinh, nen lop phu tim den do truoc; khong co thi ve body nhu thuong.
 */
export const SCREEN_ID = 'ay-screen';

export function useOverlayTarget() {
  const target = ref<string>('body');

  onMounted(() => {
    if (document.getElementById(SCREEN_ID)) target.value = `#${SCREEN_ID}`;
  });

  // Doi bo cuc (khach ↔ quan tri) thi noi den cung doi theo.
  const route = useRoute();
  watch(
    () => route.path,
    async () => {
      await nextTick();
      target.value = document.getElementById(SCREEN_ID) ? `#${SCREEN_ID}` : 'body';
    },
  );

  return target;
}
