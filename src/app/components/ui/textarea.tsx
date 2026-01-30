import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none flex min-h-16 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20",
        "hover:border-gray-400",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
