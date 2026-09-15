import { cn } from "@/lib/utils";

/**
 * Corner diamonds on rail crossings.
 *
 * Absolute edges are the padding box (inner side of a 1px border). The border
 * center is 0.5px outside that edge; subtract half of size-2 (0.25rem) so the
 * mark’s center bisects the stroke.
 */
export function GridMarks({
  className,
  position = "bottom",
}: {
  className?: string;
  position?: "top" | "bottom";
}) {
  const positionClassName =
    position === "top" ?
      "top-[calc(-0.5px-0.25rem)]"
    : "bottom-[calc(-0.5px-0.25rem)]";

  return (
    <>
      <span
        aria-hidden='true'
        className={cn(
          "pointer-events-none absolute left-[calc(-0.5px-0.25rem)] z-10 size-2 rotate-45 border bg-background",
          positionClassName,
          className,
        )}
      />
      <span
        aria-hidden='true'
        className={cn(
          "pointer-events-none absolute right-[calc(-0.5px-0.25rem)] z-10 size-2 rotate-45 border bg-background",
          positionClassName,
          className,
        )}
      />
    </>
  );
}
