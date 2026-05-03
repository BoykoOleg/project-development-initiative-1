import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
                  <Select
                    value={String(item.product_id || "")}
                    onValueChange={(v) => {
                      const pid = Number(v);
                      const prod = products.find((p) => p.id === pid);
                      onSetItems((prev) => prev.map((it, i) => i === idx ? {
                        ...it,
                        product_id: pid,
                        price: prod ? Number(prod.purchase_price) : it.price,
                        _matched: true,
                      } : it));
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Выберите товар" /></SelectTrigger>
                    <SelectContent>
                      {products.filter((p) => p.is_active).map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.sku} — {p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
