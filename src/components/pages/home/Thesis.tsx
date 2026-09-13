import { Section } from "@/components/Section";
import { Button } from "@/components/ui/button";

export function Thesis() {
  return (
    <Section>
      <div className="flex flex-col items-center gap-8">
        <header className="relative max-w-3xl space-y-4 text-center">
          <h2>Observability is a two-way road</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Traditional observability tells your business what your agents did{" "}
            <em className="text-foreground underline underline-offset-4">
              after
            </em>{" "}
            they did it. Keynes gives your agents live business context{" "}
            <em className="text-foreground underline underline-offset-4">
              before
            </em>{" "}
            they act and lets you define how they should respond in advance.
          </p>
        </header>
        <Button asChild size="lg" variant="outline">
          <a href="/thesis">Read our thesis</a>
        </Button>
      </div>
    </Section>
  );
}
