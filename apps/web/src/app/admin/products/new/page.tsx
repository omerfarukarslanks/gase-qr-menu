"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductEditor } from "@/components/admin/product-editor";

function ProductFormPageContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  return <ProductEditor editId={editId} standalone />;
}

export default function ProductFormPage() {
  return (
    <Suspense fallback={null}>
      <ProductFormPageContent />
    </Suspense>
  );
}
