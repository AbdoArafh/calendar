import { useEffect, useState } from "preact/hooks";
import { Page } from "./components/page";
import { Combobox } from "./components/ui/combobox";
import { XIcon } from "./components/shared/icons";
import { produce } from "./lib/utils";
import { Input } from "./components/ui/input";

type DataType = Record<string, { city: string; lat: string; lng: string }[]>;

const getID = () => Math.random();

export function App() {
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
            const [city, lat, lng] = row;
            return { city, lat, lng };
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

  return (
    <div class="min-h-screen bg-gray-900 flex justify-center">
      <div class="grid grid-cols-2 gap-8 py-16 items-start">
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
                        label: city.city,
                        value: city.city,
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
                <Input class="w-32" placeholder="Alt name..." />
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
          </div>
        </div>
        <Page />
      </div>
    </div>
  );
}
