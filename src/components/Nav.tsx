import { GridMarks } from "@/components/GridMarks";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { SiteLinks } from "./SiteLinks";

export function Nav() {
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
          <Button variant='link' asChild size='sm'>
            <a href='/access'>Get access</a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
