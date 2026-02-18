import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product } from "@/components/warehouse/WarehouseProductsTab";
import { Supplier } from "@/components/warehouse/WarehouseSuppliersTab";

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

export interface Receipt {
  id: number;
  receipt_number: string;
  supplier_id: number | null;
  supplier_name: string | null;
  document_number: string;
  document_date: string;
  total_amount: number;
  notes: string;
  item_count: number;
  created_at: string;
}

interface ReceiptItem {
  product_id: number;
  quantity: number;
  price: number;
}

interface ReceiptPayload {
  supplier_id: number | null;
  document_number: string;
  document_date: string | null;
  notes: string;
  items: ReceiptItem[];
}

interface Props {
  receipts: Receipt[];
  products: Product[];
  suppliers: Supplier[];
  onCreate: (payload: ReceiptPayload) => Promise<void>;
}

const WarehouseReceiptsTab = ({ receipts, products, suppliers, onCreate }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    supplier_id: "", document_number: "", document_date: "", notes: "",
  });
  const [items, setItems] = useState<ReceiptItem[]>([{ product_id: 0, quantity: 1, price: 0 }]);

  const receiptTotal = items.reduce((s, i) => s + i.quantity * i.price, 0);

  const openCreate = () => {
    setForm({ supplier_id: "", document_number: "", document_date: new Date().toISOString().slice(0, 10), notes: "" });
    setItems([{ product_id: 0, quantity: 1, price: 0 }]);
    setDialogOpen(true);
  };

  const addItem = () => {
    setItems((prev) => [...prev, { product_id: 0, quantity: 1, price: 0 }]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof ReceiptItem, value: number) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleCreate = async () => {
    const validItems = items.filter((i) => i.product_id && i.quantity > 0);
    await onCreate({
      supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
      document_number: form.document_number,
      document_date: form.document_date || null,
      notes: form.notes,
      items: validItems,
    });
    setDialogOpen(false);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={openCreate}>
            <Icon name="FileInput" size={16} className="mr-1.5" />
            Новое поступление
          </Button>
        </div>

        {receipts.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-12 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="FileInput" size={28} className="text-green-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Поступлений пока нет</h3>
            <p className="text-sm text-muted-foreground mb-4">Оформите приход товара на склад</p>
            <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={openCreate}>
              <Icon name="FileInput" size={16} className="mr-1.5" />
              Оформить поступление
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Номер</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Дата</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden sm:table-cell">Поставщик</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Документ</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 hidden sm:table-cell">Позиций</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-green-600">{r.receipt_number}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm">
                        {r.document_date ? new Date(r.document_date).toLocaleDateString("ru-RU") : new Date(r.created_at).toLocaleDateString("ru-RU")}
                      </td>
                      <td className="px-5 py-3.5 text-sm hidden sm:table-cell">{r.supplier_name || "—"}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell">{r.document_number || "—"}</td>
                      <td className="px-5 py-3.5 text-sm text-right hidden sm:table-cell">{r.item_count}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-right text-green-600">+{fmt(Number(r.total_amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Новое поступление товара</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Поставщик</label>
                <Select value={form.supplier_id} onValueChange={(v) => setForm((f) => ({ ...f, supplier_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без поставщика</SelectItem>
                    {suppliers.filter((s) => s.is_active).map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Номер документа</label>
                <Input value={form.document_number} onChange={(e) => setForm((f) => ({ ...f, document_number: e.target.value }))} placeholder="УПД-123" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Дата документа</label>
                <Input type="date" value={form.document_date} onChange={(e) => setForm((f) => ({ ...f, document_date: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Товары</label>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Icon name="Plus" size={14} className="mr-1" />
                  Добавить строку
                </Button>
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
                      <tr key={idx} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">
                          <Select
                            value={String(item.product_id || "")}
                            onValueChange={(v) => {
                              const pid = Number(v);
                              updateItem(idx, "product_id", pid);
                              const prod = products.find((p) => p.id === pid);
                              if (prod) updateItem(idx, "price", Number(prod.purchase_price));
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
                          <Input type="number" className="h-8 text-sm text-right" value={item.quantity || ""} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} />
                        </td>
                        <td className="px-3 py-2">
                          <Input type="number" className="h-8 text-sm text-right" value={item.price || ""} onChange={(e) => updateItem(idx, "price", Number(e.target.value))} />
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-medium">
                          {fmt(item.quantity * item.price)}
                        </td>
                        <td className="px-1 py-2">
                          {items.length > 1 && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeItem(idx)}>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Примечание</label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Необязательно" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={handleCreate}>
                <Icon name="FileInput" size={16} className="mr-1.5" />
                Оприходовать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WarehouseReceiptsTab;
