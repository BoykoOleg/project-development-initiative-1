import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";
import { PartItem } from "./types";

interface Product {
  id: number;
  sku: string;
  name: string;
  purchase_price: number;
  quantity: number;
  reserved_qty: number;
  unit: string;
}

interface TransferItem {
  product_id: number;
  product_name: string;
  sku: string;
  unit: string;
  qty: number;
  max_qty: number;
  price: number;
}

interface TransferDialogProps {
  open: boolean;
  onClose: () => void;
  workOrderId: number;
  workOrderNumber: string;
  parts: PartItem[];
  products: Product[];
  direction: "to_order" | "to_stock";
  onConfirmed: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

export default function TransferDialog({
  open,
  onClose,
  workOrderId,
  workOrderNumber,
  parts,
  products,
  direction,
  onConfirmed,
}: TransferDialogProps) {
  const [items, setItems] = useState<TransferItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNotes("");

    if (direction === "to_order") {
      // Склад → ЗН: предлагаем все запчасти из ЗН, которые привязаны к складу
      const suggested: TransferItem[] = [];
      for (const part of parts) {
        if (!part.product_id || part.out_of_stock) continue;
        const prod = products.find((p) => p.id === part.product_id);
        if (!prod) continue;
        const available = prod.quantity;
        const needed = part.qty;
        const transferred = part.transferred_qty ?? 0;
        const toTransfer = Math.max(0, needed - transferred);
        if (toTransfer <= 0) continue;
        suggested.push({
          product_id: prod.id,
          product_name: prod.name,
          sku: prod.sku,
          unit: prod.unit,
          qty: Math.min(toTransfer, available),
          max_qty: Math.min(toTransfer, available),
          price: prod.purchase_price,
        });
      }
      setItems(suggested);
    } else {
      // ЗН → Склад (возврат): предлагаем всё что было перемещено в ЗН
      const suggested: TransferItem[] = [];
      for (const part of parts) {
        if (!part.product_id || part.out_of_stock) continue;
        const prod = products.find((p) => p.id === part.product_id);
        if (!prod) continue;
        const transferred = part.transferred_qty ?? 0;
        if (transferred <= 0) continue;
        suggested.push({
          product_id: prod.id,
          product_name: prod.name,
          sku: prod.sku,
          unit: prod.unit,
          qty: transferred,
          max_qty: transferred,
          price: prod.purchase_price,
        });
      }
      setItems(suggested);
    }
  }, [open, direction, parts, products]);

  const updateQty = (idx: number, val: number) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, qty: Math.max(0, Math.min(val, it.max_qty)) } : it
      )
    );
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const validItems = items.filter((i) => i.qty > 0);

  const handleConfirm = async () => {
    if (validItems.length === 0) {
      toast.error("Нет позиций для перемещения");
      return;
    }
    setLoading(true);
    try {
      const url = getApiUrl("warehouse");
      if (!url) return;

      // 1. Создаём документ
      const createRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_transfer",
          work_order_id: workOrderId,
          direction,
          notes,
          items: validItems.map((i) => ({ product_id: i.product_id, qty: i.qty })),
        }),
      });
      const createData = await createRes.json();
      if (createData.error) { toast.error(createData.error); return; }

      const transferId = createData.transfer?.id;
      if (!transferId) { toast.error("Ошибка создания документа"); return; }

      // 2. Подтверждаем
      const confirmRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm_transfer", transfer_id: transferId }),
      });
      const confirmData = await confirmRes.json();
      if (confirmData.error) { toast.error(confirmData.error); return; }

      toast.success(
        direction === "to_order"
          ? "Товары перемещены на заказ-наряд"
          : "Товары возвращены на склад"
      );
      onConfirmed();
      onClose();
    } catch {
      toast.error("Ошибка при перемещении");
    } finally {
      setLoading(false);
    }
  };

  const dirLabel = direction === "to_order" ? "Склад → Заказ-наряд" : "Заказ-наряд → Склад";

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="ArrowLeftRight" size={18} className="text-blue-500" />
            Перемещение: {dirLabel}
          </DialogTitle>
          <div className="text-xs text-muted-foreground">{workOrderNumber}</div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {items.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {direction === "to_order"
                ? "Все товары уже перемещены в заказ-наряд"
                : "Нет товаров для возврата на склад"}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground mb-1">Позиции перемещения:</div>
              {items.map((item, idx) => (
                <div key={item.product_id} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{item.product_name}</div>
                    <div className="text-xs text-muted-foreground">{item.sku} · {fmt(item.price)}/шт</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Input
                      type="number"
                      min={0}
                      max={item.max_qty}
                      step={1}
                      value={item.qty}
                      onChange={(e) => updateQty(idx, Number(e.target.value))}
                      className="w-16 h-7 text-xs text-center px-1"
                    />
                    <span className="text-xs text-muted-foreground w-6">{item.unit}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                      onClick={() => removeItem(idx)}
                    >
                      <Icon name="X" size={14} />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-1 px-1 text-sm font-semibold">
                <span className="text-muted-foreground">Итого:</span>
                <span>{fmt(total)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Примечание</label>
            <Input
              placeholder="Необязательно..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Отмена
            </Button>
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={handleConfirm}
              disabled={loading || validItems.length === 0}
            >
              {loading ? (
                <Icon name="Loader2" size={16} className="mr-1.5 animate-spin" />
              ) : (
                <Icon name="Check" size={16} className="mr-1.5" />
              )}
              Подтвердить перемещение
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
