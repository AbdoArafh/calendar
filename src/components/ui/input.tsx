import type { JSX } from "preact";
import { cn } from "@/lib/utils";

type InputProps = JSX.HTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  onChange?: (text: string) => void;
  inputClassName?: string;
  placeholder?: string;
};

export function Input({
  label,
  error,
  class: className,
  id,
  onChange,
  inputClassName,
  ...props
}: InputProps) {
  const inputId = id ?? `input-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div class={cn("w-full flex flex-col gap-1.5", className)}>
      {label && (
        <label for={inputId} class="text-sm font-medium text-gray-200">
          {label}
        </label>
      )}

      <input
        id={inputId}
        class={cn(
          "w-full rounded-xl border bg-gray-900 px-3 py-2 text-sm text-gray-100 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed",
          error
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-700 hover:border-gray-600 focus:ring-blue-500",
          inputClassName
        )}
        onChange={(e) =>
          onChange && onChange((e.target as HTMLInputElement).value)
        }
        {...props}
      />

      {error && <p class="text-xs text-red-400">{error}</p>}
    </div>
  );
}
