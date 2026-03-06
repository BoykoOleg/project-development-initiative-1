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

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  purchase_price: number;
  quantity: number;
  min_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductForm {
  sku: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  min_quantity: number;
}

interface Props {
  products: Product[];
  onSave: (form: ProductForm, editingId?: number) => Promise<void>;
}

const WarehouseProductsTab = ({ products, onSave }: Props) => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>({
    sku: "", name: "", description: "", category: "", unit: "шт", min_quantity: 0,
  });

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  const openCreate = () => {
    setEditing(null);
    const nextNum = products.length + 1;
    setForm({
      sku: String(nextNum).padStart(4, "0"), name: "", description: "", category: "",
      unit: "шт", min_quantity: 0,
    });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      sku: p.sku, name: p.name, description: p.description, category: p.category,
      unit: p.unit, min_quantity: p.min_quantity,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    await onSave(form, editing?.id);
    setDialogOpen(false);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Поиск по номеру, названию..." className="pl-9 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={openCreate}>
            <Icon name="Plus" size={16} className="mr-1.5" />
            Добавить номенклатуру
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Package" size={28} className="text-blue-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Номенклатура пуста</h3>
            <p className="text-sm text-muted-foreground mb-1">Добавьте позиции в базу номенклатуры.</p>
            <p className="text-xs text-muted-foreground mb-4">Цена и остаток устанавливаются через <b>Приход товара</b></p>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={openCreate}>
              <Icon name="Plus" size={16} className="mr-1.5" />
              Добавить номенклатуру
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Ном. номер</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Наименование</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Категория</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Цена прихода</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">На складе</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 hidden sm:table-cell">Сумма</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const isLow = p.quantity <= p.min_quantity && p.min_quantity > 0;
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => openEdit(p)}
                      >
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-mono font-medium text-blue-600">{p.sku}</span>
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          <div className="text-sm font-medium text-foreground">{p.name}</div>
                          {p.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-[250px]">{p.description}</div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          {p.category ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {p.category}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm">
                          {p.purchase_price > 0 ? (
                            <span className="text-foreground">{fmt(Number(p.purchase_price))}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">нет прихода</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`text-sm font-semibold ${isLow ? "text-red-600" : "text-foreground"}`}>
                            {p.quantity} {p.unit}
                          </span>
                          {isLow && <div className="text-xs text-red-500">мин. {p.min_quantity}</div>}
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm font-medium hidden sm:table-cell">
                          {fmt(Number(p.purchase_price) * p.quantity)}
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <Button
                            variant="ghost" size="sm" className="h-7 w-7 p-0"
                            onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                          >
                            <Icon name="Pencil" size={14} className="text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && search && (
              <div className="text-center py-8 text-sm text-muted-foreground">Ничего не найдено</div>
            )}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Карточка номенклатуры" : "Новая номенклатура"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Номенклатурный номер *</label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="0001"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ед. измерения</label>
                <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="шт">шт</SelectItem>
                    <SelectItem value="м">м</SelectItem>
                    <SelectItem value="м²">м²</SelectItem>
                    <SelectItem value="кг">кг</SelectItem>
                    <SelectItem value="л">л</SelectItem>
                    <SelectItem value="компл">компл</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Наименование *</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Плёнка защитная PPF 152см" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Описание</label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Дополнительная информация" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Категория</label>
              <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Плёнки, расходники, инструмент..." />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Мин. остаток для предупреждения</label>
              <Input type="number" value={form.min_quantity || ""} onChange={(e) => setForm((f) => ({ ...f, min_quantity: Number(e.target.value) }))} placeholder="0" />
            </div>

            {editing && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-amber-700 font-medium mb-1">
                  <Icon name="Info" size={13} />
                  Цена и остаток управляются через Приход
                </div>
                <div className="text-muted-foreground">Цена прихода: <span className="font-medium text-foreground">{fmt(Number(editing.purchase_price))}</span></div>
                <div className="text-muted-foreground">На складе: <span className="font-medium text-foreground">{editing.quantity} {editing.unit}</span></div>
                <div className="text-muted-foreground">Стоимость: <span className="font-medium text-foreground">{fmt(Number(editing.purchase_price) * editing.quantity)}</span></div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleSave}>
                {editing ? "Сохранить" : "Добавить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WarehouseProductsTab;