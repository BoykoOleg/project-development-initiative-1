import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import Layout from "@/components/Layout";

interface Order {
  id: string;
  date: string;
  client: string;
  phone: string;
  car: string;
  service: string;
  status: "new" | "contacted" | "approved" | "rejected";
  comment: string;
}

const initialOrders: Order[] = [
  { id: "З-0025", date: "18.02.2026", client: "Иванов Алексей", phone: "+7 (999) 123-45-67", car: "Toyota Camry 2020", service: "Установка сигнализации", status: "new", comment: "Хочу StarLine A93" },
  { id: "З-0024", date: "17.02.2026", client: "Петрова Мария", phone: "+7 (916) 555-12-34", car: "Kia Rio 2022", service: "Тонировка", status: "contacted", comment: "Задние стёкла + багажник" },
  { id: "З-0023", date: "17.02.2026", client: "Сидоров Дмитрий", phone: "+7 (903) 777-88-99", car: "BMW X5 2021", service: "Шумоизоляция", status: "approved", comment: "Полная шумоизоляция салона" },
  { id: "З-0022", date: "16.02.2026", client: "Козлова Анна", phone: "+7 (926) 333-22-11", car: "Hyundai Creta 2023", service: "Установка магнитолы", status: "new", comment: "" },
  { id: "З-0021", date: "15.02.2026", client: "Николаев Пётр", phone: "+7 (985) 444-55-66", car: "Lada Vesta 2024", service: "Парктроник", status: "rejected", comment: "Клиент передумал" },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  new: { label: "Новая", className: "bg-purple-100 text-purple-700" },
  contacted: { label: "Связались", className: "bg-blue-100 text-blue-700" },
  approved: { label: "Одобрена", className: "bg-green-100 text-green-700" },
  rejected: { label: "Отклонена", className: "bg-red-100 text-red-700" },
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ client: "", phone: "", car: "", service: "", comment: "" });

  const filtered = orders.filter((o) => {
    const matchFilter = filter === "all" || o.status === filter;
    const matchSearch = !search || o.client.toLowerCase().includes(search.toLowerCase()) || o.car.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleCreate = () => {
    if (!form.client || !form.phone) return;
    const newOrder: Order = {
      id: `З-${String(orders.length + 20).padStart(4, "0")}`,
      date: new Date().toLocaleDateString("ru-RU"),
      client: form.client,
      phone: form.phone,
      car: form.car,
      service: form.service,
      status: "new",
      comment: form.comment,
    };
    setOrders([newOrder, ...orders]);
    setForm({ client: "", phone: "", car: "", service: "", comment: "" });
    setDialogOpen(false);
  };

  const updateStatus = (id: string, status: Order["status"]) => {
    setOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  return (
    <Layout
      title="Заявки"
      actions={
        <>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white hidden sm:flex" onClick={() => setDialogOpen(true)}>
            <Icon name="Plus" size={16} className="mr-1.5" />
            Новая заявка
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white sm:hidden" size="sm" onClick={() => setDialogOpen(true)}>
            <Icon name="Plus" size={16} />
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по клиенту или авто..."
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {[
              { value: "all", label: "Все" },
              { value: "new", label: "Новые" },
              { value: "contacted", label: "Связались" },
              { value: "approved", label: "Одобрены" },
            ].map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? "default" : "outline"}
                size="sm"
                className={filter === f.value ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">№</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Дата</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Клиент</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Телефон</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden lg:table-cell">Авто</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden lg:table-cell">Услуга</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Статус</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-blue-600">{order.id}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{order.date}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-medium text-foreground">{order.client}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{order.phone}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground hidden md:table-cell">{order.phone}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground hidden lg:table-cell">{order.car}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground hidden lg:table-cell">{order.service}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.className}`}>
                        {statusConfig[order.status]?.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Select
                        value={order.status}
                        onValueChange={(v) => updateStatus(order.id, v as Order["status"])}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Новая</SelectItem>
                          <SelectItem value="contacted">Связались</SelectItem>
                          <SelectItem value="approved">Одобрена</SelectItem>
                          <SelectItem value="rejected">Отклонена</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                      Заявки не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Новая заявка</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Клиент *</label>
              <Input placeholder="ФИО клиента" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Телефон *</label>
              <Input placeholder="+7 (___) ___-__-__" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Автомобиль</label>
              <Input placeholder="Марка, модель, год" value={form.car} onChange={(e) => setForm({ ...form, car: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Услуга</label>
              <Input placeholder="Что нужно сделать" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Комментарий</label>
              <Textarea placeholder="Детали заявки" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleCreate}>Создать</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Orders;