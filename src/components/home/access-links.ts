import { routes } from "@/components/site/routes";

export const accessLinks = [
  { href: routes.signup, label: "Sign up", variant: "default" },
  { href: routes.docs, label: "Read docs", variant: "outline" },
] as const;
