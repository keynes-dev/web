import type { ComponentProps } from "react";

import { GridMarks } from "@/components/GridMarks";

type SectionProps = Omit<ComponentProps<"section">, "className">;

export function Section({ children, ...props }: SectionProps) {
  return (
    <section className='border-b border-grid' {...props}>
      <div className='relative container mx-auto border-x border-grid'>
        <GridMarks />
        <div className='relative container mx-auto max-w-screen-xl border-x border-grid'>
          <GridMarks />
          <div className='relative p-5 sm:p-8'>{children}</div>
        </div>
      </div>
    </section>
  );
}
