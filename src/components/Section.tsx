import type { ComponentProps } from "react";

import { GridMarks } from "@/components/GridMarks";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  ...props
}: ComponentProps<"section">) {
  return (
    <section className={cn("border-b", className)} {...props}>
      <div className="relative container mx-auto border-x">
        <GridMarks />
        <div className="relative container max-w-screen-xl mx-auto border-x">
          <GridMarks />
          <div className="relative p-8">{children}</div>
        </div>
      </div>
    </section>
  );
}
