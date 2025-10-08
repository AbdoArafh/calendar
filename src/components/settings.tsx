import { useEffect, useState } from "preact/hooks";
import { Combobox } from "./ui/combobox";
import { XIcon } from "./shared/icons";
import { exportNodesToPDF, produce } from "../lib/utils";
import { Input } from "./ui/input";
import type { City } from "../lib/types";
import { Button } from "./ui/button";
import { useAppContext } from "./context/app-context";
import { render } from "preact";
import { Page } from "./page";

type DataType = Record<string, City[]>;

const getID = () => Math.random();

export const Settings = () => {
  const { settings, setSettings } = useAppContext();

  const [data, setData] = useState<DataType | null>(null);

  useEffect(() => {
    fetch("/assets/cities.csv").then(async (res) => {
      let text = await res.text();
      text = text.replaceAll(", ", "<>");
      const rows = text
        .split("\n")
        .map((row) =>
          row
            .split(",")
            .map((cell) => cell.replaceAll("<>", ", ").replaceAll('"', ""))
        )
        .slice(1);

      const countries = Array.from(new Set(rows.map((row) => row[3])));

      const data: DataType = {};

      countries.forEach((country) => {
        data[country] = rows
          .filter((row) => row[3] === country)
          .map((row) => {
            const [name, lat, lng] = row;
            return { name, lat, lng };
          });
      });

      setData(data);
    });
  }, []);

  if (!data) return null;

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCities, setSelectedCities] = useState<
    {
      name?: string;
      alt?: string;
      id: number;
    }[]
  >([{ id: getID() }]);

  const countries = Object.keys(data).map((country) => ({
    label: country,
    value: country,
  }));

  const handleRemoveCity = (id: number) => {
    setSelectedCities(
      produce(selectedCities, (draft) => draft.filter((c) => c.id !== id))
    );
  };

  useEffect(() => {
    const cities = selectedCities
      .filter((city) => city.name)
      .map((city) => ({
        name: city.alt ?? city.name!,
        lat: data[selectedCountry]?.find((c) => c.name === city.name)?.lat!,
        lng: data[selectedCountry]?.find((c) => c.name === city.name)?.lng!,
      }));

    setSettings({
      cities,
    });
  }, [data, selectedCities]);

  const exportCalendarDays = async (days: Date[]) => {
    const container = document.querySelector("#off-screen")!;

    render(
      days.map((day) => <Page date={day} cities={settings.cities} />),
      container
    );

    await exportNodesToPDF(Array.from(container.children) as HTMLElement[]);

    render(null, container);
  };

  return (
    <div class="bg-white/5 rounded-xl shadow-xl inset-shadow-2xs h-[600px] text-white font-mono p-4 whitespace-pre">
      <div class="flex flex-col gap-2">
        <Combobox
          options={countries}
          value={selectedCountry}
          onChange={(country) => {
            setSelectedCountry(country);
            setSelectedCities([{ id: getID() }]);
          }}
          placeholder="Pick a country..."
        />
        {selectedCities.map((selectedCity, i) => (
          <div
            // key={selectedCity.id}
            class="relative flex items-center w-full gap-2"
          >
            <Combobox
              class="flex-grow"
              options={
                data[selectedCountry]
                  ?.map((city) => ({
                    label: city.name,
                    value: city.name,
                  }))
                  .filter(
                    (city) =>
                      selectedCities.findIndex(
                        (c) => c?.name === city.value
                      ) === -1
                  ) ?? []
              }
              value={selectedCity?.name}
              onChange={(city) => {
                const newSelectedCities = [...selectedCities];
                newSelectedCities[i] = {
                  name: city,
                  alt: newSelectedCities[i]?.alt,
                  id: getID(),
                };
                if (i === selectedCities.length - 1) {
                  newSelectedCities.push({ id: getID() });
                }
                setSelectedCities(newSelectedCities);
              }}
              placeholder="Pick a city..."
              disabled={!selectedCountry}
            />
            <Input
              class="w-32"
              placeholder="Alt name..."
              value={selectedCity.alt}
              onChange={(value) => {
                const newSelectedCities = produce(selectedCities, (draft) => {
                  draft[i].alt = value;
                });
                setSelectedCities(newSelectedCities);
              }}
            />
            {i > 0 && i !== selectedCities.length - 1 && (
              <button
                class="cursor-pointer rounded-sm hover:bg-white/5 p-1 shrink-0"
                onClick={() => handleRemoveCity(selectedCity.id)}
              >
                <XIcon />
              </button>
            )}
          </div>
        ))}

        <Button
          onClick={() => {
            // const days: Date[] = Array.from({ length: 4 }, (_, i) => {
            //   const d = new Date();
            //   d.setDate(d.getDate() + i);
            //   return d;
            // });

            exportCalendarDays([new Date()]);
          }}
        >
          Print
        </Button>
      </div>
    </div>
  );
};
