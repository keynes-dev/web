import { cn } from "@/lib/utils";

const diamondClass =
  "pointer-events-none absolute z-10 size-2 rotate-45 border border-border bg-background";

const edgeClass = {
  top: {
    left: "-top-[4.5px] -left-[4.5px]",
    right: "-top-[4.5px] -right-[4.5px]",
  },
  bottom: {
    left: "-bottom-[4.5px] -left-[4.5px]",
    right: "-bottom-[4.5px] -right-[4.5px]",
  },
} as const;

export type GridMarkEdge = keyof typeof edgeClass;

export function GridMarks({
  edges = ["bottom"],
}: {
  edges?: readonly GridMarkEdge[];
}) {
  return (
    <>
      {edges.flatMap((edge) => [
        <span
          key={`${edge}-left`}
          aria-hidden="true"
          className={cn(diamondClass, edgeClass[edge].left)}
        />,
        <span
          key={`${edge}-right`}
          aria-hidden="true"
          className={cn(diamondClass, edgeClass[edge].right)}
        />,
      ])}
    </>
  );
}
