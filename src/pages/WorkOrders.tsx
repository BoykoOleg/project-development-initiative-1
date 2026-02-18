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
import Layout from "@/components/Layout";

interface WorkItem {
  name: string;
  price: number;
}

interface PartItem {
  name: string;
  qty: number;
  price: number;
}

interface WorkOrder {
  id: string;
  date: string;
  client: string;
  car: string;
  status: "new" | "in-progress" | "done" | "issued";
  works: WorkItem[];
  parts: PartItem[];
  master: string;
}

const initialWorkOrders: WorkOrder[] = [
  {
    id: "ЗН-0042", date: "18.02.2026", client: "Иванов А.С.", car: "Toyota Camry 2020",
    status: "in-progress", master: "Алексей К.",
    works: [{ name: "Установка сигнализации StarLine A93", price: 5000 }, { name: "Прокладка проводки", price: 2000 }],
    parts: [{ name: "StarLine A93", qty: 1, price: 9500 }, { name: "Провод 2.5мм, 10м", qty: 1, price: 500 }, { name: "Крепёж комплект", qty: 1, price: 300 }],
  },
  {
    id: "ЗН-0041", date: "17.02.2026", client: "Петров В.И.", car: "Kia Rio 2022",
    status: "done", master: "Сергей М.",
    works: [{ name: "Тонировка задних стёкол", price: 4000 }, { name: "Тонировка багажника", price: 2000 }],
    parts: [{ name: "Плёнка тонировочная 35%, 3м", qty: 1, price: 2000 }],
  },
  {
    id: "ЗН-0040", date: "16.02.2026", client: "Сидорова М.К.", car: "BMW X5 2021",
    status: "done", master: "Алексей К.",
    works: [{ name: "Шумоизоляция дверей (4шт)", price: 12000 }, { name: "Шумоизоляция пола", price: 15000 }, { name: "Шумоизоляция потолка", price: 8000 }],
    parts: [{ name: "STP Вибропласт Gold", qty: 8, price: 800 }, { name: "STP Accent Premium", qty: 6, price: 600 }],
  },
  {
    id: "ЗН-0039", date: "15.02.2026", client: "Козлов Д.А.", car: "Hyundai Creta 2023",
    status: "new", master: "",
    works: [{ name: "Установка магнитолы Pioneer", price: 3000 }],
    parts: [{ name: "Pioneer MVH-S120", qty: 1, price: 7500 }, { name: "Рамка переходная", qty: 1, price: 1200 }],
  },
  {
    id: "ЗН-0038", date: "14.02.2026", client: "Николаев П.Р.", car: "Lada Vesta 2024",
    status: "in-progress", master: "Дмитрий П.",
    works: [{ name: "Установка парктроника", price: 2500 }],
    parts: [{ name: "Парктроник ParkMaster 4DJ", qty: 1, price: 3500 }],
  },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  "new": { label: "Новый", className: "bg-purple-100 text-purple-700" },
  "in-progress": { label: "В работе", className: "bg-blue-100 text-blue-700" },
  "done": { label: "Готов", className: "bg-green-100 text-green-700" },
  "issued": { label: "Выдан", className: "bg-gray-100 text-gray-700" },
};

const WorkOrders = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initialWorkOrders);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = workOrders.filter((wo) => {
    const matchFilter = filter === "all" || wo.status === filter;
    const matchSearch = !search || wo.client.toLowerCase().includes(search.toLowerCase()) || wo.car.toLowerCase().includes(search.toLowerCase()) || wo.id.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const getTotal = (wo: WorkOrder) => {
    const worksTotal = wo.works.reduce((s, w) => s + w.price, 0);
    const partsTotal = wo.parts.reduce((s, p) => s + p.price * p.qty, 0);
    return worksTotal + partsTotal;
  };

  const updateStatus = (id: string, status: WorkOrder["status"]) => {
    setWorkOrders(workOrders.map((wo) => (wo.id === id ? { ...wo, status } : wo)));
  };

  return (
    <Layout title="Заказ-наряды">
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((wo) => (
            <div
              key={wo.id}
              className="bg-white rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedOrder(wo)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-blue-600">{wo.id}</span>
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
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Заказ-наряд {selectedOrder.id}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Клиент</div>
                    <div className="font-medium">{selectedOrder.client}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Автомобиль</div>
                    <div className="font-medium">{selectedOrder.car}</div>
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

                <div>
                  <div className="text-sm font-medium text-foreground mb-2">Запчасти и материалы</div>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    {selectedOrder.parts.map((p, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-foreground">{p.name} × {p.qty}</span>
                        <span className="font-medium shrink-0 ml-2">{(p.price * p.qty).toLocaleString("ru-RU")} ₽</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="text-sm font-medium">Итого:</span>
                  <span className="text-lg font-bold text-foreground">
                    {getTotal(selectedOrder).toLocaleString("ru-RU")} ₽
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(v) => {
                      updateStatus(selectedOrder.id, v as WorkOrder["status"]);
                      setSelectedOrder({ ...selectedOrder, status: v as WorkOrder["status"] });
                    }}
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
    </Layout>
  );
};

export default WorkOrders;