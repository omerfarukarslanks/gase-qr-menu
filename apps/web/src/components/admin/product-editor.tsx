"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ModelViewer } from "@/components/menu/model-viewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAllergens } from "@/hooks/use-allergens";
import { useCategories } from "@/hooks/use-categories";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useIngredients } from "@/hooks/use-ingredients";
import { useCreateProduct, useProduct, useUpdateProduct } from "@/hooks/use-products";
import {
  useDeleteUploadedFile,
  useUploadFile,
  useUploadImage,
} from "@/hooks/use-upload";
import { useUnits } from "@/hooks/use-units";

interface IngredientRow {
  ingredientId: string;
  quantity: string;
}

interface ProductFormState {
  nameTr: string;
  nameEn: string;
  descriptionTr: string;
  descriptionEn: string;
  slug: string;
  categoryId: string;
  unitId: string;
  price: string;
  costPrice: string;
  currency: string;
  preparationTime: string;
  model3dUrl: string;
  coverImage: string;
  allergenIds: string[];
  ingredients: IngredientRow[];
  isActive: boolean;
}

interface ProductEditorProps {
  editId?: string | null;
  standalone?: boolean;
  onDone?: () => void;
  onCancel?: () => void;
}

const emptyForm: ProductFormState = {
  nameTr: "",
  nameEn: "",
  descriptionTr: "",
  descriptionEn: "",
  slug: "",
  categoryId: "",
  unitId: "",
  price: "",
  costPrice: "",
  currency: "TRY",
  preparationTime: "",
  model3dUrl: "",
  coverImage: "",
  allergenIds: [],
  ingredients: [],
  isActive: true,
};

const BUCKET_PATH_MARKER = "/gase-uploads/";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getErrorMessage(error: unknown) {
  if (!error) {
    return null;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string | string[] } } }).response?.data
      ?.message !== "undefined"
  ) {
    const message = (error as { response?: { data?: { message?: string | string[] } } })
      .response?.data?.message;
    return Array.isArray(message) ? message.join(", ") : message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Medya islemi tamamlanamadi.";
}

function extractManagedUploadKey(fileUrl: string) {
  const trimmedUrl = fileUrl.trim();

  if (!trimmedUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    const markerIndex = parsedUrl.pathname.indexOf(BUCKET_PATH_MARKER);

    if (markerIndex === -1) {
      return null;
    }

    return decodeURIComponent(
      parsedUrl.pathname.slice(markerIndex + BUCKET_PATH_MARKER.length)
    );
  } catch {
    if (!trimmedUrl.startsWith(BUCKET_PATH_MARKER)) {
      return null;
    }

    return decodeURIComponent(trimmedUrl.slice(BUCKET_PATH_MARKER.length));
  }
}

function getManagedAssetKeys(fileUrl: string, includeThumbnail: boolean) {
  const key = extractManagedUploadKey(fileUrl);

  if (!key) {
    return [];
  }

  const keys = new Set([key]);

  if (includeThumbnail && key.endsWith(".webp") && !key.endsWith("_thumb.webp")) {
    keys.add(key.replace(/\.webp$/, "_thumb.webp"));
  }

  return Array.from(keys);
}

function getFileName(fileUrl: string) {
  const trimmedUrl = fileUrl.trim();

  if (!trimmedUrl) {
    return "";
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    return decodeURIComponent(parsedUrl.pathname.split("/").pop() || trimmedUrl);
  } catch {
    return decodeURIComponent(trimmedUrl.split("/").pop() || trimmedUrl);
  }
}

export function ProductEditor({
  editId,
  standalone = false,
  onDone,
  onCancel,
}: ProductEditorProps) {
  const router = useRouter();
  const isEditMode = Boolean(editId);
  const { activeStoreId, activeStore } = useCurrentStore();
  const { data: categories = [] } = useCategories(activeStoreId ?? "");
  const { data: units = [] } = useUnits(activeStoreId ?? "");
  const { data: ingredientsData } = useIngredients(activeStoreId ?? "", {
    pageSize: 100,
  });
  const { data: allergens = [] } = useAllergens();
  const { data: product, isLoading: productLoading } = useProduct(editId ?? "");
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const uploadCoverImage = useUploadImage();
  const uploadModel = useUploadFile();
  const deleteUploadedFile = useDeleteUploadedFile();

  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const ingredients = ingredientsData?.data ?? [];

  useEffect(() => {
    if (!slugTouched && form.nameTr) {
      setForm((current) => ({
        ...current,
        slug: slugify(current.nameTr),
      }));
    }
  }, [form.nameTr, slugTouched]);

  useEffect(() => {
    if (!product) {
      return;
    }

    const trTranslation =
      product.translations?.find((translation) => translation.languageCode === "tr") ??
      product.translations?.[0];
    const enTranslation = product.translations?.find(
      (translation) => translation.languageCode === "en"
    );

    setSlugTouched(true);
    setForm({
      nameTr: trTranslation?.name ?? product.name,
      nameEn: enTranslation?.name ?? "",
      descriptionTr: trTranslation?.description ?? product.description ?? "",
      descriptionEn: enTranslation?.description ?? "",
      slug: product.slug ?? "",
      categoryId: product.categoryId ?? "",
      unitId: product.unitId ?? "",
      price: product.price ? String(product.price) : "",
      costPrice: product.costPrice ? String(product.costPrice) : "",
      currency: product.currency ?? "TRY",
      preparationTime: product.preparationTime ? String(product.preparationTime) : "",
      model3dUrl: product.model3dUrl ?? "",
      coverImage: product.coverImage ?? "",
      allergenIds: product.allergens?.map((allergen) => allergen.id) ?? [],
      ingredients:
        product.ingredients?.map((ingredient) => ({
          ingredientId: ingredient.id ?? ingredient.ingredientId ?? "",
          quantity: ingredient.quantity ? String(ingredient.quantity) : "1",
        })) ?? [],
      isActive: product.isActive,
    });
  }, [product]);

  const availableIngredients = useMemo(
    () =>
      ingredients.filter(
        (ingredient) =>
          !form.ingredients.some((row) => row.ingredientId === ingredient.id)
      ),
    [form.ingredients, ingredients]
  );

  const uploadErrorMessage =
    mediaError ||
    getErrorMessage(uploadCoverImage.error) ||
    getErrorMessage(uploadModel.error) ||
    getErrorMessage(deleteUploadedFile.error);
  const isMediaUploading =
    uploadCoverImage.isPending ||
    uploadModel.isPending ||
    deleteUploadedFile.isPending;
  const isSubmitting =
    createProduct.isPending || updateProduct.isPending || isMediaUploading;
  const canSubmit =
    Boolean(activeStoreId) &&
    Boolean(form.nameTr.trim()) &&
    Boolean(form.categoryId) &&
    Boolean(form.price);

  const handleClose = () => {
    if (onCancel) {
      onCancel();
      return;
    }

    router.push("/admin/products");
  };

  const handleSuccess = () => {
    if (onDone) {
      onDone();
      return;
    }

    router.push("/admin/products");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!activeStoreId) {
      return;
    }

    const translations = [
      {
        languageCode: "tr",
        name: form.nameTr.trim(),
        description: form.descriptionTr.trim() || undefined,
      },
      ...(form.nameEn.trim() || form.descriptionEn.trim()
        ? [
            {
              languageCode: "en",
              name: form.nameEn.trim() || form.nameTr.trim(),
              description: form.descriptionEn.trim() || undefined,
            },
          ]
        : []),
    ];

    const basePayload = {
      name: form.nameTr.trim(),
      description: form.descriptionTr.trim() || undefined,
      slug: form.slug.trim() || undefined,
      categoryId: form.categoryId,
      unitId: form.unitId || undefined,
      price: Number(form.price),
      costPrice: form.costPrice ? Number(form.costPrice) : undefined,
      currency: form.currency,
      preparationTime: form.preparationTime
        ? Number(form.preparationTime)
        : undefined,
      images: [],
      coverImage: form.coverImage.trim() || undefined,
      model3dUrl: form.model3dUrl.trim() || undefined,
      allergenIds: form.allergenIds,
      ingredients: form.ingredients
        .filter((ingredient) => ingredient.ingredientId)
        .map((ingredient) => ({
          ingredientId: ingredient.ingredientId,
          quantity: Number(ingredient.quantity) || 1,
        })),
      translations,
    };

    if (isEditMode && editId) {
      updateProduct.mutate(
        {
          id: editId,
          ...basePayload,
          isActive: form.isActive,
        },
        {
          onSuccess: handleSuccess,
        }
      );
      return;
    }

    createProduct.mutate(
      {
        storeId: activeStoreId,
        ...basePayload,
      },
      {
        onSuccess: handleSuccess,
      }
    );
  };

  const handleCoverImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    setMediaError(null);

    uploadCoverImage.mutate(
      {
        file: selectedFile,
        folder: "products",
      },
      {
        onSuccess: (uploadedFile) => {
          setForm((current) => ({
            ...current,
            coverImage: uploadedFile?.url ?? "",
          }));
        },
      }
    );
  };

  const handleModelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    setMediaError(null);

    uploadModel.mutate(
      {
        file: selectedFile,
        folder: "model3d",
      },
      {
        onSuccess: (uploadedFile) => {
          setForm((current) => ({
            ...current,
            model3dUrl: uploadedFile.url,
          }));
        },
      }
    );
  };

  const deleteManagedAsset = async (
    fileUrl: string,
    options?: { includeThumbnail?: boolean }
  ) => {
    const keys = getManagedAssetKeys(fileUrl, options?.includeThumbnail ?? false);

    for (const key of keys) {
      await deleteUploadedFile.mutateAsync({ key });
    }
  };

  const handleRemoveModel = async () => {
    const currentUrl = form.model3dUrl.trim();

    if (!currentUrl) {
      return;
    }

    setMediaError(null);

    try {
      await deleteManagedAsset(currentUrl);
      setForm((current) => ({ ...current, model3dUrl: "" }));
    } catch (error) {
      setMediaError(getErrorMessage(error) ?? "Medya islemi tamamlanamadi.");
    }
  };

  const handleRemoveCoverImage = async () => {
    const currentUrl = form.coverImage.trim();

    if (!currentUrl) {
      return;
    }

    setMediaError(null);

    try {
      await deleteManagedAsset(currentUrl, { includeThumbnail: true });
      setForm((current) => ({ ...current, coverImage: "" }));
    } catch (error) {
      setMediaError(getErrorMessage(error) ?? "Medya islemi tamamlanamadi.");
    }
  };

  return (
    <div className="space-y-6">
      {standalone ? (
        <AdminPageHeader
          title={isEditMode ? "Urun duzenle" : "Yeni urun"}
          description={
            activeStore
              ? `${activeStore.name} icin urun bilgilerini kaydedin.`
              : "Aktif magaza secimi bekleniyor."
          }
          action={
            <Button variant="outline" onClick={handleClose}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Listeye don
            </Button>
          }
        />
      ) : null}

      {isEditMode && productLoading ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Urun bilgileri yukleniyor...
          </CardContent>
        </Card>
      ) : (
        <form
          className="space-y-6"
          onSubmit={handleSubmit}
          onInvalidCapture={(event) =>
            event.currentTarget.classList.add("form-validation-submitted")
          }
        >
          <Card className="border-border/80 bg-card/90 shadow-[var(--card-shadow)]">
            <CardHeader>
              <CardTitle>Genel bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Urun adi (TR)</label>
                <Input
                  value={form.nameTr}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, nameTr: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Urun adi (EN)</label>
                <Input
                  value={form.nameEn}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, nameEn: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2 xl:col-span-3">
                <label className="text-sm font-medium">Aciklama (TR)</label>
                <textarea
                  className="flex min-h-[112px] w-full rounded-[1rem] border border-input bg-background px-3 py-3 text-sm"
                  value={form.descriptionTr}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      descriptionTr: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2 xl:col-span-3">
                <label className="text-sm font-medium">Aciklama (EN)</label>
                <textarea
                  className="flex min-h-[112px] w-full rounded-[1rem] border border-input bg-background px-3 py-3 text-sm"
                  value={form.descriptionEn}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      descriptionEn: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setForm((current) => ({ ...current, slug: event.target.value }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kategori</label>
                <SearchableSelect
                  options={[
                    { value: "", label: "Kategori secin" },
                    ...categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    })),
                  ]}
                  value={form.categoryId}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      categoryId: String(value),
                    }))
                  }
                  name="categoryId"
                  required
                  placeholder="Kategori secin"
                  searchPlaceholder="Kategori ara..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Birim</label>
                <SearchableSelect
                  options={[
                    { value: "", label: "Ilk mevcut birimi kullan" },
                    ...units.map((unit) => ({
                      value: unit.id,
                      label: `${unit.name} (${unit.abbreviation})`,
                      keywords: [unit.name, unit.abbreviation],
                    })),
                  ]}
                  value={form.unitId}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, unitId: String(value) }))
                  }
                  placeholder="Ilk mevcut birimi kullan"
                  searchPlaceholder="Birim ara..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hazirlama suresi (dk)</label>
                <Input
                  type="number"
                  value={form.preparationTime}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      preparationTime: event.target.value,
                    }))
                  }
                />
              </div>
              {isEditMode ? (
                <div className="flex items-center gap-3 rounded-[1rem] border border-border bg-secondary/40 px-4 py-3">
                  <label className="text-sm font-medium">Aktif</label>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/90 shadow-[var(--card-shadow)]">
            <CardHeader>
              <CardTitle>Fiyat ve medya</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Satis fiyati</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, price: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Maliyet fiyati</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.costPrice}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      costPrice: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Para birimi</label>
                <SearchableSelect
                  options={[
                    { value: "TRY", label: "TRY" },
                    { value: "USD", label: "USD" },
                    { value: "EUR", label: "EUR" },
                  ]}
                  value={form.currency}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      currency: String(value),
                    }))
                  }
                  searchPlaceholder="Para birimi ara..."
                />
              </div>
              <div className="space-y-3 xl:col-span-1">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium">3D model</label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-[1rem] border px-3 py-2 text-sm font-medium hover:bg-muted">
                    <Upload className="h-4 w-4" />
                    {uploadModel.isPending ? "Yukleniyor..." : "GLB yukle"}
                    <input
                      type="file"
                      className="hidden"
                      accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
                      onChange={handleModelUpload}
                      disabled={isMediaUploading}
                    />
                  </label>
                </div>
                <Input
                  value={form.model3dUrl}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      model3dUrl: event.target.value,
                    }))
                  }
                  placeholder="https://.../model.glb"
                />
                {form.model3dUrl ? (
                  <div className="overflow-hidden rounded-[1.25rem] border bg-card">
                    <div className="h-52 bg-gradient-to-br from-muted via-muted/60 to-background">
                      <ModelViewer
                        src={form.model3dUrl}
                        alt={form.nameTr || "Urun 3D modeli"}
                        className="h-full w-full"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 p-3">
                      <a
                        className="truncate text-xs text-primary underline-offset-4 hover:underline"
                        href={form.model3dUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {getFileName(form.model3dUrl)}
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveModel}
                        disabled={isMediaUploading}
                      >
                        Kaldir
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="space-y-3 xl:col-span-1">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium">Kapak gorseli</label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-[1rem] border px-3 py-2 text-sm font-medium hover:bg-muted">
                    <Upload className="h-4 w-4" />
                    {uploadCoverImage.isPending ? "Yukleniyor..." : "Kapak yukle"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleCoverImageUpload}
                      disabled={isMediaUploading}
                    />
                  </label>
                </div>
                <Input
                  value={form.coverImage}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      coverImage: event.target.value,
                    }))
                  }
                  placeholder="https://.../cover.jpg"
                />
                {form.coverImage.trim() ? (
                  <div className="overflow-hidden rounded-[1.25rem] border bg-card">
                    <div className="mx-auto aspect-[4/3] max-h-52 max-w-sm overflow-hidden rounded-b-none bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.coverImage}
                        alt="Kapak gorseli"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 p-3">
                      <div className="truncate text-xs text-muted-foreground">
                        {getFileName(form.coverImage)}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCoverImage}
                        disabled={isMediaUploading}
                      >
                        Kaldir
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
              {uploadErrorMessage ? (
                <div className="md:col-span-2 xl:col-span-3 rounded-[1rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {uploadErrorMessage}
                </div>
              ) : null}
              <div className="md:col-span-2 xl:col-span-3 text-xs text-muted-foreground">
                Bu ekranda su an sadece kapak gorseli ve 3D model yonetiliyor.
                50MB'a kadar tek bir 3D model yukleyebilirsiniz.
              </div>
              {!form.coverImage.trim() && !form.model3dUrl.trim() ? (
                <div className="md:col-span-2 xl:col-span-3 rounded-[1.25rem] border border-dashed bg-muted/20 px-4 py-8 text-center">
                  <ImageIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Kapak gorseli veya 3D model yuklediginizde burada kompakt onizlemeler gosterilecek.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/90 shadow-[var(--card-shadow)]">
            <CardHeader>
              <CardTitle>Malzemeler ve alerjenler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Malzemeler</label>
                  <div className="w-full max-w-xs">
                    <SearchableSelect
                      options={availableIngredients.map((ingredient) => ({
                        value: ingredient.id,
                        label: ingredient.name,
                      }))}
                      value=""
                      onChange={(value) => {
                        const nextIngredientId = String(value);
                        if (!nextIngredientId) {
                          return;
                        }

                        setForm((current) => ({
                          ...current,
                          ingredients: [
                            ...current.ingredients,
                            { ingredientId: nextIngredientId, quantity: "1" },
                          ],
                        }));
                      }}
                      placeholder="Malzeme ekle"
                      searchPlaceholder="Malzeme ara..."
                      emptyMessage="Eklenebilecek malzeme kalmadi."
                    />
                  </div>
                </div>
                {form.ingredients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Henuz malzeme secilmedi.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {form.ingredients.map((ingredientRow, index) => {
                      const ingredient = ingredients.find(
                        (item) => item.id === ingredientRow.ingredientId
                      );

                      return (
                        <div
                          key={`${ingredientRow.ingredientId}-${index}`}
                          className="grid gap-2 rounded-[1rem] border p-3 md:grid-cols-[1fr_120px_auto]"
                        >
                          <div className="text-sm font-medium">
                            {ingredient?.name || ingredientRow.ingredientId}
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            value={ingredientRow.quantity}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                ingredients: current.ingredients.map((currentRow, currentIndex) =>
                                  currentIndex === index
                                    ? { ...currentRow, quantity: event.target.value }
                                    : currentRow
                                ),
                              }))
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                ingredients: current.ingredients.filter(
                                  (_, currentIndex) => currentIndex !== index
                                ),
                              }))
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Alerjenler</label>
                <div className="space-y-3">
                  <SearchableSelect
                    mode="multiple"
                    options={allergens.map((allergen) => ({
                      value: allergen.id,
                      label: allergen.name,
                      keywords: [allergen.code],
                    }))}
                    value={form.allergenIds}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        allergenIds: Array.isArray(value) ? value : [],
                      }))
                    }
                    placeholder="Alerjen secin"
                    searchPlaceholder="Alerjen ara..."
                  />
                  <div className="flex flex-wrap gap-2">
                    {allergens
                      .filter((allergen) => form.allergenIds.includes(allergen.id))
                      .map((allergen) => (
                        <span
                          key={allergen.id}
                          className="inline-flex items-center rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive"
                        >
                          {allergen.name}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {units.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Bu store icin birim bulunmuyor. Backend ilk mevcut birimi fallback
                olarak kullanir; hic birim yoksa urun kaydi basarisiz olur.
              </CardContent>
            </Card>
          ) : null}

          <div className="sticky bottom-3 z-10 -mx-2 rounded-[1.4rem] border border-border/80 bg-background/92 p-3 shadow-[var(--card-shadow-hover)] backdrop-blur lg:static lg:mx-0 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isEditMode ? "Degisiklikleri kaydet" : "Urunu kaydet"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleClose}
              >
                Iptal
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
