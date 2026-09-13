export function GridMarks() {
  return (
    <>
      <span
        aria-hidden='true'
        className='pointer-events-none absolute -bottom-1 -left-1 z-10 size-2 rotate-45 border border-grid bg-background'
      />
      <span
        aria-hidden='true'
        className='pointer-events-none absolute -right-1 -bottom-1 z-10 size-2 rotate-45 border border-grid bg-background'
      />
    </>
  );
}
