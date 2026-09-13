import { GridMarks } from "@/components/GridMarks";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { SiteLinks } from "./SiteLinks";

export function Nav() {
  return (
    <header className='sticky top-0 z-50 border-b border-grid bg-background'>
      <div className='relative container mx-auto border-x border-grid'>
        <GridMarks />
        <nav className='relative container mx-auto max-w-screen-xl flex items-center justify-between gap-6 border-x border-grid px-4 py-3 sm:px-8'>
          <GridMarks />
          <div className='flex items-center gap-8'>
            <a aria-label='Keynes home' href='/'>
              <Logo />
            </a>
            <SiteLinks className='hidden md:flex' />
          </div>
          <Button variant='link' asChild size='sm'>
            <a href='/access'>Get access</a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
