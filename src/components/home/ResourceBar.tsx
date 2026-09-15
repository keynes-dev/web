const texture = {
  available:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='14'%3E%3Ctext x='0' y='12' fill='white' font-family='monospace' font-size='14'%3E%E2%96%93%3C/text%3E%3C/svg%3E\")",
  reserved:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='14'%3E%3Ctext x='0' y='12' fill='white' fill-opacity='.55' font-family='monospace' font-size='14'%3E%E2%96%92%3C/text%3E%3C/svg%3E\")",
  used: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='14'%3E%3Ctext x='0' y='12' fill='white' fill-opacity='.3' font-family='monospace' font-size='14'%3E%E2%96%91%3C/text%3E%3C/svg%3E\")",
} as const;

type ResourceTexture = keyof typeof texture;

export function ResourceSwatch({ kind }: { kind: ResourceTexture }) {
  return (
    <span
      aria-hidden='true'
      className='inline-flex h-3 w-4 shrink-0 overflow-hidden border border-foreground'
    >
      <i
        className='min-w-0 flex-1 bg-foreground mask-center mask-repeat-x not-italic'
        style={{ maskImage: texture[kind] }}
      />
    </span>
  );
}

export function ResourceBar({
  available,
  reserved,
  used,
  label,
}: {
  available: number;
  reserved: number;
  used: number;
  label: string;
}) {
  return (
    <div
      className='flex h-3 overflow-hidden border border-foreground'
      role='img'
      aria-label={label}
      title={label}
    >
      <i
        aria-hidden='true'
        className='min-w-0 bg-foreground mask-center mask-repeat-x'
        style={{ maskImage: texture.available, flex: available }}
      />
      <i
        aria-hidden='true'
        className='min-w-0 bg-foreground mask-center mask-repeat-x'
        style={{ maskImage: texture.reserved, flex: reserved }}
      />
      <i
        aria-hidden='true'
        className='min-w-0 bg-foreground mask-center mask-repeat-x'
        style={{ maskImage: texture.used, flex: used }}
      />
    </div>
  );
}
