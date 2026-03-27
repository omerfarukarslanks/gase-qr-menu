"use client";

import { useState } from "react";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Pencil,
  Trash2,
  X,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  productCount: number;
  parentId: string | null;
  children: Category[];
}

const mockCategories: Category[] = [
  {
    id: "1",
    name: "Ana Yemekler",
    description: "Sicak ana yemek cesitleri",
    imageUrl: "",
    isActive: true,
    productCount: 12,
    parentId: null,
    children: [
      {
        id: "1-1",
        name: "Izgara",
        description: "Izgara et cesitleri",
        imageUrl: "",
        isActive: true,
        productCount: 6,
        parentId: "1",
        children: [],
      },
      {
        id: "1-2",
        name: "Kebaplar",
        description: "Geleneksel kebap cesitleri",
        imageUrl: "",
        isActive: true,
        productCount: 4,
        parentId: "1",
        children: [],
      },
      {
        id: "1-3",
        name: "Tavuk",
        description: "Tavuk yemekleri",
        imageUrl: "",
        isActive: false,
        productCount: 2,
        parentId: "1",
        children: [],
      },
    ],
  },
  {
    id: "2",
    name: "Baslangiclar",
    description: "Meze ve baslangic cesitleri",
    imageUrl: "",
    isActive: true,
    productCount: 8,
    parentId: null,
    children: [
      {
        id: "2-1",
        name: "Soguk Mezeler",
        description: "Soguk meze tabagi",
        imageUrl: "",
        isActive: true,
        productCount: 5,
        parentId: "2",
        children: [],
      },
      {
        id: "2-2",
        name: "Sicak Mezeler",
        description: "Sicak baslangiclar",
        imageUrl: "",
        isActive: true,
        productCount: 3,
        parentId: "2",
        children: [],
      },
    ],
  },
  {
    id: "3",
    name: "Salatalar",
    description: "Taze salata cesitleri",
    imageUrl: "",
    isActive: true,
    productCount: 5,
    parentId: null,
    children: [],
  },
  {
    id: "4",
    name: "Icecekler",
    description: "Sicak ve soguk icecekler",
    imageUrl: "",
    isActive: true,
    productCount: 15,
    parentId: null,
    children: [
      {
        id: "4-1",
        name: "Soguk Icecekler",
        description: "Mevsimsel icecekler",
        imageUrl: "",
        isActive: true,
        productCount: 8,
        parentId: "4",
        children: [],
      },
      {
        id: "4-2",
        name: "Sicak Icecekler",
        description: "Cay, kahve cesitleri",
        imageUrl: "",
        isActive: true,
        productCount: 7,
        parentId: "4",
        children: [],
      },
    ],
  },
  {
    id: "5",
    name: "Tatlilar",
    description: "Tatli ve pasta cesitleri",
    imageUrl: "",
    isActive: true,
    productCount: 6,
    parentId: null,
    children: [],
  },
];

interface CategoryFormData {
  name: string;
  parentId: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

const emptyForm: CategoryFormData = {
  name: "",
  parentId: "",
  description: "",
  imageUrl: "",
  isActive: true,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(["1", "2", "4"])
  );
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(emptyForm);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name,
      parentId: cat.parentId || "",
      description: cat.description,
      imageUrl: cat.imageUrl,
      isActive: cat.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    const removeCategory = (cats: Category[]): Category[] =>
      cats
        .filter((c) => c.id !== id)
        .map((c) => ({ ...c, children: removeCategory(c.children) }));
    setCategories(removeCategory(categories));
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (editingId) {
      const updateCategory = (cats: Category[]): Category[] =>
        cats.map((c) => {
          if (c.id === editingId) {
            return {
              ...c,
              name: formData.name,
              description: formData.description,
              imageUrl: formData.imageUrl,
              isActive: formData.isActive,
            };
          }
          return { ...c, children: updateCategory(c.children) };
        });
      setCategories(updateCategory(categories));
    } else {
      const newCat: Category = {
        id: `new-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        imageUrl: formData.imageUrl,
        isActive: formData.isActive,
        productCount: 0,
        parentId: formData.parentId || null,
        children: [],
      };

      if (formData.parentId) {
        const addToParent = (cats: Category[]): Category[] =>
          cats.map((c) => {
            if (c.id === formData.parentId) {
              return { ...c, children: [...c.children, newCat] };
            }
            return { ...c, children: addToParent(c.children) };
          });
        setCategories(addToParent(categories));
      } else {
        setCategories([...categories, newCat]);
      }
    }

    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const getAllParentOptions = (
    cats: Category[],
    excludeId?: string | null
  ): { id: string; name: string; depth: number }[] => {
    const result: { id: string; name: string; depth: number }[] = [];
    const traverse = (items: Category[], depth: number) => {
      for (const c of items) {
        if (c.id !== excludeId) {
          result.push({ id: c.id, name: c.name, depth });
          traverse(c.children, depth + 1);
        }
      }
    };
    traverse(cats, 0);
    return result;
  };

  const renderCategory = (cat: Category, depth: number) => {
    const isExpanded = expandedIds.has(cat.id);
    const hasChildren = cat.children.length > 0;

    return (
      <div key={cat.id}>
        <div
          className={`flex items-center gap-2 px-4 py-3 border-b hover:bg-muted/50 transition-colors ${
            depth > 0 ? "bg-muted/20" : ""
          }`}
          style={{ paddingLeft: `${depth * 32 + 16}px` }}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab flex-shrink-0" />

          {hasChildren ? (
            <button
              onClick={() => toggleExpand(cat.id)}
              className="p-0.5 hover:bg-muted rounded flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-5 flex-shrink-0" />
          )}

          {depth > 0 && (
            <div className="flex items-center flex-shrink-0">
              <div className="w-4 border-l-2 border-b-2 border-muted-foreground/30 h-4 -mt-2 mr-1" />
            </div>
          )}

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm">{cat.name}</span>
            {cat.description && (
              <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
                {cat.description}
              </span>
            )}
          </div>

          <span className="text-xs text-muted-foreground flex-shrink-0">
            {cat.productCount} urun
          </span>

          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0 ${
              cat.isActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {cat.isActive ? "Aktif" : "Pasif"}
          </span>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEdit(cat)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleDelete(cat.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {cat.children.map((child) => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kategoriler</h1>
          <p className="text-muted-foreground">
            Menu kategorilerini yonetin. Siralama ve alt kategoriler belirleyin.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Kategori Ekle
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {editingId ? "Kategori Duzenle" : "Yeni Kategori Ekle"}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Kategori Adi (TR)</label>
                <Input
                  placeholder="ornek: Ana Yemekler"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ust Kategori</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.parentId}
                  onChange={(e) =>
                    setFormData({ ...formData, parentId: e.target.value })
                  }
                >
                  <option value="">Ust kategori yok (Ana kategori)</option>
                  {getAllParentOptions(categories, editingId).map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {"—".repeat(opt.depth)} {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Aciklama</label>
                <Input
                  placeholder="Kategori aciklamasi"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Gorsel URL</label>
                <Input
                  placeholder="https://ornek.com/gorsel.jpg"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <label className="text-sm font-medium">Aktif</label>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isActive ? "bg-primary" : "bg-gray-300"
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, isActive: !formData.isActive })
                  }
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={handleSave}>
                {editingId ? "Guncelle" : "Kaydet"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                Iptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Kategori Listesi</CardTitle>
          <CardDescription>
            Surukle-birak ile siralama yapabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            {categories.map((cat) => renderCategory(cat, 0))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
