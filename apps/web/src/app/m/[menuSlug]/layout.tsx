import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu | GASE QR Menu",
  description: "Dijital menu - QR kodunuzla siparis verin",
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
    </div>
  );
}
