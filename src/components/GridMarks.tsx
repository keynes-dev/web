import { cn } from "@/lib/utils";

export function GridMarks({ className }: { className?: string }) {
  return (
    <>
      <span
        aria-hidden='true'
        className={cn(
          "pointer-events-none absolute -bottom-1 -left-1 z-10 size-2 rotate-45 border bg-background hidden md:block",
          className,
        )}
      />
      <span
        aria-hidden='true'
        className={cn(
          "pointer-events-none absolute -right-1 -bottom-1 z-10 size-2 rotate-45 border bg-background hidden md:block",
          className,
        )}
      />
    </>
  );
}
