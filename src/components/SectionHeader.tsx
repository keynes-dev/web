import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("type-section", className)} {...props} />;
}

export function SectionHeader({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <header className="space-y-4">
      <SectionTitle>{title}</SectionTitle>
      <p className="type-body max-w-3xl text-muted-foreground">{children}</p>
    </header>
  );
}
