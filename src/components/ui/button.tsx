// Button.tsx
import type { JSX } from "preact";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "default",
  size = "md",
  class: className,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants: Record<Variant, string> = {
    default:
      "bg-gray-800 text-gray-100 hover:bg-gray-700 border border-gray-700 shadow-sm focus-visible:ring-blue-500",
    outline:
      "border border-gray-700 text-gray-200 hover:bg-gray-800 shadow-sm focus-visible:ring-blue-500",
    ghost:
      "text-gray-400 hover:text-gray-200 hover:bg-gray-800 focus-visible:ring-blue-500",
    destructive:
      "bg-red-600 text-white hover:bg-red-500 border border-red-700 shadow-sm focus-visible:ring-red-500",
  };

  const sizes: Record<Size, string> = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button
      class={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
