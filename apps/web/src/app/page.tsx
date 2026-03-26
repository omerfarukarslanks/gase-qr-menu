import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          GASE QR Menu
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Dijital menu ve restoran yonetim sistemi. QR kod ile musteri
          deneyimini modernlestirin.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            Yonetim Paneli
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
