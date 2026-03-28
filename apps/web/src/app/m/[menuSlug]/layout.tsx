import type { Metadata } from "next";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Menü | GASE QR Menu",
  description: "Dijital menü - QR kodunuzla sipariş verin",
};

interface MenuLayoutProps {
  children: React.ReactNode;
  params: { menuSlug: string };
}

export default function MenuLayout({ children, params }: MenuLayoutProps) {
  return (
    <div className="theme-app-gradient min-h-screen">
      <div className="fixed right-4 top-4 z-40">
        <ThemeToggle compact />
      </div>
      <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 sm:py-6">
        {children}
      </div>

      <div className="h-safe-bottom" />
    </div>
  );
}
