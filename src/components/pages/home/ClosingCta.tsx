import { ArrowRight } from "lucide-react";

import { Section } from "@/components/Section";
import { Button } from "@/components/ui/button";

export function ClosingCta() {
  return (
    <Section containerClassName="flex flex-col items-center gap-8 py-24 text-center">
      <h2 className="font-heading text-section text-balance">
        Put your agents on a Budget
      </h2>
      <p className="max-w-2xl text-muted-foreground">
        Apache-2.0 open core. One TypeScript SDK. Start locally with zero setup
        — no account, no keys, no network.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <a href="/access">
            Get access today
            <ArrowRight data-icon="inline-end" />
          </a>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href="/docs">Read docs</a>
        </Button>
      </div>
    </Section>
  );
}
