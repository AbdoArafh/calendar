import { toArabicIndic } from "./lib/utils";

export function App() {
  const header = (
    <div class="flex items-center justify-center">
      <div class="px-4 py-4 bg-secondary text-5xl text-white text-center rounded-l-2xl w-[190px]">
        {toArabicIndic(data.year_meladi)}
      </div>
      <div class="flex flex-col items-center justify-center gap-2 size-32 border border-secondary rounded-2xl shadow-lg">
        {/* <span className="text-3xl">{data.day_name}</span> */}
        <span class="text-4xl text-primary">
          {toArabicIndic(data.day_meladi)}
        </span>
        <span class="text-xl text-primary font-light">{data.month_meladi}</span>
      </div>
      <div class="px-4 py-4 bg-secondary text-5xl text-white text-center rounded-r-2xl w-[190px]">
        {toArabicIndic(data.year_hegri)}
      </div>
    </div>
  );

  return (
    <div class="min-h-screen bg-gray-900">
      <div class="max-w-lg mx-auto bg-background text-foreground p-4">
        {header}

        <div class="flex items-center gap-4 mt-8">
          <div class="grow h-px bg-primary" />
          <div class="text-4xl font-light">{data.day_name}</div>
          <div class="grow h-px bg-primary" />
        </div>

        <div class="flex flex-col gap-1 mt-8 text-xl font-light">
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
