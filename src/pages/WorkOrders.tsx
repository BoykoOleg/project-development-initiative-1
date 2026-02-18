import { useState, useEffect } from "react";
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
import Layout from "@/components/Layout";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";

interface WorkItem {
  id?: number;
  name: string;
  price: number;
}

interface PartItem {
  id?: number;
  name: string;
  qty: number;
  price: number;
}

interface WorkOrder {
  id: number;
  number: string;
  date: string;
  client: string;
  car: string;
  status: "new" | "in-progress" | "done" | "issued";
  works: WorkItem[];
  parts: PartItem[];
  master: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  "new": { label: "Новый", className: "bg-purple-100 text-purple-700" },
  "in-progress": { label: "В работе", className: "bg-blue-100 text-blue-700" },
  "done": { label: "Готов", className: "bg-green-100 text-green-700" },
  "issued": { label: "Выдан", className: "bg-gray-100 text-gray-700" },
};

const WorkOrders = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ client: "", car: "", master: "" });
  const [newWorks, setNewWorks] = useState<WorkItem[]>([{ name: "", price: 0 }]);
  const [newParts, setNewParts] = useState<PartItem[]>([{ name: "", qty: 1, price: 0 }]);

  const fetchWorkOrders = async () => {
    try {
      const url = getApiUrl("work-orders");
      if (!url) { setLoading(false); return; }
      const res = await fetch(url);
      const data = await res.json();
      if (data.work_orders) setWorkOrders(data.work_orders);
    } catch {
      toast.error("Не удалось загрузить заказ-наряды");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkOrders(); }, []);

  const filtered = workOrders.filter((wo) => {
    const matchFilter = filter === "all" || wo.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !search || wo.client.toLowerCase().includes(q) || wo.car.toLowerCase().includes(q) || wo.number.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const getTotal = (wo: WorkOrder) => {
    const worksTotal = wo.works.reduce((s, w) => s + w.price, 0);
    const partsTotal = wo.parts.reduce((s, p) => s + p.price * p.qty, 0);
    return worksTotal + partsTotal;
  };

  const updateStatus = async (woId: number, status: WorkOrder["status"]) => {
    setWorkOrders(workOrders.map((wo) => (wo.id === woId ? { ...wo, status } : wo)));
    if (selectedOrder?.id === woId) setSelectedOrder({ ...selectedOrder, status });
    try {
      const url = getApiUrl("work-orders");
      if (!url) return;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", work_order_id: woId, status }),
      });
    } catch {
      toast.error("Ошибка при смене статуса");
    }
  };

  const handleCreate = async () => {
    if (!createForm.client) { toast.error("Укажите клиента"); return; }
    const works = newWorks.filter((w) => w.name.trim());
    const parts = newParts.filter((p) => p.name.trim());
    try {
      const url = getApiUrl("work-orders");
      if (!url) { toast.error("Бэкенд не подключён"); return; }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...createForm, works, parts }),
      });
      const data = await res.json();
      if (data.work_order) {
        setWorkOrders([data.work_order, ...workOrders]);
        toast.success("Заказ-наряд создан");
      }
    } catch {
      toast.error("Ошибка при создании");
    }
    setCreateForm({ client: "", car: "", master: "" });
    setNewWorks([{ name: "", price: 0 }]);
    setNewParts([{ name: "", qty: 1, price: 0 }]);
    setCreateOpen(false);
  };

  return (
    <Layout
      title="Заказ-наряды"
      actions={
        <>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white hidden sm:flex" onClick={() => setCreateOpen(true)}>
            <Icon name="Plus" size={16} className="mr-1.5" />
            Новый наряд
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white sm:hidden" size="sm" onClick={() => setCreateOpen(true)}>
            <Icon name="Plus" size={16} />
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Поиск по номеру, клиенту или авто..." className="pl-9 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: "Все" },
              { value: "new", label: "Новые" },
              { value: "in-progress", label: "В работе" },
              { value: "done", label: "Готовы" },
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
        ) : workOrders.length === 0 && !search ? (
          <div className="bg-white rounded-xl border border-border shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="FileText" size={28} className="text-blue-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Заказ-нарядов пока нет</h3>
            <p className="text-sm text-muted-foreground mb-4">Создайте первый заказ-наряд</p>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => setCreateOpen(true)}>
              <Icon name="Plus" size={16} className="mr-1.5" />
              Создать наряд
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((wo) => (
              <div
                key={wo.id}
                className="bg-white rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedOrder(wo)}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-blue-600">{wo.number}</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[wo.status]?.className}`}>
                    {statusConfig[wo.status]?.label}
                  </span>
                </div>
                <div className="text-sm font-medium text-foreground mb-1">{wo.client}</div>
                <div className="text-sm text-muted-foreground mb-3">{wo.car}</div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    {wo.master ? (
                      <span className="flex items-center gap-1">
                        <Icon name="User" size={12} />
                        {wo.master}
                      </span>
                    ) : (
                      <span className="text-amber-500">Мастер не назначен</span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {getTotal(wo).toLocaleString("ru-RU")} ₽
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {wo.works.length} работ, {wo.parts.length} запчастей
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
                Заказ-наряды не найдены
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Заказ-наряд {selectedOrder.number}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Клиент</div>
                    <div className="font-medium">{selectedOrder.client}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Автомобиль</div>
                    <div className="font-medium">{selectedOrder.car || "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Дата</div>
                    <div className="font-medium">{selectedOrder.date}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Мастер</div>
                    <div className="font-medium">{selectedOrder.master || "—"}</div>
                  </div>
                </div>

                {selectedOrder.works.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-foreground mb-2">Работы</div>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      {selectedOrder.works.map((w, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-foreground">{w.name}</span>
                          <span className="font-medium shrink-0 ml-2">{w.price.toLocaleString("ru-RU")} ₽</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedOrder.parts.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-foreground mb-2">Запчасти и материалы</div>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      {selectedOrder.parts.map((p, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-foreground">{p.name} x {p.qty}</span>
                          <span className="font-medium shrink-0 ml-2">{(p.price * p.qty).toLocaleString("ru-RU")} ₽</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="text-sm font-medium">Итого:</span>
                  <span className="text-lg font-bold text-foreground">
                    {getTotal(selectedOrder).toLocaleString("ru-RU")} ₽
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(v) => updateStatus(selectedOrder.id, v as WorkOrder["status"])}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Новый</SelectItem>
                      <SelectItem value="in-progress">В работе</SelectItem>
                      <SelectItem value="done">Готов</SelectItem>
                      <SelectItem value="issued">Выдан</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => setSelectedOrder(null)}>Закрыть</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Новый заказ-наряд</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Клиент *</label>
                <Input placeholder="ФИО клиента" value={createForm.client} onChange={(e) => setCreateForm({ ...createForm, client: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Автомобиль</label>
                <Input placeholder="Марка модель год" value={createForm.car} onChange={(e) => setCreateForm({ ...createForm, car: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Мастер</label>
              <Input placeholder="Имя мастера" value={createForm.master} onChange={(e) => setCreateForm({ ...createForm, master: e.target.value })} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Работы</label>
                <Button variant="ghost" size="sm" onClick={() => setNewWorks([...newWorks, { name: "", price: 0 }])}>
                  <Icon name="Plus" size={14} className="mr-1" />Добавить
                </Button>
              </div>
              <div className="space-y-2">
                {newWorks.map((w, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Название работы"
                      className="flex-1"
                      value={w.name}
                      onChange={(e) => { const u = [...newWorks]; u[i] = { ...u[i], name: e.target.value }; setNewWorks(u); }}
                    />
                    <Input
                      type="number"
                      placeholder="Цена"
                      className="w-28"
                      value={w.price || ""}
                      onChange={(e) => { const u = [...newWorks]; u[i] = { ...u[i], price: Number(e.target.value) }; setNewWorks(u); }}
                    />
                    {newWorks.length > 1 && (
                      <Button variant="ghost" size="sm" className="shrink-0 text-red-500" onClick={() => setNewWorks(newWorks.filter((_, j) => j !== i))}>
                        <Icon name="X" size={14} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Запчасти</label>
                <Button variant="ghost" size="sm" onClick={() => setNewParts([...newParts, { name: "", qty: 1, price: 0 }])}>
                  <Icon name="Plus" size={14} className="mr-1" />Добавить
                </Button>
              </div>
              <div className="space-y-2">
                {newParts.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Название"
                      className="flex-1"
                      value={p.name}
                      onChange={(e) => { const u = [...newParts]; u[i] = { ...u[i], name: e.target.value }; setNewParts(u); }}
                    />
                    <Input
                      type="number"
                      placeholder="Кол-во"
                      className="w-20"
                      value={p.qty || ""}
                      onChange={(e) => { const u = [...newParts]; u[i] = { ...u[i], qty: Number(e.target.value) }; setNewParts(u); }}
                    />
                    <Input
                      type="number"
                      placeholder="Цена"
                      className="w-28"
                      value={p.price || ""}
                      onChange={(e) => { const u = [...newParts]; u[i] = { ...u[i], price: Number(e.target.value) }; setNewParts(u); }}
                    />
                    {newParts.length > 1 && (
                      <Button variant="ghost" size="sm" className="shrink-0 text-red-500" onClick={() => setNewParts(newParts.filter((_, j) => j !== i))}>
                        <Icon name="X" size={14} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleCreate}>Создать</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default WorkOrders;