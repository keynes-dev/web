import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AccessLinks({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      <Button asChild size="lg">
        <a href="/access">
          Get access today
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </Button>
      <Button asChild size="lg" variant="outline">
        <a href="/docs">Read docs</a>
      </Button>
    </div>
  );
}
