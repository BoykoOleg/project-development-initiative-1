import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";

type EntityType = "clients" | "works" | "products";

interface EntityConfig {
  label: string;
  icon: string;
  description: string;
  columns: { key: string; label: string; required?: boolean }[];
  sampleRows: Record<string, string | number>[];
}

const ENTITIES: Record<EntityType, EntityConfig> = {
  clients: {
    label: "Клиенты",
    icon: "Users",
    description: "Загрузите список клиентов из Excel. Дубликаты (совпадение имени и телефона) будут пропущены.",
    columns: [
      { key: "name", label: "ФИО / Наименование", required: true },
      { key: "phone", label: "Телефон" },
      { key: "email", label: "Email" },
      { key: "comment", label: "Комментарий" },
    ],
    sampleRows: [
      { name: "Иванов Иван Иванович", phone: "79001234567", email: "ivan@mail.ru", comment: "" },
      { name: "ООО Ромашка", phone: "74951234567", email: "office@romashka.ru", comment: "юр. лицо" },
    ],
  },
  works: {
    label: "Работы",
    icon: "Wrench",
    description: "Загрузите каталог работ. Дубликаты по названию будут пропущены.",
    columns: [
      { key: "name", label: "Наименование работы", required: true },
      { key: "code", label: "Код работы" },
      { key: "norm_hours", label: "Нормо-часы" },
    ],
    sampleRows: [
      { name: "Замена масла двигателя", code: "ТО-001", norm_hours: 0.5 },
      { name: "Диагностика подвески", code: "ДИА-010", norm_hours: 1.0 },
    ],
  },
  products: {
    label: "Номенклатура",
    icon: "Package",
    description: "Загрузите список запчастей и товаров. Дубликаты по артикулу будут пропущены.",
    columns: [
      { key: "name", label: "Наименование", required: true },
      { key: "sku", label: "Артикул / SKU" },
      { key: "category", label: "Категория" },
      { key: "unit", label: "Единица (шт, л, м...)" },
      { key: "purchase_price", label: "Цена закупки" },
      { key: "selling_price", label: "Цена продажи" },
      { key: "min_quantity", label: "Мин. остаток" },
    ],
    sampleRows: [
      { name: "Масло моторное 5W-30 1л", sku: "OIL-5W30-1", category: "Масла", unit: "л", purchase_price: 850, selling_price: 1200, min_quantity: 5 },
      { name: "Фильтр масляный", sku: "FLT-OIL-001", category: "Фильтры", unit: "шт", purchase_price: 350, selling_price: 550, min_quantity: 10 },
    ],
  },
};

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

interface PreviewData {
  rows: Record<string, unknown>[];
  headers: string[];
}

export const ImportTab = () => {
  const [entity, setEntity] = useState<EntityType>("clients");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const cfg = ENTITIES[entity];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      setPreview({ rows, headers });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!preview) return;
    const url = getApiUrl("import-data");
    if (!url) { toast.error("Функция импорта недоступна"); return; }

    setLoading(true);
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, rows: preview.rows }),
      });
      const data: ImportResult = await resp.json();
      setResult(data);
      if (data.errors?.length === 0) {
        toast.success(`Импорт завершён: добавлено ${data.created}, пропущено ${data.skipped}`);
      } else {
        toast.warning(`Импорт с ошибками: добавлено ${data.created}`);
      }
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      toast.error("Ошибка при импорте");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSample = () => {
    const ws = XLSX.utils.json_to_sheet(cfg.sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, cfg.label);
    XLSX.writeFile(wb, `шаблон_${entity}.xlsx`);
  };

  const handleReset = () => {
    setPreview(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Импорт данных</h3>
        <p className="text-sm text-muted-foreground mt-1">Загрузите данные из Excel-файла (.xlsx, .xls) в систему</p>
      </div>

      {/* Entity selector */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.entries(ENTITIES) as [EntityType, EntityConfig][]).map(([key, c]) => (
          <button
            key={key}
            onClick={() => { setEntity(key); setPreview(null); setResult(null); if (fileRef.current) fileRef.current.value = ""; }}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${
              entity === key
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-border bg-white text-muted-foreground hover:border-blue-200 hover:bg-gray-50"
            }`}
          >
            <Icon name={c.icon} size={22} className={entity === key ? "text-blue-500" : ""} />
            {c.label}
          </button>
        ))}
      </div>

      {/* Info + sample */}
      <div className="bg-white rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{cfg.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {cfg.columns.map((col) => (
                <span
                  key={col.key}
                  className={`text-xs px-2 py-1 rounded-full ${col.required ? "bg-blue-100 text-blue-700 font-medium" : "bg-gray-100 text-muted-foreground"}`}
                >
                  {col.label}{col.required ? " *" : ""}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">* — обязательные поля</p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" onClick={handleDownloadSample}>
            <Icon name="Download" size={15} className="mr-1.5" />
            Шаблон
          </Button>
        </div>

        {/* Upload zone */}
        {!preview && !result && (
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="FileSpreadsheet" size={36} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">Нажмите чтобы выбрать файл</p>
            <p className="text-xs text-muted-foreground mt-1">Поддерживаются форматы .xlsx и .xls</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                Предпросмотр: <span className="text-blue-600">{preview.rows.length} строк</span>
              </p>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <Icon name="X" size={15} className="mr-1" />Сбросить
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    {preview.headers.map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preview.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      {preview.headers.map((h) => (
                        <td key={h} className="px-3 py-2 text-foreground max-w-[180px] truncate">{String(row[h] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.rows.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">...и ещё {preview.rows.length - 5} строк</p>
            )}

            <Button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              onClick={handleImport}
              disabled={loading}
            >
              {loading ? (
                <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Импортируем...</>
              ) : (
                <><Icon name="Upload" size={16} className="mr-2" />Импортировать {preview.rows.length} записей</>
              )}
            </Button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                <p className="text-2xl font-bold text-green-600">{result.created}</p>
                <p className="text-xs text-green-700 mt-1">Добавлено</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
                <p className="text-2xl font-bold text-amber-600">{result.skipped}</p>
                <p className="text-xs text-amber-700 mt-1">Пропущено (дубликаты)</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 rounded-xl border border-red-100 p-4 space-y-1">
                <p className="text-xs font-semibold text-red-700 mb-2">Ошибки ({result.errors.length}):</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-600">{e}</p>
                ))}
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={handleReset}>
              <Icon name="RotateCcw" size={15} className="mr-2" />
              Загрузить ещё
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};