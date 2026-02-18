import { useState, useEffect, useMemo } from "react";
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
import { useRef } from "react";
import Layout from "@/components/Layout";
import CarFields from "@/components/CarFields";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Car {
  id: number;
  brand: string;
  model: string;
  year: string;
  vin: string;
}

interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  cars: Car[];
}

interface Order {
  id: number;
  number: string;
  date: string;
  client: string;
  client_id?: number;
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
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [form, setForm] = useState({ client: "", phone: "", car: "", service: "", comment: "" });
  const [carForm, setCarForm] = useState({ brand: "", model: "", year: "", vin: "" });
  const clientInputRef = useRef<HTMLInputElement>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({ client: "", phone: "", car: "", service: "", comment: "" });
  const [syncing, setSyncing] = useState(false);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients.slice(0, 20);
    const q = clientSearch.toLowerCase();
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    ).slice(0, 20);
  }, [clients, clientSearch]);

  const fetchData = async () => {
    try {
      const [ordersRes, clientsRes] = await Promise.all([
        getApiUrl("orders") ? fetch(getApiUrl("orders")) : Promise.resolve(null),
        getApiUrl("clients") ? fetch(getApiUrl("clients")) : Promise.resolve(null),
      ]);
      if (ordersRes) {
        const data = await ordersRes.json();
        if (data.orders) setOrders(data.orders);
      }
      if (clientsRes) {
        const data = await clientsRes.json();
        if (data.clients) setClients(data.clients);
      }
    } catch {
      toast.error("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = orders.filter((o) => {
    const matchFilter = filter === "all" || o.status === filter;
    const matchSearch = !search || o.client.toLowerCase().includes(search.toLowerCase()) || o.car.toLowerCase().includes(search.toLowerCase()) || o.phone.includes(search);
    return matchFilter && matchSearch;
  });

  const openCreateDialog = () => {
    setSelectedClientId(null);
    setClientSearch("");
    setForm({ client: "", phone: "", car: "", service: "", comment: "" });
    setCarForm({ brand: "", model: "", year: "", vin: "" });
    setDialogOpen(true);
  };

  const selectClient = (client: Client) => {
    setSelectedClientId(client.id);
    setForm((f) => ({ ...f, client: client.name, phone: client.phone }));
    setCarForm({ brand: "", model: "", year: "", vin: "" });
    setClientSearch("");
    setClientDropdownOpen(false);
  };

  const clearClient = () => {
    setSelectedClientId(null);
    setForm((f) => ({ ...f, client: "", phone: "", car: "" }));
    setCarForm({ brand: "", model: "", year: "", vin: "" });
  };

  const selectCar = (car: Car) => {
    setForm((f) => ({ ...f, car: `${car.brand} ${car.model} ${car.year}`.trim() }));
    setCarForm({ brand: car.brand, model: car.model, year: car.year, vin: car.vin });
  };

  const handleCreate = async () => {
    if (!form.client || !form.phone) {
      toast.error("Заполните имя клиента и телефон");
      return;
    }
    const carInfo = [carForm.brand, carForm.model, carForm.year].filter(Boolean).join(" ").trim() || form.car;
    const carData = carForm.brand.trim() ? { ...carForm } : undefined;
    try {
      const url = getApiUrl("orders");
      if (!url) { toast.error("Бэкенд не подключён"); return; }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", client_id: selectedClientId, ...form, car: carInfo, car_data: carData }),
      });
      const data = await res.json();
      if (data.order) {
        setOrders([data.order, ...orders]);
        toast.success("Заявка создана");
        if (!selectedClientId) {
          const cRes = await fetch(getApiUrl("clients"));
          const cData = await cRes.json();
          if (cData.clients) setClients(cData.clients);
        }
      }
    } catch {
      toast.error("Ошибка при создании заявки");
    }
    setForm({ client: "", phone: "", car: "", service: "", comment: "" });
    setCarForm({ brand: "", model: "", year: "", vin: "" });
    setSelectedClientId(null);
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

  const openEditDialog = (order: Order) => {
    setEditingOrder(order);
    setEditForm({
      client: order.client,
      phone: order.phone,
      car: order.car,
      service: order.service,
      comment: order.comment,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!editingOrder) return;
    if (!editForm.client || !editForm.phone) {
      toast.error("Заполните имя клиента и телефон");
      return;
    }
    try {
      const url = getApiUrl("orders");
      if (!url) { toast.error("Бэкенд не подключён"); return; }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", order_id: editingOrder.id, ...editForm }),
      });
      const data = await res.json();
      if (data.order) {
        setOrders(orders.map((o) => (o.id === editingOrder.id ? data.order : o)));
        toast.success("Заявка обновлена");
      }
    } catch {
      toast.error("Ошибка при обновлении заявки");
    }
    setEditDialogOpen(false);
    setEditingOrder(null);
  };

  const syncAvito = async () => {
    setSyncing(true);
    try {
      const url = getApiUrl("avito-sync");
      if (!url) { toast.error("Бэкенд не подключён"); return; }
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(data.message || `Синхронизировано: ${data.created} новых заявок`);
        if (data.created > 0) fetchData();
      }
    } catch {
      toast.error("Ошибка синхронизации с Авито");
    } finally {
      setSyncing(false);
    }
  };

  const createWorkOrder = (order: Order) => {
    const params = new URLSearchParams({
      from_order: String(order.id),
      client: order.client,
      car: order.car,
      service: order.service,
    });
    if (order.client_id) params.set("client_id", String(order.client_id));
    navigate(`/work-orders?${params.toString()}`);
  };

  return (
    <Layout
      title="Заявки"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden sm:flex" onClick={syncAvito} disabled={syncing}>
            <Icon name="RefreshCw" size={16} className={`mr-1.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Синхронизация..." : "Авито"}
          </Button>
          <Button variant="outline" className="sm:hidden" size="sm" onClick={syncAvito} disabled={syncing}>
            <Icon name="RefreshCw" size={16} className={syncing ? "animate-spin" : ""} />
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white hidden sm:flex" onClick={openCreateDialog}>
            <Icon name="Plus" size={16} className="mr-1.5" />
            Новая заявка
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white sm:hidden" size="sm" onClick={openCreateDialog}>
            <Icon name="Plus" size={16} />
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Поиск по клиенту, авто или телефону..." className="pl-9 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
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
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={openCreateDialog}>
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
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => openEditDialog(order)}
                          >
                            <Icon name="Pencil" size={14} />
                          </Button>
                          {order.status === "approved" && (
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white h-8 text-xs"
                              onClick={() => createWorkOrder(order)}
                            >
                              <Icon name="FileText" size={14} className="mr-1" />
                              <span className="hidden sm:inline">Наряд</span>
                            </Button>
                          )}
                          <Select
                            value={order.status}
                            onValueChange={(v) => updateStatus(order.id, v as Order["status"])}
                          >
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">Новая</SelectItem>
                              <SelectItem value="contacted">Связались</SelectItem>
                              <SelectItem value="approved">Одобрена</SelectItem>
                              <SelectItem value="rejected">Отклонена</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
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
          <div className="space-y-3 pt-1">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Клиент *</label>
              {selectedClient ? (
                <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-blue-600">
                      {selectedClient.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{selectedClient.name}</div>
                    <div className="text-xs text-muted-foreground">{selectedClient.phone}</div>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0 h-7 w-7 p-0" onClick={clearClient}>
                    <Icon name="X" size={14} />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    ref={clientInputRef}
                    placeholder="Начните вводить имя или телефон..."
                    value={form.client}
                    autoComplete="off"
                    onChange={(e) => {
                      setForm((f) => ({ ...f, client: e.target.value }));
                      setClientSearch(e.target.value);
                      if (e.target.value.length >= 2) setClientDropdownOpen(true);
                      else setClientDropdownOpen(false);
                    }}
                    onFocus={() => { if (form.client.length >= 2 || clients.length > 0) setClientDropdownOpen(true); }}
                    onBlur={() => { setTimeout(() => setClientDropdownOpen(false), 150); }}
                  />
                  {clientDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredClients.length > 0 ? (
                        filteredClients.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
                            onMouseDown={(e) => { e.preventDefault(); selectClient(c); }}
                          >
                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-blue-600">
                                {c.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{c.name}</div>
                              <div className="text-xs text-muted-foreground">{c.phone}</div>
                            </div>
                            {c.cars.length > 0 && (
                              <span className="text-xs text-muted-foreground shrink-0">{c.cars.length} авто</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                          Клиент не найден — будет создан автоматически
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {!selectedClient && form.client && (
                <p className="text-xs text-blue-500 flex items-center gap-1">
                  <Icon name="Info" size={12} />
                  Новый клиент будет создан автоматически
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Телефон *</label>
              <Input
                placeholder="+7 (___) ___-__-__"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                disabled={!!selectedClient}
              />
              <p className="text-xs text-muted-foreground">Номер будет приведён к формату +7</p>
            </div>

            {selectedClient && selectedClient.cars.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Авто клиента</label>
                <div className="flex flex-wrap gap-2">
                  {selectedClient.cars.map((car) => (
                    <button
                      key={car.id}
                      type="button"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                        carForm.brand === car.brand && carForm.model === car.model
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-border text-foreground hover:bg-muted/50"
                      }`}
                      onClick={() => selectCar(car)}
                    >
                      <Icon name="Car" size={14} />
                      {car.brand} {car.model} {car.year}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <CarFields
              brand={carForm.brand}
              model={carForm.model}
              year={carForm.year}
              vin={carForm.vin}
              onBrandChange={(v) => setCarForm((p) => ({ ...p, brand: v, model: v !== p.brand ? "" : p.model }))}
              onModelChange={(v) => setCarForm((p) => ({ ...p, model: v }))}
              onYearChange={(v) => setCarForm((p) => ({ ...p, year: v }))}
              onVinChange={(v) => setCarForm((p) => ({ ...p, vin: v }))}
              showVin={!selectedClient}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Услуга</label>
              <Input placeholder="Что нужно сделать" value={form.service} onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Комментарий</label>
              <Textarea placeholder="Детали заявки" value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleCreate}>Создать</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать заявку {editingOrder?.number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Клиент *</label>
              <Input value={editForm.client} onChange={(e) => setEditForm((f) => ({ ...f, client: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Телефон *</label>
              <Input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Автомобиль</label>
              <Input placeholder="Марка модель год" value={editForm.car} onChange={(e) => setEditForm((f) => ({ ...f, car: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Услуга</label>
              <Input placeholder="Что нужно сделать" value={editForm.service} onChange={(e) => setEditForm((f) => ({ ...f, service: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Комментарий</label>
              <Textarea placeholder="Детали заявки" value={editForm.comment} onChange={(e) => setEditForm((f) => ({ ...f, comment: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleEdit}>Сохранить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Orders;