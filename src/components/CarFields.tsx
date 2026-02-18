import { useState, useMemo, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { BRAND_LIST, getModels } from "@/lib/car-catalog";
import Icon from "@/components/ui/icon";

interface CarFieldsProps {
  brand: string;
  model: string;
  year: string;
  vin: string;
  onBrandChange: (v: string) => void;
  onModelChange: (v: string) => void;
  onYearChange: (v: string) => void;
  onVinChange: (v: string) => void;
  showVin?: boolean;
}

interface AutocompleteProps {
  value: string;
  onChange: (v: string) => void;
  onSelect: (v: string) => void;
  options: string[];
  placeholder: string;
  label: string;
  required?: boolean;
}

const Autocomplete = ({ value, onChange, onSelect, options, placeholder, label, required }: AutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  const filtered = useMemo(() => {
    if (!value.trim()) return options.slice(0, 50);
    const q = value.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q)).slice(0, 50);
  }, [value, options]);

  const handleSelect = useCallback((item: string) => {
    closingRef.current = true;
    onSelect(item);
    setOpen(false);
    setHighlightIndex(-1);
    setTimeout(() => { closingRef.current = false; }, 100);
  }, [onSelect]);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (closingRef.current) return;
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        setOpen(false);
        setHighlightIndex(-1);
      }
    }, 150);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(filtered[highlightIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlightIndex(-1);
    }
  }, [open, filtered, highlightIndex, handleSelect]);

  return (
    <div className="space-y-2 relative" ref={containerRef} onBlur={handleBlur}>
      <label className="text-sm font-medium text-foreground">
        {label} {required && "*"}
      </label>
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            onClick={() => {
              onChange("");
              setOpen(true);
              inputRef.current?.focus();
            }}
          >
            <Icon name="X" size={14} />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-[100] top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {filtered.map((item, index) => (
            <div
              key={item}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                index === highlightIndex
                  ? "bg-blue-50 text-blue-700"
                  : "hover:bg-muted/50 text-foreground"
              } ${item === value ? "font-medium text-blue-600" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => handleSelect(item)}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CarFields = ({
  brand, model, year, vin,
  onBrandChange, onModelChange, onYearChange, onVinChange,
  showVin = true,
}: CarFieldsProps) => {
  const models = useMemo(() => getModels(brand), [brand]);

  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
      <div className="text-sm font-medium text-foreground flex items-center gap-2">
        <Icon name="Car" size={16} className="text-muted-foreground" />
        Автомобиль
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Autocomplete
          label="Марка"
          placeholder="Начните вводить..."
          value={brand}
          onChange={(v) => {
            onBrandChange(v);
          }}
          onSelect={(v) => {
            onBrandChange(v);
            if (v !== brand) onModelChange("");
          }}
          options={BRAND_LIST}
          required
        />
        <Autocomplete
          label="Модель"
          placeholder={brand ? "Выберите модель..." : "Сначала марку"}
          value={model}
          onChange={onModelChange}
          onSelect={onModelChange}
          options={models}
          required
        />
      </div>
      <div className={`grid ${showVin ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Год выпуска</label>
          <Input placeholder="2020" value={year} onChange={(e) => onYearChange(e.target.value)} maxLength={4} />
        </div>
        {showVin && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">VIN</label>
            <Input
              placeholder="JTDKN3DU5A0000001"
              className="font-mono"
              value={vin}
              onChange={(e) => onVinChange(e.target.value.toUpperCase())}
              maxLength={17}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CarFields;