import { SectionHeader } from "@/components/SectionHeader";
import { Section } from "@/components/Section";
import { AccessLinks } from "./AccessLinks";

export function ClosingCta() {
  return (
    <Section containerClassName="flex flex-col items-center gap-8 py-24 text-center">
      <SectionHeader title="Put your agents on a Budget">
        Apache-2.0 open core. One TypeScript SDK. Start locally with zero setup
        — no account, no keys, no network.
      </SectionHeader>
      <AccessLinks className="justify-center" />
    </Section>
  );
}
