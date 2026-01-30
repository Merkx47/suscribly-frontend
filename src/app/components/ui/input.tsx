import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-1 text-base text-gray-900 placeholder:text-gray-400 transition-colors outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20",
        "hover:border-gray-400",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
