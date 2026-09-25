/**
 * Trang thai ngan keo menu cua CP-01. Dau trang mo, ngan keo dong — hai thanh
 * phan nam o hai cho khac nhau trong bo cuc nen phai dung chung mot o trang thai.
 */
export function useSiteMenu() {
  const isOpen = useState('site-menu-open', () => false);
  const route = useRoute();

  // Doi trang thi dong lai, khong de ngan keo con treo tren man hinh moi.
  watch(() => route.fullPath, () => {
    isOpen.value = false;
  });

  return {
    isOpen,
    open: () => {
      isOpen.value = true;
    },
    close: () => {
      isOpen.value = false;
    },
  };
}
