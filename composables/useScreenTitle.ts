/**
 * Ten man hinh quan tri.
 * Ban thiet ke dat ten man hinh o CP-05 chu khong dat trong noi dung, nen tung
 * trang khai bao ten cua minh vao day va thanh tieu de doc ra.
 */
export function useScreenTitle() {
  return useState<string>('admin-screen-title', () => 'Trang quản trị');
}

/** Goi trong trang quan tri de dat ten hien tren CP-05. */
export function setScreenTitle(title: MaybeRefOrGetter<string>): void {
  const state = useScreenTitle();
  watchEffect(() => {
    state.value = toValue(title);
  });
}
