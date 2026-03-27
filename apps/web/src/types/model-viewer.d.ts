import type { HTMLAttributes } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        poster?: string;
        slot?: string;
        "shadow-intensity"?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        ar?: boolean;
        "ar-modes"?: string;
      };
    }
  }
}

export {};
