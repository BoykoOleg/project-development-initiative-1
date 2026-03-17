import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  WorkOrder,
  WorkItem,
  PartItem,
  statusConfig,
  getTotal,
} from "@/components/work-orders/types";
import WorkOrderCreateDialog from "@/components/work-orders/WorkOrderCreateDialog";
import { useResizableColumns } from "@/hooks/useResizableColumns";

const ResizeHandle = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) => (
  <div
    className="absolute right-0 top-0 h-full w-2 cursor-col-resize flex items-center justify-center group/handle select-none"
    onMouseDown={onMouseDown}
  >
    <div className="w-px h-4 bg-border group-hover/handle:bg-blue-400 transition-colors" />
  </div>
);

const WorkOrders = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { widths: colWidths, onMouseDown: onColMouseDown } = useResizableColumns([90, 100, 160, 150, 140, 130, 110, 100]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    client: "",
    car: "",
    master: "",
    order_id: "",
  });
  const [newWorks, setNewWorks] = useState<WorkItem[]>([
    { name: "", price: 0, qty: 1, norm_hours: 0, norm_hour_price: 0, discount: 0 },
  ]);
  const [newParts, setNewParts] = useState<PartItem[]>([
    { name: "", qty: 1, price: 0 },
  ]);

  const fetchWorkOrders = async () => {
    try {
      const url = getApiUrl("work-orders");
      if (!url) {
        setLoading(false);
        return;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.work_orders) setWorkOrders(data.work_orders);
    } catch {
      toast.error("Не удалось загрузить заказ-наряды");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  useEffect(() => {
    const fromCalendar = searchParams.get("from_calendar");
    if (fromCalendar) {
      setCreateForm({ client: fromCalendar, car: "", master: "", order_id: "" });
      setCreateOpen(true);
      setSearchParams({}, { replace: true });
      return;
    }
    const fromOrder = searchParams.get("from_order");
    if (fromOrder) {
      setCreateForm({
        client: searchParams.get("client") || "",
        car: searchParams.get("car") || "",
        master: "",
        order_id: fromOrder,
      });
      const svc = searchParams.get("service") || "";
      if (svc) {
        setNewWorks([{ name: svc, price: 0, qty: 1, norm_hours: 0, norm_hour_price: 0, discount: 0 }]);
      }
      setCreateOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filtered = workOrders.filter((wo) => {
    const matchFilter = filter === "all" || wo.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      wo.client.toLowerCase().includes(q) ||
      wo.car.toLowerCase().includes(q) ||
      wo.number.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const handleCreate = async () => {
    if (!createForm.client) {
      toast.error("Укажите клиента");
      return;
    }
    const works = newWorks.filter((w) => w.name.trim());
    const parts = newParts.filter((p) => p.name.trim());
    try {
      const url = getApiUrl("work-orders");
      if (!url) {
        toast.error("Бэкенд не подключён");
        return;
      }
      const payload: Record<string, unknown> = {
        action: "create",
        client: createForm.client,
        car: createForm.car,
        master: createForm.master,
        works,
        parts,
      };
      if (createForm.order_id) payload.order_id = Number(createForm.order_id);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.work_order) {
        setWorkOrders((prev) => [data.work_order, ...prev]);
        toast.success("Заказ-наряд создан");
      }
    } catch {
      toast.error("Ошибка при создании");
    }
    setCreateForm({ client: "", car: "", master: "", order_id: "" });
    setNewWorks([{ name: "", price: 0, qty: 1, norm_hours: 0, norm_hour_price: 0, discount: 0 }]);
    setNewParts([{ name: "", qty: 1, price: 0 }]);
    setCreateOpen(false);
  };

  const openCreateDialog = () => {
    setCreateForm({ client: "", car: "", master: "", order_id: "" });
    setNewWorks([{ name: "", price: 0, qty: 1, norm_hours: 0, norm_hour_price: 0, discount: 0 }]);
    setNewParts([{ name: "", qty: 1, price: 0 }]);
    setCreateOpen(true);
  };

  return (
    <Layout
      title="Заказ-наряды"
      actions={
        <>
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white hidden sm:flex"
            onClick={openCreateDialog}
          >
            <Icon name="Plus" size={14} className="mr-1.5" />
            Новый наряд
          </Button>
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white sm:hidden"
            size="sm"
            onClick={openCreateDialog}
          >
            <Icon name="Plus" size={16} />
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon
              name="Search"
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Поиск по номеру, клиенту или авто..."
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                className={
                  filter === f.value
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : ""
                }
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Загрузка...
          </div>
        ) : workOrders.length === 0 && !search ? (
          <div className="bg-white rounded-xl border border-border shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="FileText" size={28} className="text-blue-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              Заказ-нарядов пока нет
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Создайте первый заказ-наряд
            </p>
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => setCreateOpen(true)}
            >
              <Icon name="Plus" size={16} className="mr-1.5" />
              Создать наряд
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-fixed w-full">
                <colgroup>
                  {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
                </colgroup>
                <thead>
                  <tr className="border-b border-border">
                    {["Номер", "Дата", "Клиент", "Авто", "Мастер приемщик", "Ответственный", "Статус", "Сумма"].map((label, i) => (
                      <th
                        key={i}
                        className={`text-left text-xs font-medium text-muted-foreground px-4 py-2 relative overflow-hidden${i === 1 || i === 3 ? " hidden sm:table-cell" : ""}${i === 4 ? " hidden md:table-cell" : ""}${i === 5 ? " hidden lg:table-cell" : ""}${i === 7 ? " text-right" : ""}`}
                      >
                        <span className="block truncate">{label}</span>
                        {i < 7 && <ResizeHandle onMouseDown={onColMouseDown(i)} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((wo) => (
                    <tr
                      key={wo.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/work-orders/${wo.id}`)}
                    >
                      <td className="px-4 py-2 overflow-hidden">
                        <span className="text-sm font-medium text-blue-600 block truncate">{wo.number}</span>
                      </td>
                      <td className="px-4 py-2 hidden sm:table-cell overflow-hidden">
                        <span className="text-sm text-foreground block truncate">{wo.date}</span>
                        {wo.issued_at && (
                          <div className="text-[10px] text-muted-foreground truncate">Выдан: {new Date(wo.issued_at).toLocaleDateString("ru-RU")}</div>
                        )}
                      </td>
                      <td className="px-4 py-2 overflow-hidden">
                        <span className="text-sm text-foreground block truncate">{wo.client}</span>
                      </td>
                      <td className="px-4 py-2 hidden sm:table-cell overflow-hidden">
                        <span className="text-sm text-foreground block truncate">{wo.car || "—"}</span>
                      </td>
                      <td className="px-4 py-2 hidden md:table-cell overflow-hidden">
                        <span className="text-sm text-foreground block truncate">
                          {wo.master || <span className="text-amber-500">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-2 hidden lg:table-cell overflow-hidden">
                        <span className="text-sm text-foreground block truncate">
                          {wo.employee_name || <span className="text-muted-foreground">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-2 overflow-hidden">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[wo.status]?.className}`}>
                          {statusConfig[wo.status]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right overflow-hidden">
                        <span className="text-sm font-medium text-foreground">
                          {getTotal(wo).toLocaleString("ru-RU")} ₽
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-sm text-muted-foreground">
                Заказ-наряды не найдены
              </div>
            )}
          </div>
        )}
      </div>

      <WorkOrderCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        createForm={createForm}
        setCreateForm={setCreateForm}
        newWorks={newWorks}
        setNewWorks={setNewWorks}
        newParts={newParts}
        setNewParts={setNewParts}
        onSubmit={handleCreate}
      />
    </Layout>
  );
};

export default WorkOrders;