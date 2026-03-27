"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ImageIcon,
  Plus,
  X,
  Box,
  Clock,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const mockCategories = [
  { id: "1", name: "Ana Yemekler" },
  { id: "1-1", name: "Ana Yemekler > Izgara" },
  { id: "1-2", name: "Ana Yemekler > Kebaplar" },
  { id: "1-3", name: "Ana Yemekler > Tavuk" },
  { id: "2", name: "Baslangiclar" },
  { id: "2-1", name: "Baslangiclar > Soguk Mezeler" },
  { id: "2-2", name: "Baslangiclar > Sicak Mezeler" },
  { id: "3", name: "Salatalar" },
  { id: "4", name: "Icecekler" },
  { id: "4-1", name: "Icecekler > Soguk Icecekler" },
  { id: "4-2", name: "Icecekler > Sicak Icecekler" },
  { id: "5", name: "Tatlilar" },
];

const mockUnits = [
  { id: "1", name: "Porsiyon" },
  { id: "2", name: "Adet" },
  { id: "3", name: "Bardak" },
  { id: "4", name: "Tabak" },
  { id: "5", name: "Sise" },
];

const mockIngredients = [
  { id: "1", name: "Kiyma" },
  { id: "2", name: "Sogan" },
  { id: "3", name: "Domates" },
  { id: "4", name: "Biber" },
  { id: "5", name: "Maydanoz" },
  { id: "6", name: "Sarimsak" },
  { id: "7", name: "Zeytinyagi" },
  { id: "8", name: "Tereyagi" },
  { id: "9", name: "Tuz" },
  { id: "10", name: "Karabiber" },
  { id: "11", name: "Pul Biber" },
  { id: "12", name: "Yogurt" },
  { id: "13", name: "Peynir" },
  { id: "14", name: "Un" },
  { id: "15", name: "Pirinc" },
];

const eu14Allergens = [
  { id: "1", name: "Gluten", icon: "🌾" },
  { id: "2", name: "Kabuklu Deniz Urunleri", icon: "🦐" },
  { id: "3", name: "Yumurta", icon: "🥚" },
  { id: "4", name: "Balik", icon: "🐟" },
  { id: "5", name: "Yer Fistigi", icon: "🥜" },
  { id: "6", name: "Soya", icon: "🫘" },
  { id: "7", name: "Sut", icon: "🥛" },
  { id: "8", name: "Kabuklu Meyveler", icon: "🌰" },
  { id: "9", name: "Kereviz", icon: "🥬" },
  { id: "10", name: "Hardal", icon: "🟡" },
  { id: "11", name: "Susam", icon: "🟤" },
  { id: "12", name: "Kукурт Dioksit", icon: "🧪" },
  { id: "13", name: "Lupine", icon: "🌿" },
  { id: "14", name: "Yumusakcalar", icon: "🐙" },
];

interface SelectedIngredient {
  ingredientId: string;
  name: string;
  quantity: string;
  isRemovable: boolean;
}

interface ImageSlot {
  url: string;
  isCover: boolean;
}

export default function ProductFormPage() {
  const [nameTr, setNameTr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [slug, setSlug] = useState("");
  const [descriptionTr, setDescriptionTr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [taxRate, setTaxRate] = useState("10");
  const [salePrice, setSalePrice] = useState("");
  const [currency, setCurrency] = useState("TRY");
  const [images, setImages] = useState<ImageSlot[]>([
    { url: "", isCover: true },
  ]);
  const [modelUrl, setModelUrl] = useState("");
  const [modelThumbnail, setModelThumbnail] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [selectedAllergens, setSelectedAllergens] = useState<Set<string>>(new Set());
  const [preparationTime, setPrepTime] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (nameTr) {
      const generated = nameTr
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setSlug(generated);
    }
  }, [nameTr]);

  const addImageSlot = () => {
    if (images.length < 5) {
      setImages([...images, { url: "", isCover: false }]);
    }
  };

  const removeImageSlot = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((img) => img.isCover)) {
      updated[0].isCover = true;
    }
    setImages(updated);
  };

  const setCoverImage = (index: number) => {
    setImages(
      images.map((img, i) => ({ ...img, isCover: i === index }))
    );
  };

  const updateImageUrl = (index: number, url: string) => {
    setImages(images.map((img, i) => (i === index ? { ...img, url } : img)));
  };

  const filteredIngredients = mockIngredients.filter(
    (ing) =>
      ing.name.toLowerCase().includes(ingredientSearch.toLowerCase()) &&
      !selectedIngredients.some((si) => si.ingredientId === ing.id)
  );

  const addIngredient = (ing: { id: string; name: string }) => {
    setSelectedIngredients([
      ...selectedIngredients,
      { ingredientId: ing.id, name: ing.name, quantity: "", isRemovable: true },
    ]);
    setIngredientSearch("");
  };

  const removeIngredient = (ingredientId: string) => {
    setSelectedIngredients(
      selectedIngredients.filter((si) => si.ingredientId !== ingredientId)
    );
  };

  const toggleAllergen = (id: string) => {
    setSelectedAllergens((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    // TODO: API call
    alert("Urun kaydedildi (mock)");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yeni Urun Ekle</h1>
          <p className="text-muted-foreground">
            Urun bilgilerini doldurun ve kaydedin.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Genel Bilgiler */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Genel Bilgiler</CardTitle>
            <CardDescription>Urun adi ve aciklama bilgileri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Urun Adi (TR) *</label>
                <Input
                  placeholder="ornek: Adana Kebap"
                  value={nameTr}
                  onChange={(e) => setNameTr(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Urun Adi (EN)</label>
                <Input
                  placeholder="e.g.: Adana Kebab"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input
                  placeholder="otomatik-olusturulur"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  URL dostu isim. Otomatik olusturulur.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kategori *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Kategori secin</option>
                  {mockCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Aciklama (TR)</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Urun aciklamasi (Turkce)"
                  value={descriptionTr}
                  onChange={(e) => setDescriptionTr(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Aciklama (EN)</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Product description (English)"
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Birim</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                >
                  <option value="">Birim secin</option>
                  {mockUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Hazirlama Suresi (dk)</label>
                <Input
                  type="number"
                  className="w-24"
                  placeholder="25"
                  value={preparationTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fiyatlandirma */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fiyatlandirma</CardTitle>
            <CardDescription>Maliyet, vergi ve satis fiyati</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Maliyet Fiyati</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">KDV Orani (%)</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                >
                  <option value="1">%1</option>
                  <option value="10">%10</option>
                  <option value="20">%20</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Satis Fiyati *</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Para Birimi</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="TRY">TRY (Turk Lirasi)</option>
                  <option value="USD">USD (Amerikan Dolari)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aktiflik */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Durum</CardTitle>
            <CardDescription>Urun aktiflik ve gorunurluk</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Urun Aktif</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pasif urunler menude gorunmez
                </p>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isActive ? "bg-primary" : "bg-gray-300"
                }`}
                onClick={() => setIsActive(!isActive)}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Gorseller */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Gorseller</CardTitle>
            <CardDescription>
              En fazla 5 gorsel ekleyebilirsiniz. Bir tanesini kapak gorseli olarak secin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((img, index) => (
                <div key={index} className="space-y-2">
                  <div className="aspect-video bg-muted rounded-lg border-2 border-dashed flex items-center justify-center relative">
                    {img.url ? (
                      <img
                        src={img.url}
                        alt={`Gorsel ${index + 1}`}
                        className="object-cover w-full h-full rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Gorsel {index + 1}
                        </p>
                      </div>
                    )}
                    {images.length > 1 && (
                      <button
                        className="absolute top-1 right-1 bg-white/80 rounded-full p-1 hover:bg-white"
                        onClick={() => removeImageSlot(index)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    {img.isCover && (
                      <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                        Kapak
                      </span>
                    )}
                  </div>
                  <Input
                    placeholder="Gorsel URL"
                    value={img.url}
                    onChange={(e) => updateImageUrl(index, e.target.value)}
                  />
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="radio"
                      name="coverImage"
                      checked={img.isCover}
                      onChange={() => setCoverImage(index)}
                    />
                    Kapak gorseli olarak sec
                  </label>
                </div>
              ))}

              {images.length < 5 && (
                <button
                  className="aspect-video bg-muted/50 rounded-lg border-2 border-dashed flex flex-col items-center justify-center hover:bg-muted transition-colors"
                  onClick={addImageSlot}
                >
                  <Plus className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">
                    Gorsel Ekle
                  </span>
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3D Model */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Box className="h-5 w-5" />
              3D Model
            </CardTitle>
            <CardDescription>
              GLB formatinda 3D model yukleyin. AR goruntulemede kullanilir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Model URL (.glb)</label>
                <Input
                  placeholder="https://ornek.com/model.glb"
                  value={modelUrl}
                  onChange={(e) => setModelUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Model Thumbnail URL</label>
                <Input
                  placeholder="https://ornek.com/thumbnail.jpg"
                  value={modelThumbnail}
                  onChange={(e) => setModelThumbnail(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Malzemeler */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Malzemeler</CardTitle>
            <CardDescription>
              Urun icin gerekli malzemeleri secin ve miktar belirleyin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Malzeme ara..."
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                />
                {ingredientSearch && filteredIngredients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredIngredients.map((ing) => (
                      <button
                        key={ing.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => addIngredient(ing)}
                      >
                        {ing.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedIngredients.length > 0 && (
                <div className="border rounded-lg divide-y">
                  {selectedIngredients.map((si) => (
                    <div
                      key={si.ingredientId}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <span className="text-sm font-medium flex-1">
                        {si.name}
                      </span>
                      <Input
                        className="w-24 h-8 text-xs"
                        placeholder="Miktar"
                        value={si.quantity}
                        onChange={(e) =>
                          setSelectedIngredients(
                            selectedIngredients.map((s) =>
                              s.ingredientId === si.ingredientId
                                ? { ...s, quantity: e.target.value }
                                : s
                            )
                          )
                        }
                      />
                      <label className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={si.isRemovable}
                          onChange={() =>
                            setSelectedIngredients(
                              selectedIngredients.map((s) =>
                                s.ingredientId === si.ingredientId
                                  ? { ...s, isRemovable: !s.isRemovable }
                                  : s
                              )
                            )
                          }
                        />
                        Cikarilabilir
                      </label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeIngredient(si.ingredientId)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {selectedIngredients.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Henuz malzeme eklenmedi. Yukaridaki alandan arayarak ekleyebilirsiniz.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerjenler */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Alerjenler (EU 14)</CardTitle>
            <CardDescription>
              Urunde bulunan alerjenleri isaretleyin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {eu14Allergens.map((allergen) => (
                <label
                  key={allergen.id}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAllergens.has(allergen.id)
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedAllergens.has(allergen.id)}
                    onChange={() => toggleAllergen(allergen.id)}
                    className="rounded"
                  />
                  <span className="text-lg">{allergen.icon}</span>
                  <span className="text-xs font-medium">{allergen.name}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kaydet / Iptal */}
      <div className="flex items-center gap-3 sticky bottom-0 bg-background py-4 border-t -mx-6 px-6 lg:-mx-8 lg:px-8">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Kaydet
        </Button>
        <Link href="/admin/products">
          <Button variant="outline">Iptal</Button>
        </Link>
      </div>
    </div>
  );
}
