import * as React from "react";

import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot='card'
      className={cn(
        // No overflow-hidden: rounded clipping fringes opaque headers on
        // subpixel (mobile) layouts. Headers/footers carry the inner radius.
        "group/card flex flex-col border-2 rounded-sm bg-card text-sm text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot='card-header'
      className={cn(
        "px-3 py-2 border-b-2 border-border bg-foreground",
        "rounded-t-[calc(var(--radius-sm)-2px)]",
        "group-[.rounded-tl-none]/card:rounded-tl-none",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot='card-title'
      className={cn(
        "font-mono text-sm leading-normal text-background",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot='card-content'
      className={cn(
        "px-3 last:rounded-b-[calc(var(--radius-sm)-2px)]",
        className,
      )}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot='card-footer'
      className={cn(
        "px-3 py-3 border-t-2 border-border rounded-b-[calc(var(--radius-sm)-2px)]",
        className,
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
