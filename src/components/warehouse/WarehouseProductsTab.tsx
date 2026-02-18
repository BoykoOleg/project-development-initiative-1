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

interface ProductForm {
  sku: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  purchase_price: number;
  quantity: number;
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
    sku: "", name: "", description: "", category: "", unit: "шт",
    purchase_price: 0, quantity: 0, min_quantity: 0,
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
      unit: "шт", purchase_price: 0, quantity: 0, min_quantity: 0,
    });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      sku: p.sku, name: p.name, description: p.description, category: p.category,
      unit: p.unit, purchase_price: Number(p.purchase_price), quantity: p.quantity, min_quantity: p.min_quantity,
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
            <Input placeholder="Поиск по артикулу, названию..." className="pl-9 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={openCreate}>
            <Icon name="Plus" size={16} className="mr-1.5" />
            Добавить товар
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Package" size={28} className="text-blue-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Товаров пока нет</h3>
            <p className="text-sm text-muted-foreground mb-4">Добавьте первый товар в номенклатуру</p>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={openCreate}>
              <Icon name="Plus" size={16} className="mr-1.5" />
              Добавить товар
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Артикул</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Наименование</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Категория</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Цена вх.</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Кол-во</th>
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
                        <td className="px-5 py-3.5">
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
                        <td className="px-5 py-3.5 text-right text-sm">{fmt(Number(p.purchase_price))}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`text-sm font-semibold ${isLow ? "text-red-600" : "text-foreground"}`}>
                            {p.quantity} {p.unit}
                          </span>
                          {isLow && (
                            <div className="text-xs text-red-500">мин. {p.min_quantity}</div>
                          )}
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
            <DialogTitle>{editing ? "Карточка товара" : "Новый товар"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Артикул (код) *</label>
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

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Цена входная</label>
                <Input type="number" value={form.purchase_price || ""} onChange={(e) => setForm((f) => ({ ...f, purchase_price: Number(e.target.value) }))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Кол-во</label>
                <Input type="number" value={form.quantity || ""} onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Мин. остаток</label>
                <Input type="number" value={form.min_quantity || ""} onChange={(e) => setForm((f) => ({ ...f, min_quantity: Number(e.target.value) }))} placeholder="0" />
              </div>
            </div>

            {editing && (
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <div>Создан: {new Date(editing.created_at).toLocaleDateString("ru-RU")}</div>
                <div>Обновлён: {new Date(editing.updated_at).toLocaleDateString("ru-RU")}</div>
                <div>Стоимость на складе: {fmt(Number(editing.purchase_price) * editing.quantity)}</div>
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
