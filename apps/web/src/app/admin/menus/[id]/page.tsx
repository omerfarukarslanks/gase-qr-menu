"use client";

import { MenuEditor } from "@/components/admin/menu-editor";

interface MenuDetailPageProps {
  params: { id: string };
}

export default function MenuDetailPage({ params }: MenuDetailPageProps) {
  return <MenuEditor menuId={params.id} standalone />;
}
