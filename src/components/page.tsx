import type { City } from "@/lib/types";
import {
  cn,
  getDate,
  getDayName,
  getHijriDate,
  getMonthName,
  toArabicIndic,
} from "../lib/utils";
import PrayTimes from "@/lib/utils/praytimes";

export type PageProps = {
  date?: Date;
  cities: City[];
};

const prayTimes = new PrayTimes("Egypt");

export function Page({ date = new Date(), cities }: PageProps) {
  const meladi = getDate(date);
  const higri = getHijriDate(date);

  const prayerTimes = cities.map((city) => ({
    ...prayTimes.getTimes(date, [+city.lat, +city.lng]),
    cityName: city.name,
  }));

  const header = (
    <div class="flex items-center justify-center">
      <div class="px-4 py-4 bg-secondary text-5xl text-white text-center rounded-l-2xl w-[190px]">
        {toArabicIndic(meladi.year) + " م"}
      </div>
      <div class="flex flex-col items-center justify-center gap-2 size-32 border border-secondary rounded-2xl shadow-lg">
        {/* <span className="text-3xl">{data.day_name}</span> */}
        <span class="text-4xl text-primary">{toArabicIndic(meladi.day)}</span>
        <span class="text-xl text-primary font-light">
          {getMonthName(meladi.month)}
        </span>
      </div>
      <div class="px-4 py-4 bg-secondary text-5xl text-white text-center rounded-r-2xl w-[210px]">
        {toArabicIndic(higri.year) + " هـ"}
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
    <div
      class="flex flex-col gap-8 max-w-lg mx-auto bg-background text-foreground p-4"
      id="page"
    >
      {header}

      {dayName}

      <div class="flex flex-col gap-1 text-xl font-light">
        <div class="grid grid-cols-[repeat(5,1fr)_1.5fr] bg-secondary text-white py-3 rounded-lg shadow-lg">
          {["المدينة", "الفجر", "الظهر", "العصر", "المغرب", "العشاء"]
            .reverse()
            .map((cell) => (
              <div class="text-center">{cell}</div>
            ))}
        </div>

        {prayerTimes.map((time, i) => (
          <div
            class={cn(
              "grid grid-cols-[repeat(5,1fr)_1.5fr] py-3 rounded-lg",
              i % 2 === 0 ? "bg-white" : "bg-gray-200"
            )}
          >
            {[
              time.cityName,
              time.fajr,
              time.dhuhr,
              time.asr,
              time.maghrib,
              time.isha,
            ]

              .reverse()
              .map((cell) => (
                <div class="text-center">
                  {toArabicIndic(cell).replace("am", "ص").replace("pm", "م")}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
