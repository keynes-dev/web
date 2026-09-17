export const resourceTextures = {
  available:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='14'%3E%3Ctext x='0' y='12' fill='white' font-family='monospace' font-size='14'%3E%E2%96%93%3C/text%3E%3C/svg%3E\")",
  reserved:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='14'%3E%3Ctext x='0' y='12' fill='white' fill-opacity='.55' font-family='monospace' font-size='14'%3E%E2%96%92%3C/text%3E%3C/svg%3E\")",
  used: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='14'%3E%3Ctext x='0' y='12' fill='white' fill-opacity='.3' font-family='monospace' font-size='14'%3E%E2%96%91%3C/text%3E%3C/svg%3E\")",
};

export type ResourceTexture = keyof typeof resourceTextures;
