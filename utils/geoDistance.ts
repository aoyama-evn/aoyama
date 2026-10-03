/** Ban kinh trung binh cua Trai Dat, tinh bang km. */
const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Khoang cach duong chim bay giua hai toa do, tinh bang km (cong thuc haversine).
 *
 * Du de xep cac cua hang theo thu tu gan xa va noi cho khach biet "cach
 * khoang 3 km". Khong phai quang duong di that — mot con so chinh xac hon
 * phai goi dich vu ban do ben ngoai, va de chon cua hang thi khong can.
 */
export function distanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Hoi vi tri trinh duyet. Tra ve null khi khach tu choi, may khong co GPS,
 * hoac qua lau khong tra loi — moi truong hop deu dan den cung mot cach xu
 * ly: hien danh sach cua hang binh thuong de khach tu chon.
 */
export function askBrowserLocation(timeoutMs = 8000): Promise<{ lat: number; lng: number } | null> {
  if (!import.meta.client || !navigator.geolocation) return Promise.resolve(null);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: { lat: number; lng: number } | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    // Chrome tren may ban doi khi khong goi lai callback nao ca — tu chot.
    setTimeout(() => finish(null), timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (pos) => finish({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => finish(null),
      { timeout: timeoutMs, maximumAge: 300_000 },
    );
  });
}
