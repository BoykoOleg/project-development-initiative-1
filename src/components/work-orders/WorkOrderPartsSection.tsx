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
import { PartItem } from "@/components/work-orders/types";

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

interface Product {
  id: number;
  sku: string;
  name: string;
  purchase_price: number;
  quantity: number;
  unit: string;
}

interface AddPartPayload {
  product_id?: number;
  name: string;
  qty: number;
  price: number;
  purchase_price: number;
}

interface Props {
  parts: PartItem[];
  products: Product[];
  isIssued: boolean;
  onAdd: (payload: AddPartPayload) => Promise<void>;
  onUpdate: (p: PartItem, form: { name: string; qty: number; price: number; purchase_price: number }) => Promise<void>;
  onDelete: (p: PartItem) => Promise<void>;
}

const WorkOrderPartsSection = ({ parts, products, isIssued, onAdd, onUpdate, onDelete }: Props) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", qty: 1, price: 0, purchase_price: 0 });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"stock" | "manual">("stock");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [addForm, setAddForm] = useState({ name: "", qty: 1, price: 0, purchase_price: 0 });

  const partsTotal = parts.reduce((s, p) => s + p.price * p.qty, 0);
  const partsCost = parts.reduce((s, p) => s + (p.purchase_price || 0) * p.qty, 0);
  const partsMargin = partsTotal - partsCost;

  const openDialog = () => {
    setMode("stock");
    setSelectedProductId("");
    setAddForm({ name: "", qty: 1, price: 0, purchase_price: 0 });
    setDialogOpen(true);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    const prod = products.find((p) => p.id === Number(productId));
    if (prod) {
      setAddForm({
        name: prod.name,
        qty: 1,
        price: 0,
        purchase_price: Number(prod.purchase_price),
      });
    }
  };

  const handleAdd = async () => {
    if (mode === "stock" && selectedProductId) {
      await onAdd({ product_id: Number(selectedProductId), ...addForm });
    } else if (mode === "manual" && addForm.name.trim()) {
      await onAdd(addForm);
    }
    setDialogOpen(false);
  };

  const handleUpdate = async (p: PartItem) => {
    if (!editForm.name.trim()) return;
    await onUpdate(p, editForm);
    setEditingId(null);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Запчасти и материалы</h3>
            {partsCost > 0 && (
              <div className="text-xs text-muted-foreground mt-0.5">
                Закупка: {fmt(partsCost)} · Наценка: <span className={partsMargin >= 0 ? "text-green-600" : "text-red-600"}>{fmt(partsMargin)}</span>
              </div>
            )}
          </div>
          <span className="text-sm font-semibold text-foreground">{fmt(partsTotal)}</span>
        </div>

        {parts.length > 0 ? (
          <div className="divide-y divide-border">
            {parts.map((p, i) => (
              <div key={p.id || i}>
                {editingId === p.id ? (
                  <div className="flex items-center gap-2 px-5 py-3 flex-wrap">
                    <span className="text-sm text-muted-foreground w-8 shrink-0">{i + 1}.</span>
                    <Input className="flex-1 min-w-[120px] h-9" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(p); if (e.key === "Escape") setEditingId(null); }} autoFocus />
                    <Input type="number" className="w-16 h-9" placeholder="Кол" value={editForm.qty || ""} onChange={(e) => setEditForm((f) => ({ ...f, qty: Number(e.target.value) }))} />
                    <div className="flex items-center gap-1">
                      <Input type="number" className="w-24 h-9" placeholder="Закуп" value={editForm.purchase_price || ""} onChange={(e) => setEditForm((f) => ({ ...f, purchase_price: Number(e.target.value) }))} />
                      <span className="text-xs text-muted-foreground">→</span>
                      <Input type="number" className="w-24 h-9" placeholder="Продажа" value={editForm.price || ""} onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) }))} onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(p); }} />
                    </div>
                    <Button size="sm" className="h-9 bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleUpdate(p)}><Icon name="Check" size={14} /></Button>
                    <Button size="sm" variant="ghost" className="h-9" onClick={() => setEditingId(null)}><Icon name="X" size={14} /></Button>
                  </div>
                ) : (
                  <div className="flex items-center px-5 py-3 group hover:bg-muted/30">
                    <span className="text-sm text-muted-foreground w-8 shrink-0">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-foreground">{p.name}</span>
                        <span className="text-muted-foreground text-sm">× {p.qty}</span>
                        {p.product_id && <Icon name="Package" size={12} className="text-blue-400" />}
                      </div>
                      {(p.purchase_price || 0) > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Закуп: {fmt(p.purchase_price || 0)} → Продажа: {fmt(p.price)}
                          {p.price > (p.purchase_price || 0) && (
                            <span className="text-green-600 ml-1">+{fmt((p.price - (p.purchase_price || 0)) * p.qty)}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-foreground shrink-0 ml-4">
                      {(p.price * p.qty).toLocaleString("ru-RU")} ₽
                    </span>
                    {!isIssued && (
                      <div className="flex gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingId(p.id!); setEditForm({ name: p.name, qty: p.qty, price: p.price, purchase_price: p.purchase_price || 0 }); }}>
                          <Icon name="Pencil" size={13} className="text-muted-foreground" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onDelete(p)}>
                          <Icon name="Trash2" size={13} className="text-red-400" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-8 text-center">Запчасти не добавлены</div>
        )}

        {!isIssued && (
          <div className="px-5 py-3 border-t border-border">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={openDialog}>
              <Icon name="Plus" size={16} className="mr-1.5" />
              Добавить запчасть
            </Button>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Добавить запчасть</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              <Button variant={mode === "stock" ? "default" : "outline"} size="sm" className={mode === "stock" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""} onClick={() => setMode("stock")}>
                <Icon name="Package" size={14} className="mr-1" />Со склада
              </Button>
              <Button variant={mode === "manual" ? "default" : "outline"} size="sm" className={mode === "manual" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""} onClick={() => setMode("manual")}>
                <Icon name="Pencil" size={14} className="mr-1" />Вручную
              </Button>
            </div>

            {mode === "stock" ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Товар со склада *</label>
                  <Select value={selectedProductId} onValueChange={handleSelectProduct}>
                    <SelectTrigger><SelectValue placeholder="Выберите товар" /></SelectTrigger>
                    <SelectContent>
                      {products.filter((p) => p.quantity > 0).map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.sku} — {p.name} ({p.quantity} {p.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedProductId && (
                  <div className="bg-blue-50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Закупочная цена</span>
                      <span className="font-medium">{fmt(addForm.purchase_price)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-muted-foreground">На складе</span>
                      <span className="font-medium">{products.find((p) => p.id === Number(selectedProductId))?.quantity} шт</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Название *</label>
                <Input value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} placeholder="Название запчасти" />
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Кол-во</label>
                <Input type="number" value={addForm.qty || ""} onChange={(e) => setAddForm((f) => ({ ...f, qty: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Закупка ₽</label>
                <Input type="number" value={addForm.purchase_price || ""} onChange={(e) => setAddForm((f) => ({ ...f, purchase_price: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Продажа ₽</label>
                <Input type="number" value={addForm.price || ""} onChange={(e) => setAddForm((f) => ({ ...f, price: Number(e.target.value) }))} />
              </div>
            </div>

            {addForm.price > 0 && addForm.purchase_price > 0 && (
              <div className="bg-green-50 rounded-lg p-3 text-sm flex justify-between">
                <span className="text-muted-foreground">Наценка</span>
                <span className="font-semibold text-green-600">
                  +{fmt((addForm.price - addForm.purchase_price) * addForm.qty)}
                  ({Math.round(((addForm.price - addForm.purchase_price) / addForm.purchase_price) * 100)}%)
                </span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleAdd}>
                <Icon name="Plus" size={16} className="mr-1.5" />
                Добавить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkOrderPartsSection;
