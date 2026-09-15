import logoSvg from "@/assets/logo.svg?raw";

export function Logo() {
  return (
    <span
      aria-hidden
      className='text-foreground'
      dangerouslySetInnerHTML={{ __html: logoSvg }}
    />
  );
}
