"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ModelViewerProps {
  src: string;
  alt: string;
  poster?: string;
  className?: string;
}

/**
 * 3D Model Viewer wrapper component using @google/model-viewer.
 * Renders a <model-viewer> web component for displaying 3D product models.
 * Supports .glb and .gltf formats with AR capabilities on supported devices.
 */
export function ModelViewer({ src, alt, poster, className }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically import model-viewer to avoid SSR issues
    import("@google/model-viewer").catch(() => {
      console.warn("@google/model-viewer could not be loaded");
    });
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <model-viewer
        src={src}
        alt={alt}
        poster={poster}
        shadow-intensity="1"
        camera-controls
        auto-rotate
        ar
        ar-modes="webxr scene-viewer quick-look"
        style={{ width: "100%", height: "100%" }}
      >
        <div
          slot="poster"
          className="flex h-full items-center justify-center bg-muted"
        >
          <p className="text-sm text-muted-foreground">3D model yukleniyor...</p>
        </div>
      </model-viewer>
    </div>
  );
}
