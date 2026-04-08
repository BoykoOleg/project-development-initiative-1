import { useState, useEffect, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Order, Client, Car } from "@/components/orders/types";
import OrdersKanban from "@/components/orders/OrdersKanban";
import OrderCreateDialog from "@/components/orders/OrderCreateDialog";
import OrderEditDialog from "@/components/orders/OrderEditDialog";

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [form, setForm] = useState({ client: "", phone: "", car: "", service: "", comment: "" });
  const [carForm, setCarForm] = useState({ brand: "", model: "", year: "", vin: "", license_plate: "" });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({ client: "", phone: "", car: "", service: "", comment: "" });
  const [syncing, setSyncing] = useState(false);
  const [recognizing, setRecognizing] = useState(false);

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
    if (!search) return true;
    const q = search.toLowerCase();
    return o.client.toLowerCase().includes(q) || o.car.toLowerCase().includes(q) || o.phone.includes(q);
  });

  const openCreateDialog = () => {
    setSelectedClientId(null);
    setClientSearch("");
    setForm({ client: "", phone: "", car: "", service: "", comment: "" });
    setCarForm({ brand: "", model: "", year: "", vin: "", license_plate: "" });
    setDialogOpen(true);
  };

  const selectClient = (client: Client) => {
    setSelectedClientId(client.id);
    setForm((f) => ({ ...f, client: client.name, phone: client.phone }));
    setCarForm({ brand: "", model: "", year: "", vin: "", license_plate: "" });
    setClientSearch("");
    setClientDropdownOpen(false);
  };

  const clearClient = () => {
    setSelectedClientId(null);
    setForm((f) => ({ ...f, client: "", phone: "", car: "" }));
    setCarForm({ brand: "", model: "", year: "", vin: "", license_plate: "" });
  };

  const selectCar = (car: Car) => {
    setForm((f) => ({ ...f, car: `${car.brand} ${car.model} ${car.year}`.trim() }));
    setCarForm({ brand: car.brand, model: car.model, year: car.year, vin: car.vin, license_plate: car.license_plate || "" });
  };

  const compressImage = (file: File, maxSize = 1280): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoRecognize = async (file: File) => {
    setRecognizing(true);
    try {
      const base64 = await compressImage(file);

      const url = getApiUrl("photo-recognize");
      if (!url) { toast.error("Бэкенд не подключён"); return; }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      const text = await res.text();
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Photo recognize raw response:", res.status, text.slice(0, 300));
        toast.error(`Ошибка сервера (${res.status})`);
        return;
      }

      if (data.error) {
        toast.error(String(data.error));
        return;
      }

      const r = data.recognized;
      if (!r) {
        toast.error("Не удалось распознать данные");
        return;
      }

      let filled = 0;
      if (r.client_name && !form.client) {
        setForm((f) => ({ ...f, client: r.client_name }));
        filled++;
      }
      if (r.phone && !form.phone) {
        setForm((f) => ({ ...f, phone: r.phone }));
        filled++;
      }
      if (r.brand) {
        setCarForm((p) => ({ ...p, brand: r.brand }));
        filled++;
      }
      if (r.model) {
        setCarForm((p) => ({ ...p, model: r.model }));
        filled++;
      }
      if (r.year) {
        setCarForm((p) => ({ ...p, year: r.year }));
        filled++;
      }
      if (r.vin) {
        setCarForm((p) => ({ ...p, vin: r.vin }));
        filled++;
      }
      const commentParts: string[] = [];
      if (r.gos_number) {
        setCarForm((p) => ({ ...p, license_plate: r.gos_number }));
        filled++;
      }
      if (r.comment) commentParts.push(r.comment);
      if (commentParts.length) {
        setForm((f) => ({
          ...f,
          comment: f.comment ? f.comment + "\n" + commentParts.join(". ") : commentParts.join(". "),
        }));
        filled++;
      }

      if (filled > 0) {
        toast.success(`Распознано ${filled} ${filled === 1 ? "поле" : filled < 5 ? "поля" : "полей"}`);
      } else {
        toast.info("На фото не удалось распознать данные для формы");
      }
    } catch (e) {
      console.error("Photo recognize error:", e);
      toast.error("Ошибка сети при распознавании фото");
    } finally {
      setRecognizing(false);
    }
  };

  const handleCreate = async () => {
    if (!form.client) {
      toast.error("Заполните имя клиента");
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
    setCarForm({ brand: "", model: "", year: "", vin: "", license_plate: "" });
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
    try {
      const url = getApiUrl("orders");
      if (!url) { toast.error("Бэкенд не подключён"); return; }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", order_id: editingOrder.id, comment: editForm.comment }),
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

  const deleteOrder = async (orderId: number) => {
    try {
      const url = getApiUrl("orders");
      if (!url) return;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", order_id: orderId }),
      });
      setOrders(orders.filter((o) => o.id !== orderId));
      toast.success("Заявка удалена");
    } catch {
      toast.error("Ошибка при удалении заявки");
    }
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
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Поиск по клиенту, авто или телефону..." className="pl-9 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Icon name="Loader2" size={24} className="animate-spin mr-2" />
            Загрузка...
          </div>
        ) : (
          <OrdersKanban
            orders={filtered}
            onStatusChange={updateStatus}
            onEdit={openEditDialog}
            onCreateWorkOrder={createWorkOrder}
            onDelete={deleteOrder}
          />
        )}
      </div>

      <OrderCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        setForm={setForm}
        carForm={carForm}
        setCarForm={setCarForm}
        selectedClient={selectedClient}
        filteredClients={filteredClients}
        clientSearch={clientSearch}
        setClientSearch={setClientSearch}
        clientDropdownOpen={clientDropdownOpen}
        setClientDropdownOpen={setClientDropdownOpen}
        recognizing={recognizing}
        onSelectClient={selectClient}
        onClearClient={clearClient}
        onSelectCar={selectCar}
        onPhotoRecognize={handlePhotoRecognize}
        onSubmit={handleCreate}
      />

      <OrderEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editingOrder={editingOrder}
        editForm={editForm}
        setEditForm={setEditForm}
        onSubmit={handleEdit}
      />
    </Layout>
  );
};

export default Orders;