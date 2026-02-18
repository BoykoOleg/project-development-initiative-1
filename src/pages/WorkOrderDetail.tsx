import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { WorkOrder, WorkItem, PartItem, statusConfig, getTotal } from "@/components/work-orders/types";

interface Cashbox {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
}

interface Payment {
  id: number;
  amount: number;
  payment_method: string;
  cashbox_name: string;
  created_at: string;
}

const methodLabels: Record<string, string> = {
  cash: "Наличные",
  card: "Карта",
  transfer: "Перевод",
  online: "Онлайн",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

const WorkOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [addWorkForm, setAddWorkForm] = useState({ name: "", price: 0 });
  const [addPartForm, setAddPartForm] = useState({ name: "", qty: 1, price: 0 });
  const [editingMaster, setEditingMaster] = useState(false);
  const [masterValue, setMasterValue] = useState("");

  const [editingWorkId, setEditingWorkId] = useState<number | null>(null);
  const [editWorkForm, setEditWorkForm] = useState({ name: "", price: 0 });
  const [editingPartId, setEditingPartId] = useState<number | null>(null);
  const [editPartForm, setEditPartForm] = useState({ name: "", qty: 1, price: 0 });

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, payment_method: "cash", cashbox_id: 0, comment: "" });

  const fetchWorkOrder = async () => {
    try {
      const url = getApiUrl("work-orders");
      if (!url) { setLoading(false); setNotFound(true); return; }
      const res = await fetch(url);
      const data = await res.json();
      if (data.work_orders) {
        const found = data.work_orders.find((wo: WorkOrder) => wo.id === Number(id));
        if (found) { setWorkOrder(found); setMasterValue(found.master || ""); }
        else setNotFound(true);
      } else setNotFound(true);
    } catch {
      toast.error("Не удалось загрузить заказ-наряд");
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkOrder(); }, [id]);

  const apiCall = async (body: Record<string, unknown>) => {
    const url = getApiUrl("work-orders");
    if (!url) return null;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const handleStatusChange = async (status: WorkOrder["status"]) => {
    if (!workOrder) return;
    setWorkOrder((prev) => (prev ? { ...prev, status } : prev));
    try {
      await apiCall({ action: "update", work_order_id: workOrder.id, status });
      toast.success("Статус обновлён");
    } catch { toast.error("Ошибка при смене статуса"); }
  };

  const handleUpdateMaster = async () => {
    if (!workOrder) return;
    setWorkOrder((prev) => (prev ? { ...prev, master: masterValue } : prev));
    setEditingMaster(false);
    try {
      await apiCall({ action: "update", work_order_id: workOrder.id, master: masterValue });
      toast.success("Мастер обновлён");
    } catch { toast.error("Ошибка"); }
  };

  const handleAddWork = async () => {
    if (!addWorkForm.name.trim() || !workOrder) return;
    try {
      const data = await apiCall({ action: "add_work", work_order_id: workOrder.id, ...addWorkForm });
      if (data?.work) {
        setWorkOrder((prev) => prev ? { ...prev, works: [...prev.works, data.work] } : prev);
        toast.success("Работа добавлена");
      }
    } catch { toast.error("Ошибка"); }
    setAddWorkForm({ name: "", price: 0 });
  };

  const handleUpdateWork = async (w: WorkItem) => {
    if (!editWorkForm.name.trim()) return;
    try {
      const data = await apiCall({ action: "update_work", work_id: w.id, name: editWorkForm.name, price: editWorkForm.price });
      if (data?.work) {
        setWorkOrder((prev) => prev ? { ...prev, works: prev.works.map((x) => x.id === w.id ? data.work : x) } : prev);
        toast.success("Работа обновлена");
      }
    } catch { toast.error("Ошибка"); }
    setEditingWorkId(null);
  };

  const handleDeleteWork = async (w: WorkItem) => {
    if (!workOrder) return;
    try {
      await apiCall({ action: "delete_work", work_id: w.id });
      setWorkOrder((prev) => prev ? { ...prev, works: prev.works.filter((x) => x.id !== w.id) } : prev);
      toast.success("Работа удалена");
    } catch { toast.error("Ошибка"); }
  };

  const handleAddPart = async () => {
    if (!addPartForm.name.trim() || !workOrder) return;
    try {
      const data = await apiCall({ action: "add_part", work_order_id: workOrder.id, ...addPartForm });
      if (data?.part) {
        setWorkOrder((prev) => prev ? { ...prev, parts: [...prev.parts, data.part] } : prev);
        toast.success("Запчасть добавлена");
      }
    } catch { toast.error("Ошибка"); }
    setAddPartForm({ name: "", qty: 1, price: 0 });
  };

  const handleUpdatePart = async (p: PartItem) => {
    if (!editPartForm.name.trim()) return;
    try {
      const data = await apiCall({ action: "update_part", part_id: p.id, name: editPartForm.name, qty: editPartForm.qty, price: editPartForm.price });
      if (data?.part) {
        setWorkOrder((prev) => prev ? { ...prev, parts: prev.parts.map((x) => x.id === p.id ? data.part : x) } : prev);
        toast.success("Запчасть обновлена");
      }
    } catch { toast.error("Ошибка"); }
    setEditingPartId(null);
  };

  const handleDeletePart = async (p: PartItem) => {
    if (!workOrder) return;
    try {
      await apiCall({ action: "delete_part", part_id: p.id });
      setWorkOrder((prev) => prev ? { ...prev, parts: prev.parts.filter((x) => x.id !== p.id) } : prev);
      toast.success("Запчасть удалена");
    } catch { toast.error("Ошибка"); }
  };

  const fetchCashboxes = async () => {
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(`${url}?section=cashboxes`);
      const data = await res.json();
      if (data.cashboxes) {
        const active = data.cashboxes.filter((c: Cashbox) => c.is_active);
        setCashboxes(active);
        if (active.length > 0 && !paymentForm.cashbox_id) {
          setPaymentForm((f) => ({ ...f, cashbox_id: active[0].id }));
        }
      }
    } catch { /* ignore */ }
  };

  const fetchPayments = async () => {
    if (!id) return;
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(`${url}?section=payments&work_order_id=${id}`);
      const data = await res.json();
      if (data.payments) setPayments(data.payments);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchCashboxes(); fetchPayments(); }, [id]);

  const openPaymentDialog = () => {
    const t = workOrder ? getTotal(workOrder) : 0;
    const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
    setPaymentForm({ amount: Math.max(0, t - paid), payment_method: "cash", cashbox_id: cashboxes[0]?.id || 0, comment: "" });
    setPaymentDialogOpen(true);
  };

  const handlePayment = async () => {
    if (!workOrder || !paymentForm.amount || !paymentForm.cashbox_id) {
      toast.error("Укажите сумму и выберите кассу");
      return;
    }
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_payment", work_order_id: workOrder.id, ...paymentForm }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success("Оплата принята");
      setPaymentDialogOpen(false);
      fetchPayments();
    } catch { toast.error("Ошибка при приёме оплаты"); }
  };

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);

  if (loading) {
    return (
      <Layout title="Заказ-наряд">
        <div className="flex items-center justify-center py-20">
          <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Загрузка...</span>
        </div>
      </Layout>
    );
  }

  if (notFound || !workOrder) {
    return (
      <Layout title="Заказ-наряд не найден">
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Icon name="FileX" size={48} className="text-muted-foreground" />
          <p className="text-muted-foreground text-lg">Заказ-наряд не найден</p>
          <Button variant="outline" onClick={() => navigate("/work-orders")}>
            <Icon name="ArrowLeft" size={16} className="mr-1.5" />
            К списку заказ-нарядов
          </Button>
        </div>
      </Layout>
    );
  }

  const statusInfo = statusConfig[workOrder.status];
  const total = getTotal(workOrder);
  const isIssued = workOrder.status === "issued";
  const worksTotal = workOrder.works.reduce((s, w) => s + w.price, 0);
  const partsTotal = workOrder.parts.reduce((s, p) => s + p.price * p.qty, 0);

  return (
    <Layout
      title={`Заказ-наряд ${workOrder.number}`}
      actions={
        <Button variant="outline" size="sm" onClick={() => navigate("/work-orders")}>
          <Icon name="ArrowLeft" size={16} className="mr-1.5" />
          <span className="hidden sm:inline">К списку</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* === ШАПКА: клиент + сумма + статус === */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Клиент</div>
                <div className="text-sm font-semibold text-foreground">{workOrder.client}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Автомобиль</div>
                <div className="text-sm font-semibold text-foreground">{workOrder.car || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Дата</div>
                <div className="text-sm font-semibold text-foreground">{workOrder.date}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Мастер</div>
                {editingMaster ? (
                  <div className="flex gap-1.5">
                    <Input
                      value={masterValue}
                      onChange={(e) => setMasterValue(e.target.value)}
                      className="h-7 text-sm"
                      placeholder="Имя мастера"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdateMaster();
                        if (e.key === "Escape") { setEditingMaster(false); setMasterValue(workOrder.master || ""); }
                      }}
                      autoFocus
                    />
                    <Button size="sm" className="h-7 w-7 p-0 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleUpdateMaster}>
                      <Icon name="Check" size={12} />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="text-sm font-semibold text-foreground flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors group"
                    onClick={() => setEditingMaster(true)}
                  >
                    <span>{workOrder.master || "—"}</span>
                    <Icon name="Pencil" size={11} className="text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 lg:gap-6 shrink-0">
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-0.5">Итого</div>
                <div className="text-xl font-bold text-foreground">{fmt(total)}</div>
                {totalPaid > 0 && (
                  <div className="text-xs text-green-600 font-medium">Оплачено: {fmt(totalPaid)}</div>
                )}
              </div>

              <div>
                <Select
                  value={workOrder.status}
                  onValueChange={(v) => handleStatusChange(v as WorkOrder["status"])}
                >
                  <SelectTrigger className="w-[140px]">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Новый</SelectItem>
                    <SelectItem value="in-progress">В работе</SelectItem>
                    <SelectItem value="done">Готов</SelectItem>
                    <SelectItem value="issued">Выдан</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* === РАБОТЫ === */}
        <div className="bg-white rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Работы
            </h3>
            <span className="text-sm font-semibold text-foreground">{fmt(worksTotal)}</span>
          </div>

          {workOrder.works.length > 0 ? (
            <div className="divide-y divide-border">
              {workOrder.works.map((w, i) => (
                <div key={w.id || i}>
                  {editingWorkId === w.id ? (
                    <div className="flex items-center gap-2 px-5 py-3">
                      <span className="text-sm text-muted-foreground w-8 shrink-0">{i + 1}.</span>
                      <Input
                        className="flex-1 h-9"
                        value={editWorkForm.name}
                        onChange={(e) => setEditWorkForm((f) => ({ ...f, name: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") handleUpdateWork(w); if (e.key === "Escape") setEditingWorkId(null); }}
                        autoFocus
                      />
                      <Input
                        type="number"
                        className="w-28 h-9"
                        value={editWorkForm.price || ""}
                        onChange={(e) => setEditWorkForm((f) => ({ ...f, price: Number(e.target.value) }))}
                        onKeyDown={(e) => { if (e.key === "Enter") handleUpdateWork(w); }}
                      />
                      <Button size="sm" className="h-9 bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleUpdateWork(w)}>
                        <Icon name="Check" size={14} />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-9" onClick={() => setEditingWorkId(null)}>
                        <Icon name="X" size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center px-5 py-3 group hover:bg-muted/30">
                      <span className="text-sm text-muted-foreground w-8 shrink-0">{i + 1}.</span>
                      <span className="flex-1 text-sm text-foreground">{w.name}</span>
                      <span className="text-sm font-semibold text-foreground shrink-0 ml-4">
                        {w.price.toLocaleString("ru-RU")} ₽
                      </span>
                      {!isIssued && (
                        <div className="flex gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm" variant="ghost" className="h-7 w-7 p-0"
                            onClick={() => { setEditingWorkId(w.id!); setEditWorkForm({ name: w.name, price: w.price }); }}
                          >
                            <Icon name="Pencil" size={13} className="text-muted-foreground" />
                          </Button>
                          <Button
                            size="sm" variant="ghost" className="h-7 w-7 p-0"
                            onClick={() => handleDeleteWork(w)}
                          >
                            <Icon name="Trash2" size={13} className="text-red-400" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-8 text-center">Работы не добавлены</div>
          )}

          {!isIssued && (
            <div className="flex gap-2 px-5 py-3 border-t border-border">
              <Input
                placeholder="Название работы"
                className="flex-1"
                value={addWorkForm.name}
                onChange={(e) => setAddWorkForm((p) => ({ ...p, name: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddWork(); }}
              />
              <Input
                type="number"
                placeholder="Цена"
                className="w-28"
                value={addWorkForm.price || ""}
                onChange={(e) => setAddWorkForm((p) => ({ ...p, price: Number(e.target.value) }))}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddWork(); }}
              />
              <Button className="bg-blue-500 hover:bg-blue-600 text-white shrink-0" onClick={handleAddWork}>
                <Icon name="Plus" size={16} className="mr-1.5" />
                <span className="hidden sm:inline">Добавить</span>
              </Button>
            </div>
          )}
        </div>

        {/* === ЗАПЧАСТИ === */}
        <div className="bg-white rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Запчасти и материалы
            </h3>
            <span className="text-sm font-semibold text-foreground">{fmt(partsTotal)}</span>
          </div>

          {workOrder.parts.length > 0 ? (
            <div className="divide-y divide-border">
              {workOrder.parts.map((p, i) => (
                <div key={p.id || i}>
                  {editingPartId === p.id ? (
                    <div className="flex items-center gap-2 px-5 py-3">
                      <span className="text-sm text-muted-foreground w-8 shrink-0">{i + 1}.</span>
                      <Input
                        className="flex-1 h-9"
                        value={editPartForm.name}
                        onChange={(e) => setEditPartForm((f) => ({ ...f, name: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") handleUpdatePart(p); if (e.key === "Escape") setEditingPartId(null); }}
                        autoFocus
                      />
                      <Input
                        type="number"
                        className="w-20 h-9"
                        placeholder="Кол"
                        value={editPartForm.qty || ""}
                        onChange={(e) => setEditPartForm((f) => ({ ...f, qty: Number(e.target.value) }))}
                      />
                      <Input
                        type="number"
                        className="w-28 h-9"
                        placeholder="Цена"
                        value={editPartForm.price || ""}
                        onChange={(e) => setEditPartForm((f) => ({ ...f, price: Number(e.target.value) }))}
                        onKeyDown={(e) => { if (e.key === "Enter") handleUpdatePart(p); }}
                      />
                      <Button size="sm" className="h-9 bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleUpdatePart(p)}>
                        <Icon name="Check" size={14} />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-9" onClick={() => setEditingPartId(null)}>
                        <Icon name="X" size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center px-5 py-3 group hover:bg-muted/30">
                      <span className="text-sm text-muted-foreground w-8 shrink-0">{i + 1}.</span>
                      <span className="flex-1 text-sm text-foreground">
                        {p.name}
                        <span className="text-muted-foreground ml-1.5">× {p.qty}</span>
                      </span>
                      <span className="text-sm font-semibold text-foreground shrink-0 ml-4">
                        {(p.price * p.qty).toLocaleString("ru-RU")} ₽
                      </span>
                      {!isIssued && (
                        <div className="flex gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm" variant="ghost" className="h-7 w-7 p-0"
                            onClick={() => { setEditingPartId(p.id!); setEditPartForm({ name: p.name, qty: p.qty, price: p.price }); }}
                          >
                            <Icon name="Pencil" size={13} className="text-muted-foreground" />
                          </Button>
                          <Button
                            size="sm" variant="ghost" className="h-7 w-7 p-0"
                            onClick={() => handleDeletePart(p)}
                          >
                            <Icon name="Trash2" size={13} className="text-red-400" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-8 text-center">Запчасти не добавлены</div>
          )}

          {!isIssued && (
            <div className="flex gap-2 px-5 py-3 border-t border-border">
              <Input
                placeholder="Название"
                className="flex-1"
                value={addPartForm.name}
                onChange={(e) => setAddPartForm((p) => ({ ...p, name: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddPart(); }}
              />
              <Input
                type="number"
                placeholder="Кол"
                className="w-20"
                value={addPartForm.qty || ""}
                onChange={(e) => setAddPartForm((p) => ({ ...p, qty: Number(e.target.value) }))}
              />
              <Input
                type="number"
                placeholder="Цена"
                className="w-28"
                value={addPartForm.price || ""}
                onChange={(e) => setAddPartForm((p) => ({ ...p, price: Number(e.target.value) }))}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddPart(); }}
              />
              <Button className="bg-blue-500 hover:bg-blue-600 text-white shrink-0" onClick={handleAddPart}>
                <Icon name="Plus" size={16} className="mr-1.5" />
                <span className="hidden sm:inline">Добавить</span>
              </Button>
            </div>
          )}
        </div>

        {/* === ИТОГО + ОПЛАТА === */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-muted-foreground">Итого</div>
                <div className="text-2xl font-bold text-foreground">{fmt(total)}</div>
              </div>
              {totalPaid > 0 && (
                <>
                  <div>
                    <div className="text-xs text-green-600">Оплачено</div>
                    <div className="text-lg font-bold text-green-600">{fmt(totalPaid)}</div>
                  </div>
                  {total - totalPaid > 0 && (
                    <div>
                      <div className="text-xs text-orange-600">Остаток</div>
                      <div className="text-lg font-bold text-orange-600">{fmt(total - totalPaid)}</div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {payments.length > 0 && (
                <div className="text-xs text-muted-foreground text-right hidden sm:block">
                  {payments.length} {payments.length === 1 ? "платёж" : "платежей"}
                </div>
              )}
              <Button
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={openPaymentDialog}
              >
                <Icon name="Banknote" size={16} className="mr-1.5" />
                Принять оплату
              </Button>
            </div>
          </div>

          {payments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border divide-y divide-border">
              {payments.map((p) => (
                <div key={p.id} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                  <div>
                    <span className="text-sm font-medium text-green-600">+{fmt(Number(p.amount))}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {methodLabels[p.payment_method] || p.payment_method} · {p.cashbox_name}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("ru-RU")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Принять оплату</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Итого по наряду</span>
                <span className="font-semibold">{fmt(total)}</span>
              </div>
              {totalPaid > 0 && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-green-600">Уже оплачено</span>
                  <span className="font-semibold text-green-600">{fmt(totalPaid)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Сумма *</label>
              <Input
                type="number"
                value={paymentForm.amount || ""}
                onChange={(e) => setPaymentForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Способ оплаты</label>
              <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm((f) => ({ ...f, payment_method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Наличные</SelectItem>
                  <SelectItem value="card">Карта</SelectItem>
                  <SelectItem value="transfer">Перевод</SelectItem>
                  <SelectItem value="online">Онлайн</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Касса *</label>
              <Select value={String(paymentForm.cashbox_id)} onValueChange={(v) => setPaymentForm((f) => ({ ...f, cashbox_id: Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Выберите кассу" /></SelectTrigger>
                <SelectContent>
                  {cashboxes.map((cb) => (
                    <SelectItem key={cb.id} value={String(cb.id)}>{cb.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Комментарий</label>
              <Input
                value={paymentForm.comment}
                onChange={(e) => setPaymentForm((f) => ({ ...f, comment: e.target.value }))}
                placeholder="Необязательно"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setPaymentDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={handlePayment}>
                <Icon name="Check" size={16} className="mr-1.5" />
                Принять {paymentForm.amount ? fmt(paymentForm.amount) : ""}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default WorkOrderDetail;
