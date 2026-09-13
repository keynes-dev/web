import { SectionHeader } from "@/components/SectionHeader";
import { Section } from "@/components/Section";
import { Button } from "@/components/ui/button";

export function Thesis() {
  return (
    <Section containerClassName="flex flex-col items-center gap-6 py-20 text-center">
      <SectionHeader title="Observability is a two-way road">
        Traditional observability tells your business what your agents did{" "}
        <em className="text-foreground underline underline-offset-4">after</em>{" "}
        they did it. Keynes gives your agents live business context{" "}
        <em className="text-foreground underline underline-offset-4">before</em>{" "}
        they act and lets you define how they should respond in advance.
      </SectionHeader>
      <Button asChild size="lg" variant="outline">
        <a href="/thesis">Read our thesis</a>
      </Button>
    </Section>
  );
}
