"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    excludeAllergens.length;

  const toggleAllergen = (code: string) => {
    const updated = excludeAllergens.includes(code)
      ? excludeAllergens.filter((a) => a !== code)
      : [...excludeAllergens, code];
    setExcludeAllergens(updated);
    emitChange(minPrice, maxPrice, updated);
  };

  const emitChange = (min: string, max: string, allergens: string[]) => {
    onFilterChange?.({
      search: searchQuery,
      minPrice: min ? parseFloat(min) : undefined,
      maxPrice: max ? parseFloat(max) : undefined,
      excludeAllergens: allergens,
    });
  };

  const handleMinPriceChange = (val: string) => {
    setMinPrice(val);
    emitChange(val, maxPrice, excludeAllergens);
  };

  const handleMaxPriceChange = (val: string) => {
    setMaxPrice(val);
    emitChange(minPrice, val, excludeAllergens);
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
    <div className="space-y-2">
      {/* Search Row */}
      <div className="flex items-center gap-2 px-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Ürün ara..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 flex-shrink-0 relative"
          onClick={() => setIsOpen(!isOpen)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-1" />
          Filtreler
          {activeFilterCount > 0 && (
            <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Expandable Filter Panel */}
      {isOpen && (
        <div className="mx-4 rounded-lg border bg-card p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Price Range */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Fiyat Aralığı</h4>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min ₺"
                value={minPrice}
                onChange={(e) => handleMinPriceChange(e.target.value)}
                className="h-8 text-sm"
                min={0}
              />
              <span className="text-muted-foreground text-sm">-</span>
              <Input
                type="number"
                placeholder="Max ₺"
                value={maxPrice}
                onChange={(e) => handleMaxPriceChange(e.target.value)}
                className="h-8 text-sm"
                min={0}
              />
            </div>
          </div>

          {/* Allergen Exclusion */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Alerjen Hariç Tut</h4>
            <div className="flex flex-wrap gap-2">
              {EU_ALLERGENS.map((allergen) => {
                const isActive = excludeAllergens.includes(allergen.code);
                return (
                  <button
                    key={allergen.code}
                    onClick={() => toggleAllergen(allergen.code)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {isActive && <X className="inline h-3 w-3 mr-0.5" />}
                    {allergen.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset Button */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-destructive"
              onClick={handleReset}
            >
              Filtreleri Temizle
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
