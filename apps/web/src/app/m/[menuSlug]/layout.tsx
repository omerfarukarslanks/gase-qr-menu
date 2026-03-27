import type { Metadata } from "next";

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
    <div className="min-h-screen bg-background">
      {/* Mobile-first public menu layout - no admin sidebar */}
      <div className="mx-auto max-w-lg">
        {children}
      </div>

      {/* Bottom safe area for mobile browsers */}
      <div className="h-safe-bottom" />
    </div>
  );
}
