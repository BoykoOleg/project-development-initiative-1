import { useState, useEffect } from "react";
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
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";

interface Order {
  id: number;
  number: string;
  date: string;
  client: string;
  phone: string;
  car: string;
  service: string;
  status: "new" | "contacted" | "approved" | "rejected";
  comment: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  new: { label: "Новая", className: "bg-purple-100 text-purple-700" },
  contacted: { label: "Связались", className: "bg-blue-100 text-blue-700" },
  approved: { label: "Одобрена", className: "bg-green-100 text-green-700" },
  rejected: { label: "Отклонена", className: "bg-red-100 text-red-700" },
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ client: "", phone: "", car: "", service: "", comment: "" });

  const fetchOrders = async () => {
    try {
      const url = getApiUrl("orders");
      if (!url) { setLoading(false); return; }
      const res = await fetch(url);
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch {
      toast.error("Не удалось загрузить заявки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter((o) => {
    const matchFilter = filter === "all" || o.status === filter;
    const matchSearch = !search || o.client.toLowerCase().includes(search.toLowerCase()) || o.car.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleCreate = async () => {
    if (!form.client || !form.phone) {
      toast.error("Заполните клиента и телефон");
      return;
    }
    try {
      const url = getApiUrl("orders");
      if (!url) { toast.error("Бэкенд не подключён"); return; }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...form }),
      });
      const data = await res.json();
      if (data.order) {
        setOrders([data.order, ...orders]);
        toast.success("Заявка создана");
      }
    } catch {
      toast.error("Ошибка при создании заявки");
    }
    setForm({ client: "", phone: "", car: "", service: "", comment: "" });
    setDialogOpen(false);
  };

  const updateStatus = async (orderId: number, status: Order["status"]) => {
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
    try {
      const url = getApiUrl("orders");
      if (!url) return;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", order_id: orderId, status }),
      });
    } catch {
      toast.error("Ошибка при смене статуса");
    }
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
            <Input placeholder="Поиск по клиенту или авто..." className="pl-9 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
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

        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Загрузка...</div>
        ) : orders.length === 0 && !search ? (
          <div className="bg-white rounded-xl border border-border shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="ClipboardList" size={28} className="text-blue-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Заявок пока нет</h3>
            <p className="text-sm text-muted-foreground mb-4">Создайте первую заявку</p>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => setDialogOpen(true)}>
              <Icon name="Plus" size={16} className="mr-1.5" />
              Новая заявка
            </Button>
          </div>
        ) : (
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
                        <span className="text-sm font-medium text-blue-600">{order.number}</span>
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
        )}
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