import { useState, useRef } from "react";
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
  const [query, setQuery] = useState(selected ? `${selected.sku} — ${selected.name}` : "");
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestIdx, setSuggestIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestRef = useRef<HTMLDivElement>(null);
  const mouseDownOnSuggest = useRef(false);

  const suggestList = (() => {
    const q = query.trim();
    if (!q) return [];
    const ql = q.toLowerCase();
    const exact = products.filter((p) => p.is_active && (p.name.toLowerCase() === ql || p.sku.toLowerCase() === ql));
    if (exact.length === 1) return exact;
    return products.filter((p) => p.is_active && (
      p.name.toLowerCase().includes(ql) || p.sku.toLowerCase().includes(ql)
    )).slice(0, 8);
  })();

  const selectProduct = (prod: Product) => {
    onChange(prod.id, Number(prod.purchase_price));
    setQuery(`${prod.sku} — ${prod.name}`);
    setShowSuggest(false);
    setSuggestIdx(-1);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        placeholder="Начните вводить для поиска…"
        className={`h-8 text-sm ${value ? "border-green-400 bg-green-50" : ""}`}
        value={query}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(0, 0);
          setShowSuggest(true);
          setSuggestIdx(-1);
        }}
        onFocus={() => { setShowSuggest(true); setSuggestIdx(-1); }}
        onBlur={() => {
          if (mouseDownOnSuggest.current) { mouseDownOnSuggest.current = false; return; }
          setShowSuggest(false); setSuggestIdx(-1);
        }}
        onKeyDown={(e) => {
          if (showSuggest && suggestList.length > 0) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              const next = Math.min(suggestIdx + 1, suggestList.length - 1);
              setSuggestIdx(next);
              suggestRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              const prev = Math.max(suggestIdx - 1, -1);
              setSuggestIdx(prev);
              if (prev >= 0) suggestRef.current?.children[prev]?.scrollIntoView({ block: "nearest" });
              return;
            }
            if (e.key === "Tab" && suggestList.length === 1) {
              e.preventDefault();
              selectProduct(suggestList[0]);
              return;
            }
            if (e.key === "Enter") {
              const target = suggestIdx >= 0 ? suggestList[suggestIdx] : suggestList.length === 1 ? suggestList[0] : null;
              if (target) { e.preventDefault(); selectProduct(target); return; }
            }
          }
          if (e.key === "Escape") { setShowSuggest(false); setSuggestIdx(-1); }
        }}
      />
      {showSuggest && suggestList.length > 0 && createPortal(
        (() => {
          const rect = inputRef.current?.getBoundingClientRect();
          if (!rect) return null;
          return (
            <div
              ref={suggestRef}
              onMouseDown={(e) => e.preventDefault()}
              style={{ position: "fixed", top: rect.bottom + 2, left: rect.left, width: rect.width, zIndex: 9999 }}
              className="bg-white border border-border rounded-lg shadow-xl max-h-52 overflow-y-auto"
            >
              {suggestList.map((prod, idx) => (
                <div
                  key={prod.id}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer text-sm transition-colors ${idx === suggestIdx ? "bg-blue-50 text-blue-700" : "hover:bg-muted/40"}`}
                  onClick={() => selectProduct(prod)}
                  onMouseEnter={() => setSuggestIdx(idx)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs bg-muted px-1 rounded shrink-0">{prod.sku}</span>
                    <span className="truncate">{prod.name}</span>
                  </div>
                  <div className="text-xs shrink-0 ml-2 text-right">
                    <span className="text-muted-foreground">{prod.quantity} {prod.unit}</span>
                    {prod.purchase_price > 0 && <span className="text-blue-600 ml-1.5">{fmt(Number(prod.purchase_price))}</span>}
                  </div>
                </div>
              ))}
            </div>
          );
        })(),
        document.body
      )}
    </div>
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
                        price: pid > 0 && it.price === 0 ? price : it.price,
                        _matched: pid > 0,
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