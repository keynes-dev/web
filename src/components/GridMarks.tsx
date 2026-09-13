const diamondClass =
  "pointer-events-none absolute z-10 size-2 rotate-45 border border-border bg-background -bottom-[4.5px]";

export function GridMarks() {
  return (
    <>
      <span aria-hidden="true" className={`${diamondClass} -left-[4.5px]`} />
      <span aria-hidden="true" className={`${diamondClass} -right-[4.5px]`} />
    </>
  );
}
