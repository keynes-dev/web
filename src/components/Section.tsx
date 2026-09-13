import type { ComponentProps } from "react";

import { GridMarks } from "@/components/GridMarks";

type SectionProps = Omit<ComponentProps<"section">, "className">;

export function Section({ children, ...props }: SectionProps) {
  return (
    <section className='border-b' {...props}>
      <div className='relative container mx-auto xl:border-x'>
        <GridMarks className='md:hidden xl:block' />
        <div className='relative container mx-auto max-w-screen-lg md:border-x'>
          <GridMarks />
          <div className='relative p-4 sm:p-8'>{children}</div>
        </div>
      </div>
    </section>
  );
}
