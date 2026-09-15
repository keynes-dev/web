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
  const closeRef = useRef<HTMLLabelElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
        return;
      }

      if (event.key !== "Tab" || !menuRef.current) return;

      const controls = menuRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      const first = controls[0];
      const last = controls[controls.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
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
    <header className='z-50 border-b bg-background'>
      <div className='relative container mx-auto xl:border-x'>
        <GridMarks className='md:hidden xl:block' />
        <nav className='relative container mx-auto max-w-screen-lg flex items-center justify-between gap-6 md:border-x px-4 py-3 sm:px-8'>
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
                className='absolute inset-0 z-10 size-full cursor-pointer appearance-none'
                defaultChecked={false}
                aria-controls='mobile-navigation'
                aria-expanded={open}
                aria-label='Open navigation'
                onChange={(event) => setOpen(event.target.checked)}
              />
              <Menu
                className='pointer-events-none size-5'
                aria-hidden='true'
              />
            </label>
          </div>
        </nav>
      </div>

      <div
        ref={menuRef}
        id='mobile-navigation'
        role='dialog'
        aria-label='Navigation'
        aria-modal='true'
        aria-hidden={!open}
        inert={!open}
        className={cn(
          "fixed inset-0 z-50 flex translate-x-full flex-col bg-background transition-transform duration-300 ease-out motion-reduce:transition-none md:hidden",
          open ? "translate-x-0" : "pointer-events-none",
        )}
      >
        <div className='flex items-center justify-between border-b px-4 py-3 sm:px-8'>
          <a aria-label='Keynes home' href='/' onClick={closeMenu}>
            <Logo />
          </a>
          <label
            ref={closeRef}
            htmlFor='mobile-navigation-toggle'
            role='button'
            tabIndex={0}
            className='inline-flex size-8 cursor-pointer items-center justify-center'
            aria-label='Close navigation'
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              closeMenu();
            }}
          >
            <X
              className='pointer-events-none size-5'
              aria-hidden='true'
            />
          </label>
        </div>

        <nav className='flex flex-1 flex-col justify-between px-4 py-8 sm:px-8'>
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
