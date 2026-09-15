import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { GridMarks } from "@/components/GridMarks";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SiteLinks, siteLinks } from "./SiteLinks";

export function Nav() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLInputElement>(null);

  function closeMenu() {
    if (triggerRef.current) triggerRef.current.checked = false;
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    function closeAtDesktop(event: MediaQueryListEvent) {
      if (event.matches) closeMenu();
    }

    const desktop = window.matchMedia("(min-width: 48rem)");
    document.addEventListener("keydown", handleKeyDown);
    desktop.addEventListener("change", closeAtDesktop);

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      desktop.removeEventListener("change", closeAtDesktop);
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <header className='relative z-50 bg-background'>
      <div className='relative z-50 container mx-auto border-b bg-background xl:border-x'>
        <GridMarks className='md:hidden xl:block' />
        <nav className='relative container mx-auto flex h-16 max-w-screen-lg items-center justify-between gap-6 px-4 md:border-x sm:px-8'>
          <GridMarks />
          <div className='flex items-center gap-8'>
            <a aria-label='Keynes home' href='/'>
              <Logo />
            </a>
            <SiteLinks className='hidden md:flex' />
          </div>
          <div className='flex items-center'>
            <Button variant='link' asChild size='sm'>
              <a href='/access'>Get access</a>
            </Button>
            <label className='relative inline-flex size-8 items-center justify-center md:hidden'>
              <input
                ref={triggerRef}
                id='mobile-navigation-toggle'
                type='checkbox'
                className='peer absolute inset-0 z-10 size-full cursor-pointer appearance-none'
                defaultChecked={false}
                aria-controls='mobile-navigation'
                aria-expanded={open}
                aria-label='Open navigation'
                onChange={(event) => setOpen(event.target.checked)}
              />
              <Menu
                className='pointer-events-none absolute size-5 transition-all duration-200 peer-checked:rotate-90 peer-checked:scale-0 peer-checked:opacity-0 motion-reduce:transition-none'
                aria-hidden='true'
              />
              <X
                className='pointer-events-none absolute size-5 -rotate-90 scale-0 opacity-0 transition-all duration-200 peer-checked:rotate-0 peer-checked:scale-100 peer-checked:opacity-100 motion-reduce:transition-none'
                aria-hidden='true'
              />
            </label>
          </div>
        </nav>
      </div>

      <div
        id='mobile-navigation'
        aria-hidden={!open}
        inert={!open}
        className={cn(
          "fixed inset-x-0 top-16 bottom-0 z-40 translate-x-full bg-orange-100 transition-transform duration-300 ease-out motion-reduce:transition-none md:hidden",
          open ? "translate-x-0" : "pointer-events-none",
        )}
      >
        <nav
          className='flex h-full flex-col justify-between px-4 py-8 sm:px-8'
          aria-label='Mobile navigation'
        >
          <ul className='space-y-3'>
            {siteLinks.map(({ label, href }) => (
              <li key={href}>
                <a
                  className='block py-2 font-heading text-3xl font-medium tracking-tight'
                  href={href}
                  onClick={closeMenu}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <Button asChild size='lg'>
            <a href='/access' onClick={closeMenu}>
              Get access
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
