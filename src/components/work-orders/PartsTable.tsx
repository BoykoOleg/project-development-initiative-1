import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PartItem, fmt } from "@/components/work-orders/parts-types";

interface Props {
  parts: PartItem[];
  isIssued: boolean;
  onUpdate: (p: PartItem, form: { name: string; qty: number; price: number; purchase_price: number }) => Promise<void>;
  onDelete: (p: PartItem) => Promise<void>;
}

const PartsTable = ({ parts, isIssued, onUpdate, onDelete }: Props) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", qty: 1, price: 0, purchase_price: 0 });
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [editingPriceVal, setEditingPriceVal] = useState<string>("");

  const handleUpdate = async (p: PartItem) => {
    if (!editForm.name.trim()) return;
    await onUpdate(p, editForm);
    setEditingId(null);
  };

  if (parts.length === 0) {
    return <div className="text-sm text-muted-foreground py-8 text-center">Запчасти не добавлены</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-[1.5rem_1fr_5rem_6.5rem_6.5rem_auto] gap-0 px-3 sm:px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/30 border-b border-border">
        <span>№</span>
        <span>Наименование</span>
        <span className="text-center">Кол-во</span>
        <span className="text-right">Цена</span>
        <span className="text-right">Сумма</span>
        <span />
      </div>

      <div className="divide-y divide-border">
        {parts.map((p, i) => (
          <div key={p.id || i}>
            {editingId === p.id ? (
              <div className="flex flex-col gap-2 px-4 py-3 bg-muted/10">
                <Input
                  className="h-9 w-full"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(p); if (e.key === "Escape") setEditingId(null); }}
                  autoFocus
                  placeholder="Наименование"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Кол.</span>
                    <Input type="number" className="w-16 h-9" placeholder="1" value={editForm.qty || ""} onChange={(e) => setEditForm((f) => ({ ...f, qty: Number(e.target.value) }))} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Закуп</span>
                    <Input type="number" className="w-24 h-9 bg-gray-50 text-muted-foreground" placeholder="0" value={editForm.purchase_price || ""} readOnly />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Продажа</span>
                    <Input type="number" className="w-24 h-9" placeholder="0" value={editForm.price || ""} onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) }))} onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(p); }} />
                  </div>
                  <Button size="sm" className="h-9 bg-blue-500 hover:bg-blue-600 text-white px-3" onClick={() => handleUpdate(p)}><Icon name="Check" size={14} /></Button>
                  <Button size="sm" variant="ghost" className="h-9" onClick={() => setEditingId(null)}><Icon name="X" size={14} /></Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-[1.5rem_1fr_5rem_6.5rem_6.5rem_auto] gap-0 px-3 sm:px-4 py-2.5 items-center group hover:bg-muted/20 transition-colors">
                <span className="text-sm text-muted-foreground">{i + 1}</span>

                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-foreground truncate">{p.name}</span>
                    {p.product_id && <Icon name="Package" size={12} className="text-blue-400 shrink-0" />}
                  </div>
                  {(p.purchase_price || 0) > 0 && (
                    <div className="text-xs text-muted-foreground">Закуп: {fmt(p.purchase_price || 0)}</div>
                  )}
                </div>

                <span className="text-sm text-foreground text-center">{p.qty} шт.</span>

                <div className="text-right pr-2">
                  {!isIssued && editingPriceId === p.id ? (
                    <Input
                      type="number"
                      className="h-7 w-24 text-right ml-auto text-sm"
                      autoFocus
                      value={editingPriceVal}
                      onChange={(e) => setEditingPriceVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const newPrice = parseFloat(editingPriceVal) || p.price;
                          onUpdate(p, { name: p.name, qty: p.qty, price: newPrice, purchase_price: p.purchase_price || 0 });
                          setEditingPriceId(null);
                        }
                        if (e.key === "Escape") setEditingPriceId(null);
                      }}
                      onBlur={() => {
                        const newPrice = parseFloat(editingPriceVal) || p.price;
                        onUpdate(p, { name: p.name, qty: p.qty, price: newPrice, purchase_price: p.purchase_price || 0 });
                        setEditingPriceId(null);
                      }}
                    />
                  ) : (
                    <span
                      className={`text-sm text-foreground ${!isIssued ? "cursor-pointer hover:text-blue-600 hover:underline" : ""}`}
                      title={!isIssued ? "Двойной клик для изменения цены" : undefined}
                      onDoubleClick={() => {
                        if (isIssued) return;
                        setEditingPriceId(p.id!);
                        setEditingPriceVal(String(p.price));
                      }}
                    >
                      {fmt(p.price)}
                    </span>
                  )}
                </div>

                <span className="text-sm font-semibold text-foreground text-right">{fmt(p.price * p.qty)}</span>

                <div className="flex gap-1 ml-2 justify-end">
                  {!isIssued && (
                    <>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={() => { setEditingId(p.id!); setEditForm({ name: p.name, qty: p.qty, price: p.price, purchase_price: p.purchase_price || 0 }); }}>
                        <Icon name="Pencil" size={13} className="text-muted-foreground" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={() => onDelete(p)}>
                        <Icon name="Trash2" size={13} className="text-red-400" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartsTable;
