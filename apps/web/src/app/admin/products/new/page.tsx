"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAllergens } from "@/hooks/use-allergens";
import { useCategories } from "@/hooks/use-categories";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useIngredients } from "@/hooks/use-ingredients";
import {
  useCreateProduct,
  useProduct,
  useUpdateProduct,
} from "@/hooks/use-products";
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
  images: string[];
  allergenIds: string[];
  ingredients: IngredientRow[];
  isActive: boolean;
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
  images: [""],
  allergenIds: [],
  ingredients: [],
  isActive: true,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function ProductFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
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

  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);

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
      images:
        product.images && product.images.length > 0 ? product.images : [product.coverImage ?? ""],
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

  const isSubmitting = createProduct.isPending || updateProduct.isPending;

  const normalizedImages = form.images.map((value) => value.trim()).filter(Boolean);
  const canSubmit =
    Boolean(activeStoreId) &&
    Boolean(form.nameTr.trim()) &&
    Boolean(form.categoryId) &&
    Boolean(form.price);

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

    const payload = {
      storeId: activeStoreId,
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
      images: normalizedImages,
      coverImage: form.coverImage.trim() || normalizedImages[0] || undefined,
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
          ...payload,
          isActive: form.isActive,
        },
        {
          onSuccess: () => {
            router.push("/admin/products");
          },
        }
      );
      return;
    }

    createProduct.mutate(payload, {
      onSuccess: () => {
        router.push("/admin/products");
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? "Urun duzenle" : "Yeni urun"}
          </h1>
          <p className="text-muted-foreground">
            {activeStore
              ? `${activeStore.name} icin urun bilgilerini kaydedin.`
              : "Aktif magaza secimi bekleniyor."}
          </p>
        </div>
      </div>

      {isEditMode && productLoading ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Urun bilgileri yukleniyor...
          </CardContent>
        </Card>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Genel bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
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
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Aciklama (TR)</label>
                <textarea
                  className="flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.descriptionTr}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      descriptionTr: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Aciklama (EN)</label>
                <textarea
                  className="flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.categoryId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      categoryId: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Kategori secin</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Birim</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.unitId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, unitId: event.target.value }))
                  }
                >
                  <option value="">Ilk mevcut birimi kullan</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.abbreviation})
                    </option>
                  ))}
                </select>
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
              {isEditMode && (
                <div className="flex items-center gap-3 pt-6">
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
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fiyat ve medya</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
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
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.currency}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      currency: event.target.value,
                    }))
                  }
                >
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">3D model URL</label>
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
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Kapak gorseli</label>
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
              </div>
              <div className="space-y-3 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Ek gorseller</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        images: [...current.images, ""],
                      }))
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Gorsel ekle
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.images.map((image, index) => (
                    <div key={`${index}-${image}`} className="flex gap-2">
                      <Input
                        value={image}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            images: current.images.map((currentImage, currentIndex) =>
                              currentIndex === index ? event.target.value : currentImage
                            ),
                          }))
                        }
                        placeholder="https://.../image.jpg"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            images:
                              current.images.length === 1
                                ? [""]
                                : current.images.filter((_, currentIndex) => currentIndex !== index),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Malzemeler ve alerjenler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Malzemeler</label>
                  <select
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value=""
                    onChange={(event) => {
                      if (!event.target.value) {
                        return;
                      }

                      setForm((current) => ({
                        ...current,
                        ingredients: [
                          ...current.ingredients,
                          { ingredientId: event.target.value, quantity: "1" },
                        ],
                      }));
                    }}
                  >
                    <option value="">Malzeme ekle</option>
                    {availableIngredients.map((ingredient) => (
                      <option key={ingredient.id} value={ingredient.id}>
                        {ingredient.name}
                      </option>
                    ))}
                  </select>
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
                          className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_120px_auto]"
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
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {allergens.map((allergen) => (
                    <label
                      key={allergen.id}
                      className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={form.allergenIds.includes(allergen.id)}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            allergenIds: event.target.checked
                              ? [...current.allergenIds, allergen.id]
                              : current.allergenIds.filter((id) => id !== allergen.id),
                          }))
                        }
                      />
                      <span>{allergen.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {units.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Bu store icin birim bulunmuyor. Backend ilk mevcut birimi fallback
                olarak kullanir; hic birim yoksa urun kaydi basarisiz olur.
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Degisiklikleri kaydet" : "Urunu kaydet"}
            </Button>
            <Link href="/admin/products">
              <Button type="button" variant="outline">
                Iptal
              </Button>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
