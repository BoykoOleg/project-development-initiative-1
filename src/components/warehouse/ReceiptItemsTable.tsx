import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product } from "@/components/warehouse/WarehouseProductsTab";

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

export interface ReceiptItem {
  product_id: number;
  quantity: number;
  price: number;
  _aiName?: string;
  _matched?: boolean;
}

interface ProductSearchProps {
  value: number;
  products: Product[];
  onChange: (productId: number, price: number) => void;
}

const ProductSearch = ({ value, products, onChange }: ProductSearchProps) => {
  const selected = products.find((p) => p.id === value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim().length === 0
    ? products.filter((p) => p.is_active)
    : products.filter((p) => p.is_active && (
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase())
      ));

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSelect = (p: Product) => {
    onChange(p.id, Number(p.purchase_price));
    setOpen(false);
    setQuery("");
  };

  const dropdown = open && rect ? (
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      }}
      className="bg-white border border-border rounded-lg shadow-xl"
    >
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию или артикулу..."
            className="w-full h-8 pl-8 pr-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>
      <div className="max-h-52 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">Ничего не найдено</div>
        ) : (
          filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(p); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/40 flex items-center justify-between gap-2 ${p.id === value ? "bg-muted/30 font-medium" : ""}`}
            >
              <span className="truncate">{p.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">{p.sku}</span>
            </button>
          ))
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="w-full h-8 px-2.5 text-sm text-left border border-input rounded-md bg-background hover:bg-muted/30 flex items-center justify-between gap-1"
      >
        <span className={`truncate ${selected ? "text-foreground" : "text-muted-foreground"}`}>
          {selected ? `${selected.sku} — ${selected.name}` : "Выберите товар"}
        </span>
        <Icon name="ChevronsUpDown" size={14} className="text-muted-foreground shrink-0" />
      </button>
      {createPortal(dropdown, document.body)}
    </>
  );
};

interface Props {
  items: ReceiptItem[];
  products: Product[];
  aiPreview: string | null;
  receiptTotal: number;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onUpdate: (idx: number, field: keyof ReceiptItem, value: number) => void;
  onSetItems: React.Dispatch<React.SetStateAction<ReceiptItem[]>>;
  onPhotoClick: () => void;
  aiLoading: boolean;
}

const ReceiptItemsTable = ({
  items,
  products,
  aiPreview,
  receiptTotal,
  onAdd,
  onRemove,
  onUpdate,
  onSetItems,
  onPhotoClick,
  aiLoading,
}: Props) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Товары</label>
        <div className="flex items-center gap-2">
          {!aiPreview && (
            <Button variant="outline" size="sm" className="text-green-700 border-green-200 hover:bg-green-50" onClick={onPhotoClick} disabled={aiLoading}>
              <Icon name="ScanLine" size={14} className="mr-1" />
              Фото документа
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onAdd}>
            <Icon name="Plus" size={14} className="mr-1" />
            Добавить строку
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Товар</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2 w-20">Кол-во</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2 w-28">Цена</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2 w-28">Сумма</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className={`border-b border-border last:border-0 ${item._aiName && !item._matched ? "bg-amber-50" : ""}`}>
                <td className="px-3 py-2">
                  {item._aiName && !item._matched && (
                    <div className="text-[10px] text-amber-600 mb-1 flex items-center gap-1">
                      <Icon name="AlertCircle" size={10} />
                      ИИ: «{item._aiName}» — не найдено в номенклатуре
                    </div>
                  )}
                  {item._aiName && item._matched && (
                    <div className="text-[10px] text-green-600 mb-1 flex items-center gap-1">
                      <Icon name="PackageCheck" size={10} />
                      ИИ: «{item._aiName}»
                    </div>
                  )}
                  <ProductSearch
                    value={item.product_id}
                    products={products}
                    onChange={(pid, price) => {
                      onSetItems((prev) => prev.map((it, i) => i === idx ? {
                        ...it,
                        product_id: pid,
                        price: it.price > 0 ? it.price : price,
                        _matched: true,
                      } : it));
                    }}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input type="number" className="h-8 text-sm text-right" value={item.quantity || ""} onChange={(e) => onUpdate(idx, "quantity", Number(e.target.value))} />
                </td>
                <td className="px-3 py-2">
                  <Input type="number" className="h-8 text-sm text-right" value={item.price || ""} onChange={(e) => onUpdate(idx, "price", Number(e.target.value))} />
                </td>
                <td className="px-3 py-2 text-right text-sm font-medium">
                  {fmt(item.quantity * item.price)}
                </td>
                <td className="px-1 py-2">
                  {items.length > 1 && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onRemove(idx)}>
                      <Icon name="X" size={14} className="text-red-400" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="bg-green-50 rounded-lg px-4 py-2">
          <span className="text-sm text-muted-foreground mr-2">Итого:</span>
          <span className="text-lg font-bold text-green-600">{fmt(receiptTotal)}</span>
        </div>
      </div>
    </div>
  );
};

export default ReceiptItemsTable;