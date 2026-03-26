"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function FilterBar({ searchQuery, onSearchChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 px-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Urun ara..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
      </div>
      <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0">
        <SlidersHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}
