import {
  getDate,
  getDayName,
  getHijriDate,
  getMonthName,
  toArabicIndic,
} from "../lib/utils";

export type PageProps = {
  date?: Date;
};

export function Page({ date = new Date() }: PageProps) {
  const meladi = getDate(date);
  const higri = getHijriDate(date);

  const header = (
    <div class="flex items-center justify-center">
      <div class="px-4 py-4 bg-secondary text-5xl text-white text-center rounded-l-2xl w-[190px]">
        {toArabicIndic(meladi.year)}
      </div>
      <div class="flex flex-col items-center justify-center gap-2 size-32 border border-secondary rounded-2xl shadow-lg">
        {/* <span className="text-3xl">{data.day_name}</span> */}
        <span class="text-4xl text-primary">{toArabicIndic(meladi.day)}</span>
        <span class="text-xl text-primary font-light">
          {getMonthName(meladi.month)}
        </span>
      </div>
      <div class="px-4 py-4 bg-secondary text-5xl text-white text-center rounded-r-2xl w-[190px]">
        {toArabicIndic(higri.year)}
      </div>
    </div>
  );

  const dayName = (
    <div class="flex items-center gap-4">
      <div class="grow h-px bg-primary" />
      <div class="text-4xl font-light">{getDayName(date)}</div>
      <div class="grow h-px bg-primary" />
    </div>
  );

  return (
    <div class="flex flex-col gap-8 max-w-lg mx-auto bg-background text-foreground p-4">
      {header}

      {dayName}

      <div class="flex flex-col gap-1 text-xl font-light">
        <div class="grid grid-cols-6 bg-secondary text-white text-center py-3 rounded-lg shadow-lg">
          {["المدينة", "الفجر", "الظهر", "العصر", "المغرب", "العشاء"]
            .reverse()
            .map((cell) => (
              <div class="text-center">{cell}</div>
            ))}
        </div>

        {Array.from(Array(5)).map((_, i) => (
          <div
            class={`grid grid-cols-6 text-center py-3 rounded-lg ${
              i % 2 === 0 ? "bg-white" : "bg-gray-200"
            }`}
          >
            {["القاهرة", "04:30", "12:15", "15:45", "18:30", "19:45"]

              .reverse()
              .map((cell) => (
                <div class="text-center">{toArabicIndic(cell)}</div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const data = {
  year_meladi: "2021 م",
  year_hegri: "1442 هـ",
  day_meladi: "14",
  day_hegri: "4",
  month_meladi: "يوليو",
  month_hegri: "جمادى أول",
  day_name: "الأربعاء",
};
