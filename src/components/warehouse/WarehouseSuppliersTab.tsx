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

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

export interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  inn: string;
  address: string;
  notes: string;
  is_active: boolean;
  receipt_count: number;
  total_supplied: number;
}

interface SupplierForm {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  inn: string;
  address: string;
  notes: string;
}

interface Props {
  suppliers: Supplier[];
  onSave: (form: SupplierForm, editingId?: number) => Promise<void>;
}

const WarehouseSuppliersTab = ({ suppliers, onSave }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>({
    name: "", contact_person: "", phone: "", email: "", inn: "", address: "", notes: "",
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", contact_person: "", phone: "", email: "", inn: "", address: "", notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name, contact_person: s.contact_person, phone: s.phone,
      email: s.email, inn: s.inn, address: s.address, notes: s.notes,
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
        <div className="flex justify-end">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={openCreate}>
            <Icon name="Plus" size={16} className="mr-1.5" />
            Добавить поставщика
          </Button>
        </div>

        {suppliers.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Truck" size={28} className="text-blue-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Поставщиков пока нет</h3>
            <p className="text-sm text-muted-foreground mb-4">Добавьте контрагентов для приёмки товара</p>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={openCreate}>
              <Icon name="Plus" size={16} className="mr-1.5" />
              Добавить поставщика
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-border p-5 space-y-3 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openEdit(s)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Icon name="Truck" size={20} className="text-blue-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{s.name}</div>
                      {s.contact_person && <div className="text-xs text-muted-foreground">{s.contact_person}</div>}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {s.is_active ? "Активен" : "Неактивен"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {s.phone && <span><Icon name="Phone" size={12} className="inline mr-1" />{s.phone}</span>}
                  {s.inn && <span>ИНН: {s.inn}</span>}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">{s.receipt_count} поступлений</span>
                  <span className="text-sm font-semibold">{fmt(Number(s.total_supplied))}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать поставщика" : "Новый поставщик"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium">Название компании *</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="ООО Плёнки Про" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Контактное лицо</label>
                <Input value={form.contact_person} onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))} placeholder="Иван Петров" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Телефон</label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+7 (999) 123-45-67" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="info@supplier.ru" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ИНН</label>
                <Input value={form.inn} onChange={(e) => setForm((f) => ({ ...f, inn: e.target.value }))} placeholder="7712345678" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Адрес</label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="г. Москва, ул. Ленина, 1" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Заметки</label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Дополнительная информация" />
            </div>
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

export default WarehouseSuppliersTab;
