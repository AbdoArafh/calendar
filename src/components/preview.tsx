import { useAppContext } from "./context/app-context";
import { Page } from "./page";

export const Preview = () => {
  const { settings } = useAppContext();

  return <Page {...settings} />;
};
