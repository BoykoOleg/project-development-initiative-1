import { useMemo, useId, useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { BRAND_LIST, getModels } from "@/lib/car-catalog";
import Icon from "@/components/ui/icon";

interface CarFieldsProps {
  brand: string;
  model: string;
  year: string;
  vin: string;
  licensePlate?: string;
  onBrandChange: (v: string) => void;
  onModelChange: (v: string) => void;
  onYearChange: (v: string) => void;
  onVinChange: (v: string) => void;
  onLicensePlateChange?: (v: string) => void;
  showVin?: boolean;
}

interface ComboInputProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  label: string;
  required?: boolean;
}

const ComboInput = ({ value, onChange, options, placeholder, label, required }: ComboInputProps) => {
  const listId = useId();

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">
        {label} {required && "*"}
      </label>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={listId}
        autoComplete="off"
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </div>
  );
};

async function decodeVin(vin: string): Promise<{ brand: string; model: string; year: string } | null> {
  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results: { Variable: string; Value: string | null }[] = data.Results || [];
    const get = (name: string) =>
      results.find((r) => r.Variable === name)?.Value?.trim() || "";

    const make = get("Make");
    const model = get("Model");
    const year = get("Model Year");

    if (!make && !model) return null;

    const capitalize = (s: string) =>
      s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

    return {
      brand: capitalize(make),
      model: capitalize(model),
      year,
    };
  } catch {
    return null;
  }
}

const CarFields = ({
  brand, model, year, vin, licensePlate = "",
  onBrandChange, onModelChange, onYearChange, onVinChange, onLicensePlateChange,
  showVin = true,
}: CarFieldsProps) => {
  const models = useMemo(() => getModels(brand), [brand]);
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState(false);
  const [vinSuccess, setVinSuccess] = useState(false);
  const lastDecodedVin = useRef("");

  useEffect(() => {
    const trimmed = vin.trim();
    if (trimmed.length !== 17 || trimmed === lastDecodedVin.current) return;

    lastDecodedVin.current = trimmed;
    setVinError(false);
    setVinSuccess(false);
    setVinLoading(true);

    decodeVin(trimmed).then((result) => {
      setVinLoading(false);
      if (result) {
        if (result.brand) onBrandChange(result.brand);
        if (result.model) onModelChange(result.model);
        if (result.year) onYearChange(result.year);
        setVinSuccess(true);
        setTimeout(() => setVinSuccess(false), 3000);
      } else {
        setVinError(true);
        setTimeout(() => setVinError(false), 3000);
      }
    });
  }, [vin]);

  return (
    <div className="space-y-2 p-3 sm:p-4 bg-muted/30 rounded-lg border border-border">
      <div className="text-sm font-medium text-foreground flex items-center gap-2">
        <Icon name="Car" size={16} className="text-muted-foreground" />
        Автомобиль
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <ComboInput
          label="Марка"
          placeholder="Начните вводить..."
          value={brand}
          onChange={onBrandChange}
          options={BRAND_LIST}
          required
        />
        <ComboInput
          label="Модель"
          placeholder={brand ? "Выберите модель..." : "Сначала марку"}
          value={model}
          onChange={onModelChange}
          options={models}
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Год выпуска</label>
          <Input placeholder="2020" value={year} onChange={(e) => onYearChange(e.target.value)} maxLength={4} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Гос. номер</label>
          <Input
            placeholder="С507УА124"
            className="font-mono uppercase"
            value={licensePlate}
            onChange={(e) => onLicensePlateChange?.(e.target.value.toUpperCase())}
            maxLength={20}
          />
        </div>
      </div>
      {showVin && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            VIN
            {vinLoading && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground font-normal">
                <Icon name="Loader2" size={12} className="animate-spin" />
                Определяю авто...
              </span>
            )}
            {vinSuccess && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-normal">
                <Icon name="CheckCircle" size={12} />
                Авто определён
              </span>
            )}
            {vinError && (
              <span className="flex items-center gap-1 text-xs text-amber-600 font-normal">
                <Icon name="AlertCircle" size={12} />
                Не удалось определить
              </span>
            )}
          </label>
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
  );
};

export default CarFields;
