import * as React from "react";
import { cn } from "@/utils/cn";

export function Avatar({
  src,
  alt,
  children,
  className,
}: {
  src?: string;
  alt?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  // when we have an actual image
  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? ""}
        className={cn(
          "h-10 w-10 rounded-md object-cover", // <- changed rounded-full → rounded-md
          className
        )}
      />
    );
  }

  // fallback (initials)
  return (
    <div
      role="img"
      aria-label={alt ?? "User avatar"}
      className={cn(
        "h-10 w-10 rounded-md bg-gray-700 text-gray-100 flex items-center justify-center font-semibold", // <- changed rounded-full → rounded-md
        className
      )}
    >
      {children}
    </div>
  );
}
