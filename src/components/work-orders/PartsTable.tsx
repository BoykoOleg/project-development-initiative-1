import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PartItem, fmt } from "@/components/work-orders/parts-types";

interface Props {
  parts: PartItem[];
  isIssued: boolean;
  onUpdate: (p: PartItem, form: { part_number?: string; name: string; qty: number; price: number; purchase_price: number }) => Promise<void>;
  onDelete: (p: PartItem) => Promise<void>;
}

const PartsTable = ({ parts, isIssued, onUpdate, onDelete }: Props) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ part_number: "", name: "", qty: 1, price: 0, purchase_price: 0 });

  const startEdit = (p: PartItem) => {
    setEditingId(p.id!);
    setEditForm({ part_number: p.part_number || "", name: p.name, qty: p.qty, price: p.price, purchase_price: p.purchase_price || 0 });
  };

  const handleUpdate = async (p: PartItem) => {
    if (!editForm.name.trim()) return;
    await onUpdate(p, editForm);
    setEditingId(null);
  };

  if (parts.length === 0) {
    return <div className="text-sm text-muted-foreground py-8 text-center">Запчасти не добавлены</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th className="text-left px-3 py-1.5 w-8 hidden sm:table-cell">№</th>
            <th className="text-left py-1.5 px-2 w-28 hidden sm:table-cell">Номер детали</th>
            <th className="text-left py-1.5 px-2">Наименование</th>
            <th className="text-center px-3 py-1.5 w-20 hidden sm:table-cell">Кол-во</th>
            <th className="text-right px-3 py-1.5 w-28 hidden md:table-cell">Цена</th>
            <th className="text-right px-3 py-1.5 w-28">Сумма</th>
            {!isIssued && <th className="w-10"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {parts.map((p, i) => (
            <tr key={p.id || i} className="group hover:bg-muted/30">
              {editingId === p.id ? (
                <>
                  <td className="px-3 py-1.5 text-muted-foreground hidden sm:table-cell">{i + 1}</td>
                  <td className="px-2 py-1.5 hidden sm:table-cell">
                    <Input
                      className="h-8 text-sm font-mono"
                      placeholder="Арт./номер"
                      value={editForm.part_number}
                      onChange={(e) => setEditForm((f) => ({ ...f, part_number: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Escape") setEditingId(null); }}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      className="h-8 text-sm"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(p); if (e.key === "Escape") setEditingId(null); }}
                    />
                  </td>
                  <td className="px-3 py-1.5 hidden sm:table-cell">
                    <Input
                      inputMode="numeric"
                      className="h-8 w-14 text-sm text-center"
                      value={editForm.qty || ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, qty: Number(e.target.value) }))}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </td>
                  <td className="px-3 py-1.5 hidden md:table-cell">
                    <Input
                      inputMode="numeric"
                      className="h-8 w-24 text-sm text-right"
                      value={editForm.price || ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) }))}
                      onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(p); }}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <span className="text-xs font-semibold text-blue-600">{fmt(editForm.price * editForm.qty)}</span>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex gap-1">
                      <Button size="sm" className="h-7 w-7 p-0 bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleUpdate(p)}><Icon name="Check" size={13} /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}><Icon name="X" size={13} /></Button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-3 py-1.5 text-muted-foreground hidden sm:table-cell">{i + 1}</td>
                  <td className="px-2 py-1.5 hidden sm:table-cell cursor-text select-none" onDoubleClick={() => { if (!isIssued) startEdit(p); }}>
                    {p.part_number
                      ? <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">{p.part_number}</span>
                      : <span className="text-muted-foreground/40 text-xs">—</span>
                    }
                  </td>
                  <td className="px-2 py-1.5 cursor-text select-none" onDoubleClick={() => { if (!isIssued) startEdit(p); }}>
                    <div className="flex items-center gap-1.5">
                      <span>{p.name}</span>
                      {p.product_id && <Icon name="Package" size={12} className="text-blue-400 shrink-0" />}
                    </div>
                    {(p.purchase_price || 0) > 0 && (
                      <div className="text-xs text-muted-foreground">Закуп: {fmt(p.purchase_price || 0)}</div>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-center cursor-text select-none hidden sm:table-cell" onDoubleClick={() => { if (!isIssued) startEdit(p); }}>
                    {p.qty} шт.
                  </td>
                  <td className="px-3 py-1.5 text-right cursor-text select-none hidden md:table-cell" onDoubleClick={() => { if (!isIssued) startEdit(p); }}>
                    {fmt(p.price)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-semibold cursor-text select-none" onDoubleClick={() => { if (!isIssued) startEdit(p); }}>
                    {fmt(p.price * p.qty)}
                  </td>
                  {!isIssued && (
                    <td className="px-3 py-1.5">
                      <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onDelete(p)}>
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
  );
};

export default PartsTable;
