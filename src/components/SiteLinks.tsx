import { cn } from "@/lib/utils";

const links = [
  { label: "Thesis", href: "/thesis" },
  { label: "Product", href: "/product" },
  { label: "Docs", href: "/docs" },
  { label: "Pricing", href: "/pricing" },
];

export function SiteLinks({ className }: { className?: string }) {
  return (
    <ul
      className={cn("flex flex-wrap items-center gap-x-6 gap-y-2", className)}
    >
      {links.map(({ label, href }) => (
        <li key={href}>
          <a
            className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            href={href}
          >
            {label}
          </a>
        </li>
      ))}
    </ul>
  );
}
