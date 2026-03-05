import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface FieldConfig {
  key: string;
  label: string;
  required: boolean;
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

const DEFAULT_CLIENT_FIELDS: FieldConfig[] = [
  { key: "name", label: "ФИО", required: true },
  { key: "phone", label: "Телефон", required: true },
  { key: "email", label: "Email", required: false },
  { key: "address", label: "Адрес", required: false },
  { key: "notes", label: "Примечания", required: false },
];

const DEFAULT_CAR_FIELDS: FieldConfig[] = [
  { key: "brand", label: "Марка", required: true },
  { key: "model", label: "Модель", required: true },
  { key: "year", label: "Год выпуска", required: false },
  { key: "vin", label: "VIN", required: false },
  { key: "license_plate", label: "Гос. номер", required: false },
  { key: "color", label: "Цвет", required: false },
  { key: "mileage", label: "Пробег", required: false },
];

const FieldList = ({
  fields,
  onToggle,
}: {
  fields: FieldConfig[];
  onToggle: (key: string) => void;
}) => (
  <div className="bg-white rounded-xl border border-border divide-y divide-border">
    {fields.map((f) => (
      <div key={f.key} className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <Icon name="GripVertical" size={16} className="text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium text-foreground">{f.label}</p>
            <p className="text-xs text-muted-foreground">Поле: {f.key}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Обязательное</span>
          <Switch checked={f.required} onCheckedChange={() => onToggle(f.key)} />
        </div>
      </div>
    ))}
  </div>
);

export const ClientsTab = () => {
  const [fields, setFields] = useState<FieldConfig[]>(() =>
    loadJson("settings_client_fields", DEFAULT_CLIENT_FIELDS)
  );

  const toggle = (key: string) => {
    const next = fields.map((f) => (f.key === key ? { ...f, required: !f.required } : f));
    setFields(next);
    saveJson("settings_client_fields", next);
    toast.success("Настройки клиентов сохранены");
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Настройки базы клиентов</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Управляйте обязательными полями при создании клиента
        </p>
      </div>
      <FieldList fields={fields} onToggle={toggle} />
    </div>
  );
};

export const CarsTab = () => {
  const [fields, setFields] = useState<FieldConfig[]>(() =>
    loadJson("settings_car_fields", DEFAULT_CAR_FIELDS)
  );

  const toggle = (key: string) => {
    const next = fields.map((f) => (f.key === key ? { ...f, required: !f.required } : f));
    setFields(next);
    saveJson("settings_car_fields", next);
    toast.success("Настройки автомобилей сохранены");
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Настройки базы автомобилей</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Управляйте обязательными полями при добавлении автомобиля
        </p>
      </div>
      <FieldList fields={fields} onToggle={toggle} />
    </div>
  );
};
