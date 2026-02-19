import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkItem } from "@/components/work-orders/types";

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 2 }).format(n);

interface Props {
  works: WorkItem[];
  isIssued: boolean;
  onAdd: (form: { name: string; price: number; qty: number; norm_hours: number; norm_hour_price: number; discount: number }) => Promise<void>;
  onUpdate: (w: WorkItem, form: { name: string; price: number; qty: number; norm_hours: number; norm_hour_price: number; discount: number }) => Promise<void>;
  onDelete: (w: WorkItem) => Promise<void>;
}

const emptyForm = { name: "", price: 0, qty: 1, norm_hours: 0, norm_hour_price: 0, discount: 0 };

const WorkOrderWorksSection = ({ works, isIssued, onAdd, onUpdate, onDelete }: Props) => {
  const [addForm, setAddForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });

  const worksTotal = works.reduce((s, w) => s + w.price, 0);

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    await onAdd(addForm);
    setAddForm({ ...emptyForm });
  };

  const handleUpdate = async (w: WorkItem) => {
    if (!editForm.name.trim()) return;
    await onUpdate(w, editForm);
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-xl border border-border">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Работы</h3>
        <span className="text-sm font-semibold text-foreground">{fmt(worksTotal)}</span>
      </div>

      {works.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-3 py-2 w-8">№</th>
                <th className="text-left px-3 py-2">Наименование</th>
                <th className="text-center px-3 py-2 w-16">Кол.</th>
                <th className="text-center px-3 py-2 w-20">Н/ч</th>
                <th className="text-right px-3 py-2 w-24">Цена н/ч</th>
                <th className="text-right px-3 py-2 w-20">Скидка</th>
                <th className="text-right px-3 py-2 w-28">Итого</th>
                {!isIssued && <th className="w-20"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {works.map((w, i) => (
                <tr key={w.id || i} className="group hover:bg-muted/30">
                  {editingId === w.id ? (
                    <>
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2">
                        <Input className="h-8 text-sm" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(w); if (e.key === "Escape") setEditingId(null); }} />
                      </td>
                      <td className="px-3 py-2"><Input type="number" className="h-8 w-16 text-sm text-center" value={editForm.qty || ""} onChange={(e) => setEditForm((f) => ({ ...f, qty: Number(e.target.value) }))} /></td>
                      <td className="px-3 py-2"><Input type="number" step="0.1" className="h-8 w-20 text-sm text-center" value={editForm.norm_hours || ""} onChange={(e) => setEditForm((f) => ({ ...f, norm_hours: Number(e.target.value) }))} /></td>
                      <td className="px-3 py-2"><Input type="number" className="h-8 w-24 text-sm text-right" value={editForm.norm_hour_price || ""} onChange={(e) => setEditForm((f) => ({ ...f, norm_hour_price: Number(e.target.value) }))} /></td>
                      <td className="px-3 py-2"><Input type="number" className="h-8 w-20 text-sm text-right" value={editForm.discount || ""} onChange={(e) => setEditForm((f) => ({ ...f, discount: Number(e.target.value) }))} /></td>
                      <td className="px-3 py-2"><Input type="number" className="h-8 w-28 text-sm text-right" value={editForm.price || ""} onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) }))} /></td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button size="sm" className="h-7 w-7 p-0 bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleUpdate(w)}><Icon name="Check" size={13} /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}><Icon name="X" size={13} /></Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2">{w.name}</td>
                      <td className="px-3 py-2 text-center">{w.qty}</td>
                      <td className="px-3 py-2 text-center">{w.norm_hours || "—"}</td>
                      <td className="px-3 py-2 text-right">{w.norm_hour_price ? w.norm_hour_price.toLocaleString("ru-RU") : "—"}</td>
                      <td className="px-3 py-2 text-right">{w.discount ? fmt(w.discount) : "—"}</td>
                      <td className="px-3 py-2 text-right font-semibold">{fmt(w.price)}</td>
                      {!isIssued && (
                        <td className="px-3 py-2">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingId(w.id!); setEditForm({ name: w.name, price: w.price, qty: w.qty, norm_hours: w.norm_hours, norm_hour_price: w.norm_hour_price, discount: w.discount }); }}>
                              <Icon name="Pencil" size={13} className="text-muted-foreground" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onDelete(w)}>
                              <Icon name="Trash2" size={13} className="text-red-400" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground py-8 text-center">Работы не добавлены</div>
      )}

      {!isIssued && (
        <div className="border-t border-border px-3 py-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1 block">Название</label>
              <Input placeholder="Название работы" className="h-9" value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }} />
            </div>
            <div className="w-16">
              <label className="text-xs text-muted-foreground mb-1 block">Кол.</label>
              <Input type="number" className="h-9 text-center" value={addForm.qty || ""} onChange={(e) => setAddForm((p) => ({ ...p, qty: Number(e.target.value) }))} />
            </div>
            <div className="w-20">
              <label className="text-xs text-muted-foreground mb-1 block">Н/ч</label>
              <Input type="number" step="0.1" className="h-9 text-center" value={addForm.norm_hours || ""} onChange={(e) => setAddForm((p) => ({ ...p, norm_hours: Number(e.target.value) }))} />
            </div>
            <div className="w-24">
              <label className="text-xs text-muted-foreground mb-1 block">Цена н/ч</label>
              <Input type="number" className="h-9 text-right" value={addForm.norm_hour_price || ""} onChange={(e) => setAddForm((p) => ({ ...p, norm_hour_price: Number(e.target.value) }))} />
            </div>
            <div className="w-28">
              <label className="text-xs text-muted-foreground mb-1 block">Итого, ₽</label>
              <Input type="number" placeholder="Цена" className="h-9 text-right" value={addForm.price || ""} onChange={(e) => setAddForm((p) => ({ ...p, price: Number(e.target.value) }))} onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }} />
            </div>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white shrink-0 h-9" onClick={handleAdd}>
              <Icon name="Plus" size={16} className="mr-1.5" /><span className="hidden sm:inline">Добавить</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderWorksSection;
