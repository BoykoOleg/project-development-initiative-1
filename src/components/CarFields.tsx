import { useMemo, useId } from "react";
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

const CarFields = ({
  brand, model, year, vin,
  onBrandChange, onModelChange, onYearChange, onVinChange,
  showVin = true,
}: CarFieldsProps) => {
  const models = useMemo(() => getModels(brand), [brand]);

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
      <div className={`grid grid-cols-1 ${showVin ? "sm:grid-cols-2" : ""} gap-2 sm:gap-3`}>
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Год выпуска</label>
          <Input placeholder="2020" value={year} onChange={(e) => onYearChange(e.target.value)} maxLength={4} />
        </div>
        {showVin && (
          <div className="space-y-1">
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