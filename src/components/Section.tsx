import type { ComponentProps } from "react";

import { GridMarks } from "@/components/GridMarks";
import { cn } from "@/lib/utils";

function Section({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      data-slot='section'
      className={cn("border-b", className)}
      {...props}
    />
  );
}

function SectionFrame({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot='section-frame'
      className={cn(
        "relative container mx-auto px-4 md:px-0 xl:border-x",
        className,
      )}
      {...props}
    >
      <GridMarks className='hidden xl:block' />
      {children}
    </div>
  );
}

function SectionColumn({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot='section-column'
      className={cn(
        "relative container mx-auto max-w-screen-lg border-x",
        className,
      )}
      {...props}
    >
      <GridMarks className='block' />
      {children}
    </div>
  );
}

function SectionContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot='section-content'
      className={cn("relative px-4 py-8 sm:px-8 sm:py-12", className)}
      {...props}
    />
  );
}

export { Section, SectionFrame, SectionColumn, SectionContent };
