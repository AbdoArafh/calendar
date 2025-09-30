export function toArabicIndic(input: string | number) {
  const arabicIndicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return input.toString().replace(/\d/g, (d: string) => arabicIndicDigits[+d]);
}

export function produce<T extends object>(
  baseState: T,
  recipe: (state: T) => void
) {
  const draft = JSON.parse(JSON.stringify(baseState));

  recipe(draft);

  return draft;
}
