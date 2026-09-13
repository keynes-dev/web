import type { ComponentProps } from "react";

import { GridMarks } from "@/components/GridMarks";
import { cn } from "@/lib/utils";

type SectionProps = ComponentProps<"section"> & { containerClassName?: string };

export function Section({
  children,
  className,
  containerClassName,
  ...props
}: SectionProps) {
  return (
    <section className={cn("border-b", className)} {...props}>
      <div className="relative container mx-auto border-x">
        <GridMarks />
        <div className="relative container max-w-screen-xl mx-auto border-x">
          <GridMarks />
          <div className={cn("p-8", containerClassName)}>{children}</div>
        </div>
      </div>
    </section>
  );
}
