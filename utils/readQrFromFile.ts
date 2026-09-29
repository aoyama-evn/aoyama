import jsQR from 'jsqr';

/**
 * Doc noi dung ma QR tu mot tep anh, giai ma ngay tren may — anh khong roi
 * khoi dien thoai cua khach.
 *
 * Uu tien BarcodeDetector cua trinh duyet vi no nhanh hon va doc duoc ca anh
 * chup nghieng. Nhung Firefox va Safari khong co API nay, Chrome tren Windows
 * cung thuong thieu, nen truoc day man tra cuu bao "trinh duyet khong doc
 * duoc" voi gan nhu moi may. Khong co thi dung jsQR da dong goi san.
 *
 * Tra ve null khi anh khong chua ma QR nao doc duoc.
 */
export async function readQrFromFile(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  try {
    return (await readWithBarcodeDetector(bitmap)) ?? readWithJsQr(bitmap);
  } finally {
    bitmap.close?.();
  }
}

interface BarcodeDetectorLike {
  detect(source: ImageBitmap): Promise<{ rawValue: string }[]>;
}

async function readWithBarcodeDetector(bitmap: ImageBitmap): Promise<string | null> {
  const Detector = (
    globalThis as unknown as {
      BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike;
    }
  ).BarcodeDetector;
  if (!Detector) return null;

  try {
    const found = await new Detector({ formats: ['qr_code'] }).detect(bitmap);
    return found[0]?.rawValue?.trim() || null;
  } catch {
    // Co API nhung khong chay duoc tren may nay — de jsQR lam tiep.
    return null;
  }
}

function readWithJsQr(bitmap: ImageBitmap): string | null {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(bitmap, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(image.data, image.width, image.height)?.data?.trim() || null;
}
