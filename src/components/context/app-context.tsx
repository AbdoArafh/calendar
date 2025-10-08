import { createContext } from "preact";
import { useContext, useState } from "preact/hooks";

export type City = {
  name: string;
  lat: string;
  lng: string;
};

export type PageProps = {
  date?: Date;
  cities: City[];
};

export type AppContextType = {
  settings: PageProps;
  setSettings: (value: Partial<PageProps>) => void;
};

// Default value (empty preview)
const defaultValue: AppContextType = {
  settings: { cities: [] },
  setSettings: () => {},
};

export const AppContext = createContext<AppContextType>(defaultValue);

// Custom hook
export function useAppContext() {
  return useContext(AppContext);
}

// Provider component
export function AppProvider(props: { children: preact.ComponentChildren }) {
  const [settings, setState] = useState<AppContextType["settings"]>({
    cities: [],
  });

  const setSettings: AppContextType["setSettings"] = (state) => {
    setState((prev) => ({ ...prev, ...state }));
  };

  return (
    <AppContext.Provider value={{ settings, setSettings }}>
      {props.children}
    </AppContext.Provider>
  );
}
