import { useState, useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { BRAND_LIST, getModels } from "@/lib/car-catalog";

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
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!value.trim()) return options.slice(0, 30);
    const q = value.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q)).slice(0, 30);
  }, [value, options]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="space-y-2 relative" ref={ref}>
      <label className="text-sm font-medium text-foreground">
        {label} {required && "*"}
      </label>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((item) => (
            <div
              key={item}
              className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(item);
                setOpen(false);
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

  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
      <div className="text-sm font-medium text-foreground flex items-center gap-2">
        Автомобиль
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Autocomplete
          label="Марка"
          placeholder="Toyota"
          value={brand}
          onChange={(v) => {
            onBrandChange(v);
            if (v !== brand) onModelChange("");
          }}
          options={BRAND_LIST}
          required
        />
        <Autocomplete
          label="Модель"
          placeholder="Camry"
          value={model}
          onChange={onModelChange}
          options={models.length > 0 ? models : []}
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