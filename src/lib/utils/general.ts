export function toArabicIndic(str: string) {
  const arabicIndicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return str.replace(/\d/g, (d: string) => arabicIndicDigits[+d]);
}
