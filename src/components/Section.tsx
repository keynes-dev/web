import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionProps extends React.ComponentProps<"section"> {
  children: ReactNode;
  containerClassName?: string;
  className?: string;
}

export function Section({
  children,
  className,
  containerClassName,
  ...props
}: SectionProps) {
  return (
    <section className={cn("border-b", className)} {...props}>
      <div
        className={cn("container mx-auto border-x p-8", containerClassName)}
      >
        {children}
      </div>
    </section>
  );
}
