import { GridMarks } from "@/components/GridMarks";
import { Logo } from "@/components/Logo";

import { SiteLinks } from "./SiteLinks";

export function Footer() {
  return (
    <footer>
      <div className="relative container mx-auto flex flex-col items-start justify-between gap-6 border-x px-5 py-8 sm:px-8 md:flex-row md:items-center">
        <GridMarks />
        <div className="flex items-center gap-6">
          <a aria-label="Keynes home" href="/">
            <Logo />
          </a>
          <span className="type-small text-muted-foreground">
            © 2026 Keynes · Apache-2.0
          </span>
        </div>
        <SiteLinks />
      </div>
    </footer>
  );
}
