/**
 * Luu mot data URL thanh tep tren may khach.
 *
 * Anh ma QR may chu tra ve la PNG dang base64. Gan thang data URL vao the
 * <a download> thi Safari khong nhan, nen doi sang Blob roi dung object URL —
 * cach nay chay tren Chrome, Edge, Firefox va Safari tu ban 13.
 *
 * Tra ve false khi trinh duyet khong tai duoc tep (iOS doi cu), de man hinh
 * goi con duong lui: mo anh ra de khach nhan giu va luu tay.
 */
export function downloadDataUrl(dataUrl: string, fileName: string): boolean {
  if (!import.meta.client) return false;

  const anchor = document.createElement('a');
  if (!('download' in anchor)) return false;

  let objectUrl: string | null = null;
  try {
    objectUrl = URL.createObjectURL(dataUrlToBlob(dataUrl));
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    // Phai nam trong tai lieu thi Firefox moi kich hoat cu bam.
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Thu hoi sau mot nhip, khong thi cat mat duong dan khi tep chua tai xong.
    setTimeout(() => URL.revokeObjectURL(objectUrl as string), 10_000);
    return true;
  } catch {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    return false;
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) throw new Error('data URL khong hop le');

  const head = dataUrl.slice(0, comma);
  const body = dataUrl.slice(comma + 1);
  const mime = /:(.*?)[;,]/.exec(head)?.[1] || 'application/octet-stream';

  if (!head.includes(';base64')) {
    return new Blob([decodeURIComponent(body)], { type: mime });
  }

  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Bo nhung ky tu he dieu hanh khong cho dat ten tep. */
export function safeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-');
}
