"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EU_ALLERGENS = [
  { code: "gluten", label: "Gluten" },
  { code: "milk", label: "Süt" },
  { code: "eggs", label: "Yumurta" },
  { code: "peanuts", label: "Fıstık" },
  { code: "nuts", label: "Kabuklu Yemiş" },
  { code: "soy", label: "Soya" },
  { code: "fish", label: "Balık" },
  { code: "shellfish", label: "Kabuklu Deniz Ürünleri" },
  { code: "celery", label: "Kereviz" },
  { code: "mustard", label: "Hardal" },
  { code: "sesame", label: "Susam" },
  { code: "sulphites", label: "Sülfitler" },
  { code: "lupin", label: "Acı Bakla" },
  { code: "molluscs", label: "Yumuşakçalar" },
];

export { EU_ALLERGENS };

export interface MenuFilterValues {
  search: string;
  minPrice?: number;
  maxPrice?: number;
  excludeAllergens: string[];
}

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters?: MenuFilterValues;
  onFilterChange?: (filters: MenuFilterValues) => void;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
}: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [minPrice, setMinPrice] = useState<string>(
    filters?.minPrice?.toString() ?? ""
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    filters?.maxPrice?.toString() ?? ""
  );
  const [excludeAllergens, setExcludeAllergens] = useState<string[]>(
    filters?.excludeAllergens ?? []
  );

  const activeFilterCount =
    (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + excludeAllergens.length;

  const emitChange = (min: string, max: string, allergens: string[]) => {
    onFilterChange?.({
      search: searchQuery,
      minPrice: min ? parseFloat(min) : undefined,
      maxPrice: max ? parseFloat(max) : undefined,
      excludeAllergens: allergens,
    });
  };

  const toggleAllergen = (code: string) => {
    const updated = excludeAllergens.includes(code)
      ? excludeAllergens.filter((allergen) => allergen !== code)
      : [...excludeAllergens, code];

    setExcludeAllergens(updated);
    emitChange(minPrice, maxPrice, updated);
  };

  const handleReset = () => {
    setMinPrice("");
    setMaxPrice("");
    setExcludeAllergens([]);
    onSearchChange("");
    onFilterChange?.({
      search: "",
      minPrice: undefined,
      maxPrice: undefined,
      excludeAllergens: [],
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Urun, lezzet veya kategori ara..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="bg-card pl-11 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Button
          variant={isOpen ? "default" : "outline"}
          size="sm"
          className="relative h-11 min-w-[124px] justify-center rounded-[1.1rem]"
          onClick={() => setIsOpen((value) => !value)}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filtreler
          {activeFilterCount > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-background/90 px-1.5 text-[10px] font-bold text-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {isOpen && (
        <div className="rounded-[1.5rem] border border-border bg-card p-4 shadow-[var(--card-shadow)]">
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Fiyat araligi</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Butcenize uygun urunleri hizlica ayiklayin.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_1fr]">
                <Input
                  type="number"
                  placeholder="Min ₺"
                  value={minPrice}
                  onChange={(event) => {
                    setMinPrice(event.target.value);
                    emitChange(event.target.value, maxPrice, excludeAllergens);
                  }}
                  min={0}
                  className="bg-muted"
                />
                <div className="hidden items-center justify-center text-sm text-muted-foreground sm:flex">
                  -
                </div>
                <Input
                  type="number"
                  placeholder="Max ₺"
                  value={maxPrice}
                  onChange={(event) => {
                    setMaxPrice(event.target.value);
                    emitChange(minPrice, event.target.value, excludeAllergens);
                  }}
                  min={0}
                  className="bg-muted"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Alerjenleri hariç tut
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Misafir deneyimini daha güvenli ve net hale getirin.
                  </p>
                </div>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-muted-foreground hover:text-foreground"
                    onClick={handleReset}
                  >
                    Temizle
                  </Button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {EU_ALLERGENS.map((allergen) => {
                  const isActive = excludeAllergens.includes(allergen.code);

                  return (
                    <button
                      key={allergen.code}
                      onClick={() => toggleAllergen(allergen.code)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-[var(--card-shadow)]"
                          : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                      )}
                    >
                      {isActive && <X className="mr-1 inline h-3 w-3" />}
                      {allergen.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
