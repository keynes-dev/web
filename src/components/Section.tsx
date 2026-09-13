import type { ComponentProps } from "react";

import { GridMarks } from "@/components/GridMarks";

type SectionProps = Omit<ComponentProps<"section">, "className">;

export function Section({ children, ...props }: SectionProps) {
  return (
    <section className='border-b' {...props}>
      <div className='relative container mx-auto border-x'>
        <GridMarks />
        <div className='relative container mx-auto max-w-screen-xl border-x'>
          <GridMarks />
          <div className='relative p-5 sm:p-8'>{children}</div>
        </div>
      </div>
    </section>
  );
}
