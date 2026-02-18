import { useState, useMemo, useRef, useCallback, useEffect } from "react";
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
  options: string[];
  placeholder: string;
  label: string;
  required?: boolean;
}

const Autocomplete = ({ value, onChange, options, placeholder, label, required }: AutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const skipBlurRef = useRef(false);

  const filtered = useMemo(() => {
    if (!value.trim()) return options.slice(0, 50);
    const q = value.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q)).slice(0, 50);
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  const pickItem = useCallback((item: string) => {
    skipBlurRef.current = true;
    onChange(item);
    setOpen(false);
    requestAnimationFrame(() => { skipBlurRef.current = false; });
  }, [onChange]);

  return (
    <div className="space-y-2 relative" ref={wrapperRef}>
      <label className="text-sm font-medium text-foreground">
        {label} {required && "*"}
      </label>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            onPointerDown={(e) => {
              e.preventDefault();
              onChange("");
              setOpen(true);
            }}
          >
            <Icon name="X" size={14} />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-[100] top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((item) => (
            <div
              key={item}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-blue-50 ${
                item === value ? "bg-blue-50 font-medium text-blue-600" : "text-foreground"
              }`}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                pickItem(item);
              }}
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

  const handleBrandChange = useCallback((v: string) => {
    onBrandChange(v);
    if (v !== brand) onModelChange("");
  }, [brand, onBrandChange, onModelChange]);

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
          onChange={handleBrandChange}
          options={BRAND_LIST}
          required
        />
        <Autocomplete
          label="Модель"
          placeholder={brand ? "Выберите модель..." : "Сначала марку"}
          value={model}
          onChange={onModelChange}
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