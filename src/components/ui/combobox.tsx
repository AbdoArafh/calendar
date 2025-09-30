import { useState, useRef, useEffect } from "preact/hooks";
import type { JSX } from "preact";
import { cn } from "@/lib/utils";

export interface Option {
  label: string;
  value: string;
}

interface ComboboxProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "onChange"> {
  options: Option[];
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  placeholder = "Select an option...",
  onChange,
  className = "",
  disabled,
  ...props
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Option | null>(
    options.find((o) => o.value === value) ?? null
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!value) {
      setSelected(null);
    }
  }, [value]);

  function handleSelect(option: Option) {
    setSelected(option);
    setQuery("");
    setOpen(false);
    onChange?.(option.value);
  }

  return (
    <div
      ref={containerRef}
      class={cn(
        "relative",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    >
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        class="w-full flex items-center justify-between rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {selected ? (
          selected.label
        ) : (
          <span class="text-gray-500">{placeholder}</span>
        )}
        <svg
          class={`h-4 w-4 ml-2 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div class="absolute z-10 mt-2 w-full rounded-xl border border-gray-700 bg-gray-900 shadow-lg">
          <input
            type="text"
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            placeholder="Search..."
            class="w-full rounded-t-xl bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none"
          />
          <ul class="max-h-48 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((option) => (
                <li
                  onClick={() => handleSelect(option)}
                  class={`cursor-pointer px-3 py-2 text-sm ${
                    selected?.value === option.value
                      ? "bg-blue-600 text-white"
                      : "text-gray-200 hover:bg-gray-800"
                  }`}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li class="px-3 py-2 text-sm text-gray-500">No results found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
