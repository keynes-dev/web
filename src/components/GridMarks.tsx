import { cn } from "@/lib/utils";

export function GridMarks({
  className,
  position = "bottom",
}: {
  className?: string;
  position?: "top" | "bottom";
}) {
  const positionClassName =
    position === "top" ? "-top-1" : "-bottom-1";

  return (
    <>
      <span
        aria-hidden='true'
        className={cn(
          "pointer-events-none absolute -left-1 z-10 size-2 rotate-45 border bg-background hidden md:block",
          positionClassName,
          className,
        )}
      />
      <span
        aria-hidden='true'
        className={cn(
          "pointer-events-none absolute -right-1 z-10 size-2 rotate-45 border bg-background hidden md:block",
          positionClassName,
          className,
        )}
      />
    </>
  );
}
