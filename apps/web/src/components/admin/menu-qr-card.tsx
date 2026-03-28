"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Copy, Download, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";

interface MenuQrCardProps {
  qrToken: string;
  menuName: string;
  size?: number;
}

const FALLBACK_WEB_URL = "http://localhost:3000";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return FALLBACK_WEB_URL;
}

export function MenuQrCard({
  qrToken,
  menuName,
  size = 192,
}: MenuQrCardProps) {
  const [copied, setCopied] = useState(false);
  const qrWrapperRef = useRef<HTMLDivElement>(null);

  const publicUrl = useMemo(() => `${getBaseUrl()}/m/${qrToken}`, [qrToken]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const svg = qrWrapperRef.current?.querySelector("svg");

    if (!svg) {
      return;
    }

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${menuName || "menu"}-qr.svg`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center rounded-xl border bg-white p-4">
        <div ref={qrWrapperRef} className="rounded-lg bg-white p-3">
          <QRCodeSVG
            value={publicUrl}
            size={size}
            includeMargin
            bgColor="#ffffff"
            fgColor="#111827"
          />
        </div>
      </div>

      <div className="rounded-md bg-muted/50 p-3 text-sm">
        <div className="truncate font-mono">{publicUrl}</div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" />
          {copied ? "Kopyalandi" : "URL kopyala"}
        </Button>
        <Button type="button" variant="outline" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          QR indir
        </Button>
        <Link href={`/m/${qrToken}`} target="_blank">
          <Button type="button" variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Menuyu ac
          </Button>
        </Link>
      </div>
    </div>
  );
}
