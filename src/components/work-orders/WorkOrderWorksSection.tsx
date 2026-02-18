import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkItem } from "@/components/work-orders/types";

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

interface Props {
  works: WorkItem[];
  isIssued: boolean;
  onAdd: (form: { name: string; price: number }) => Promise<void>;
  onUpdate: (w: WorkItem, form: { name: string; price: number }) => Promise<void>;
  onDelete: (w: WorkItem) => Promise<void>;
}

const WorkOrderWorksSection = ({ works, isIssued, onAdd, onUpdate, onDelete }: Props) => {
  const [addForm, setAddForm] = useState({ name: "", price: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", price: 0 });

  const worksTotal = works.reduce((s, w) => s + w.price, 0);

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    await onAdd(addForm);
    setAddForm({ name: "", price: 0 });
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
        <div className="divide-y divide-border">
          {works.map((w, i) => (
            <div key={w.id || i}>
              {editingId === w.id ? (
                <div className="flex items-center gap-2 px-5 py-3">
                  <span className="text-sm text-muted-foreground w-8 shrink-0">{i + 1}.</span>
                  <Input className="flex-1 h-9" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(w); if (e.key === "Escape") setEditingId(null); }} autoFocus />
                  <Input type="number" className="w-28 h-9" value={editForm.price || ""} onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) }))} onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(w); }} />
                  <Button size="sm" className="h-9 bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleUpdate(w)}><Icon name="Check" size={14} /></Button>
                  <Button size="sm" variant="ghost" className="h-9" onClick={() => setEditingId(null)}><Icon name="X" size={14} /></Button>
                </div>
              ) : (
                <div className="flex items-center px-5 py-3 group hover:bg-muted/30">
                  <span className="text-sm text-muted-foreground w-8 shrink-0">{i + 1}.</span>
                  <span className="flex-1 text-sm text-foreground">{w.name}</span>
                  <span className="text-sm font-semibold text-foreground shrink-0 ml-4">{w.price.toLocaleString("ru-RU")} ₽</span>
                  {!isIssued && (
                    <div className="flex gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingId(w.id!); setEditForm({ name: w.name, price: w.price }); }}>
                        <Icon name="Pencil" size={13} className="text-muted-foreground" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onDelete(w)}>
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
        <div className="text-sm text-muted-foreground py-8 text-center">Работы не добавлены</div>
      )}

      {!isIssued && (
        <div className="flex gap-2 px-5 py-3 border-t border-border">
          <Input placeholder="Название работы" className="flex-1" value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }} />
          <Input type="number" placeholder="Цена" className="w-28" value={addForm.price || ""} onChange={(e) => setAddForm((p) => ({ ...p, price: Number(e.target.value) }))} onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }} />
          <Button className="bg-blue-500 hover:bg-blue-600 text-white shrink-0" onClick={handleAdd}>
            <Icon name="Plus" size={16} className="mr-1.5" /><span className="hidden sm:inline">Добавить</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default WorkOrderWorksSection;
