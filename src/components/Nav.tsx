import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { GridMarks } from "@/components/GridMarks";
import { Logo } from "@/components/Logo";
import {
  SectionColumn,
  SectionContent,
  SectionFrame,
} from "@/components/Section";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { SiteLinks, siteLinks } from "./SiteLinks";

export function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function closeAtDesktop(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false);
    }

    const desktop = window.matchMedia("(min-width: 48rem)");
    desktop.addEventListener("change", closeAtDesktop);
    return () => desktop.removeEventListener("change", closeAtDesktop);
  }, [open]);

  return (
    <header className='sticky top-0 z-[60] border-y bg-background'>
      <Drawer open={open} onOpenChange={setOpen} swipeDirection='up'>
        <SectionFrame className='bg-background'>
          <GridMarks position='top' className='max-xl:hidden' />
          <SectionColumn className='flex h-16 items-center justify-between gap-6 bg-background px-4 sm:px-8'>
            <GridMarks position='top' />
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
              <DrawerTrigger
                className='relative inline-flex size-8 items-center justify-center md:hidden'
                aria-label={open ? "Close navigation" : "Open navigation"}
              >
                <Menu
                  className={cn(
                    "absolute size-5 transition-all duration-200 motion-reduce:transition-none",
                    open ?
                      "rotate-90 scale-0 opacity-0"
                    : "rotate-0 scale-100 opacity-100",
                  )}
                  aria-hidden='true'
                />
                <X
                  className={cn(
                    "absolute size-5 transition-all duration-200 motion-reduce:transition-none",
                    open ?
                      "rotate-0 scale-100 opacity-100"
                    : "-rotate-90 scale-0 opacity-0",
                  )}
                  aria-hidden='true'
                />
              </DrawerTrigger>
            </div>
          </SectionColumn>
        </SectionFrame>

        <DrawerContent
          className={cn(
            "rounded-none border-0 bg-orange-100 text-foreground",
            "h-dvh max-h-dvh [--drawer-bleed-background:var(--color-orange-100)]",
            "data-[swipe-direction=up]:rounded-none",
          )}
        >
          <DrawerTitle className='sr-only'>Site navigation</DrawerTitle>
          <DrawerDescription className='sr-only'>
            Links to thesis, product, docs, pricing, and access.
          </DrawerDescription>
          <SectionFrame className='flex min-h-0 flex-1 flex-col pt-16'>
            <SectionColumn className='flex min-h-0 flex-1 flex-col'>
              <SectionContent className='flex min-h-0 flex-1 flex-col'>
                <nav
                  className='flex min-h-0 flex-1 flex-col justify-between overflow-y-auto'
                  aria-label='Mobile navigation'
                >
                  <ul className='space-y-3'>
                    {siteLinks.map(({ label, href }) => (
                      <li key={href}>
                        <DrawerClose
                          render={
                            <a
                              className='block py-2 font-heading text-3xl font-medium tracking-tight'
                              href={href}
                            />
                          }
                        >
                          {label}
                        </DrawerClose>
                      </li>
                    ))}
                  </ul>
                  <Button asChild size='lg'>
                    <DrawerClose render={<a href='/access' />}>
                      Get access
                    </DrawerClose>
                  </Button>
                </nav>
              </SectionContent>
            </SectionColumn>
          </SectionFrame>
        </DrawerContent>
      </Drawer>
    </header>
  );
}
