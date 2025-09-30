export function getHijriDate(day?: Date): {
  day: number;
  month: number;
  year: number;
} {
  const date = day ?? new Date();

  const parts = new Intl.DateTimeFormat("en-u-ca-islamic", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(date);

  const hijri: { day: number; month: number; year: number } = {
    day: 0,
    month: 0,
    year: 0,
  };

  for (const part of parts) {
    if (part.type === "day") hijri.day = parseInt(part.value, 10);
    if (part.type === "month") hijri.month = parseInt(part.value, 10);
    if (part.type === "year") hijri.year = parseInt(part.value, 10);
  }

  return hijri;
}

export function getHijriMonthName(
  monthNumber: number,
  language: "en" | "ar" = "ar"
): string {
  const months: Record<"en" | "ar", string[]> = {
    en: [
      "Muharram",
      "Safar",
      "Rabiʿ al-Awwal",
      "Rabiʿ al-Thani",
      "Jumada al-Awwal",
      "Jumada al-Thani",
      "Rajab",
      "Shaʿban",
      "Ramadan",
      "Shawwal",
      "Dhu al-Qaʿdah",
      "Dhu al-Hijjah",
    ],
    ar: [
      "محرّم",
      "صفر",
      "ربيع الأوّل",
      "ربيع الآخر",
      "جمادى الأولى",
      "جمادى الآخرة",
      "رجب",
      "شعبان",
      "رمضان",
      "شوّال",
      "ذو القعدة",
      "ذو الحجة",
    ],
  };

  if (monthNumber < 1 || monthNumber > 12) {
    throw new Error("Month number must be between 1 and 12.");
  }

  return months[language][monthNumber - 1];
}

export function getDate(day?: Date): {
  day: number;
  month: number;
  year: number;
} {
  const date = day ?? new Date();

  return {
    day: date.getDate(),
    month: date.getMonth() + 1, // JS months are 0–11
    year: date.getFullYear(),
  };
}

// Get regular (Gregorian) month name
export function getMonthName(
  monthNumber: number,
  language: "en" | "ar" = "ar"
): string {
  const months: Record<"en" | "ar", string[]> = {
    en: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    ar: [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ],
  };

  if (monthNumber < 1 || monthNumber > 12) {
    throw new Error("Month number must be between 1 and 12.");
  }

  return months[language][monthNumber - 1];
}

// Get weekday name
export function getDayName(day?: Date, language: "en" | "ar" = "ar"): string {
  const date = day ?? new Date();

  const days: Record<"en" | "ar", string[]> = {
    en: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    ar: [
      "الأحد",
      "الإثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ],
  };

  return days[language][date.getDay()];
}
