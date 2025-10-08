import { Preview } from "./components/preview";
import { Settings } from "./components/settings";

export function App() {
  return (
    <div class="min-h-screen bg-gray-900 flex justify-center overflow-hidden">
      {/* Off-screen element */}
      <div class="absolute -left-[9999px] top-0" id="off-screen" />
      <div class="grid grid-cols-2 gap-8 py-16 items-start">
        <Settings />
        <Preview />
      </div>
    </div>
  );
}
