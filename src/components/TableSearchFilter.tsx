import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'date' | 'daterange' | 'multiselect' | 'number';
  options?: { value: string; label: string; }[];
}

interface TableSearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  activeFilters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
}

export const TableSearchFilter: React.FC<TableSearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  activeFilters,
  onFilterChange,
  onClearFilters
}) => {
  const hasActiveFilters = Object.values(activeFilters).some(value => 
    value !== undefined && value !== null && value !== "" && 
    (Array.isArray(value) ? value.length > 0 : true)
  );

  const renderFilter = (filter: FilterConfig) => {
    const value = activeFilters[filter.key];

    switch (filter.type) {
      case 'select':
        return (
          <div key={filter.key} className="space-y-2">
            <Label>{filter.label}</Label>
            <Select value={value || ""} onValueChange={(val) => onFilterChange(filter.key, val === "all" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder={`All ${filter.label}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'multiselect':
        return (
          <div key={filter.key} className="space-y-2">
            <Label>{filter.label}</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {filter.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${filter.key}-${option.value}`}
                    checked={Array.isArray(value) ? value.includes(option.value) : false}
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (checked) {
                        onFilterChange(filter.key, [...currentValues, option.value]);
                      } else {
                        onFilterChange(filter.key, currentValues.filter(v => v !== option.value));
                      }
                    }}
                  />
                  <Label htmlFor={`${filter.key}-${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'date':
        return (
          <div key={filter.key} className="space-y-2">
            <Label>{filter.label}</Label>
            <Input
              type="date"
              value={value || ""}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
            />
          </div>
        );

      case 'daterange':
        const currentValue = value || {};
        return (
          <div key={filter.key} className="space-y-2">
            <Label>{filter.label}</Label>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Start Date</Label>
                <Input
                  type="date"
                  value={currentValue.start || ""}
                  onChange={(e) => onFilterChange(filter.key, { ...currentValue, start: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">End Date</Label>
                <Input
                  type="date"
                  value={currentValue.end || ""}
                  onChange={(e) => onFilterChange(filter.key, { ...currentValue, end: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 'number':
        return (
          <div key={filter.key} className="space-y-2">
            <Label>{filter.label}</Label>
            <Input
              type="number"
              value={value || ""}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
              placeholder={`Filter by ${filter.label.toLowerCase()}`}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="search-filter-container">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-10 bg-background border-border"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {filters.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2 h-10 border-border hover:bg-muted/50"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full ml-1">
                      {Object.values(activeFilters).filter(v => 
                        v !== undefined && v !== null && v !== "" && 
                        (Array.isArray(v) ? v.length > 0 : true)
                      ).length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 max-h-96 overflow-y-auto bg-card border border-border shadow-large" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">Filters</h4>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        className="h-8 px-2 text-muted-foreground hover:text-foreground gap-1"
                      >
                        <X className="w-3 h-3" />
                        Clear All
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {filters.map((filter) => renderFilter(filter))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-10 px-3 text-muted-foreground hover:text-foreground gap-1"
            >
              <X className="w-4 h-4" />
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};