// PrayerTimes.ts
// Self-contained prayer times calculation (based on PrayTimes.org JS code)

export function getPrayerTimes(
  date: Date,
  latitude: number,
  longitude: number,
  timezone: number = date.getTimezoneOffset() / -60
) {
  // ---- Helper functions ----
  const D2R = Math.PI / 180.0;
  const R2D = 180.0 / Math.PI;

  function fixAngle(a: number) {
    return a - 360.0 * Math.floor(a / 360.0);
  }

  function dsin(d: number) {
    return Math.sin(d * D2R);
  }

  function dcos(d: number) {
    return Math.cos(d * D2R);
  }

  function dtan(d: number) {
    return Math.tan(d * D2R);
  }

  function darcsin(x: number) {
    return R2D * Math.asin(x);
  }

  function darccos(x: number) {
    return R2D * Math.acos(x);
  }

  function darctan2(y: number, x: number) {
    return R2D * Math.atan2(y, x);
  }

  function darccot(x: number) {
    return R2D * Math.atan(1 / x);
  }

  function julianDay(y: number, m: number, d: number): number {
    if (m <= 2) {
      y -= 1;
      m += 12;
    }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return (
      Math.floor(365.25 * (y + 4716)) +
      Math.floor(30.6001 * (m + 1)) +
      d +
      B -
      1524.5
    );
  }

  function sunPosition(jd: number) {
    const D = jd - 2451545.0;
    const g = fixAngle(357.529 + 0.98560028 * D);
    const q = fixAngle(280.459 + 0.98564736 * D);
    const L = fixAngle(q + 1.915 * dsin(g) + 0.02 * dsin(2 * g));
    const e = 23.439 - 0.00000036 * D;
    const RA = darctan2(dcos(e) * dsin(L), dcos(L)) / 15.0;
    const eqt = q / 15.0 - fixAngle(RA * 15) / 15.0;
    const decl = darcsin(dsin(e) * dsin(L));
    return { decl, eqt };
  }

  function timeDiff(time: number, angle: number, decl: number) {
    const lat = latitude;
    const t =
      (1 / 15.0) *
      darccos(
        (-dsin(angle) - dsin(decl) * dsin(lat)) / (dcos(decl) * dcos(lat))
      );
    return t;
  }

  function toTimeString(hours: number): string {
    if (isNaN(hours)) return "--:--";
    hours = (hours + 24) % 24;
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60 + 0.5);
    return ("0" + h).slice(-2) + ":" + ("0" + (m % 60)).slice(-2);
  }

  // ---- Main calculation ----
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const jd = julianDay(year, month, day);
  const { decl, eqt } = sunPosition(jd);

  const noon = 12 + timezone - longitude / 15 - eqt;

  // Standard Fajr/Isha angles: 18°, Asr shadow factor = 1
  const fajr = noon - timeDiff(noon, 18, decl);
  const sunrise = noon - timeDiff(noon, 0.833, decl);
  const dhuhr = noon;
  const asr =
    noon + timeDiff(noon, -darccot(1 + dtan(Math.abs(latitude - decl))), decl);
  const maghrib = noon + timeDiff(noon, 0.833, decl);
  const isha = noon + timeDiff(noon, 18, decl);

  return {
    fajr: toTimeString(fajr),
    sunrise: toTimeString(sunrise),
    dhuhr: toTimeString(dhuhr),
    asr: toTimeString(asr),
    maghrib: toTimeString(maghrib),
    isha: toTimeString(isha),
  };
}
