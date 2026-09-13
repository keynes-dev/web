import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "conveyor-belt": HTMLAttributes<HTMLElement>;
    }
  }
}
