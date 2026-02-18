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
import { WorkOrder, statusConfig, getTotal } from "@/components/work-orders/types";

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

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, payment_method: "cash", cashbox_id: 0, comment: "" });

  const fetchWorkOrder = async () => {
    try {
      const url = getApiUrl("work-orders");
      if (!url) {
        setLoading(false);
        setNotFound(true);
        return;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.work_orders) {
        const found = data.work_orders.find(
          (wo: WorkOrder) => wo.id === Number(id)
        );
        if (found) {
          setWorkOrder(found);
          setMasterValue(found.master || "");
        } else {
          setNotFound(true);
        }
      } else {
        setNotFound(true);
      }
    } catch {
      toast.error("Не удалось загрузить заказ-наряд");
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrder();
  }, [id]);

  const handleStatusChange = async (status: WorkOrder["status"]) => {
    if (!workOrder) return;
    setWorkOrder((prev) => (prev ? { ...prev, status } : prev));
    try {
      const url = getApiUrl("work-orders");
      if (!url) return;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", work_order_id: workOrder.id, status }),
      });
      toast.success("Статус обновлен");
    } catch {
      toast.error("Ошибка при смене статуса");
    }
  };

  const handleUpdateMaster = async () => {
    if (!workOrder) return;
    setWorkOrder((prev) => (prev ? { ...prev, master: masterValue } : prev));
    setEditingMaster(false);
    try {
      const url = getApiUrl("work-orders");
      if (!url) return;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", work_order_id: workOrder.id, master: masterValue }),
      });
      toast.success("Мастер обновлен");
    } catch {
      toast.error("Ошибка при обновлении мастера");
    }
  };

  const handleAddWork = async () => {
    if (!addWorkForm.name.trim() || !workOrder) return;
    try {
      const url = getApiUrl("work-orders");
      if (!url) return;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_work", work_order_id: workOrder.id, ...addWorkForm }),
      });
      const data = await res.json();
      if (data.work) {
        setWorkOrder((prev) =>
          prev ? { ...prev, works: [...prev.works, data.work] } : prev
        );
        toast.success("Работа добавлена");
      }
    } catch {
      toast.error("Ошибка при добавлении работы");
    }
    setAddWorkForm({ name: "", price: 0 });
  };

  const handleAddPart = async () => {
    if (!addPartForm.name.trim() || !workOrder) return;
    try {
      const url = getApiUrl("work-orders");
      if (!url) return;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_part", work_order_id: workOrder.id, ...addPartForm }),
      });
      const data = await res.json();
      if (data.part) {
        setWorkOrder((prev) =>
          prev ? { ...prev, parts: [...prev.parts, data.part] } : prev
        );
        toast.success("Запчасть добавлена");
      }
    } catch {
      toast.error("Ошибка при добавлении запчасти");
    }
    setAddPartForm({ name: "", qty: 1, price: 0 });
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

  useEffect(() => {
    fetchCashboxes();
    fetchPayments();
  }, [id]);

  const openPaymentDialog = () => {
    const total = workOrder ? getTotal(workOrder) : 0;
    const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
    const remaining = Math.max(0, total - paid);
    setPaymentForm({ amount: remaining, payment_method: "cash", cashbox_id: cashboxes[0]?.id || 0, comment: "" });
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
        body: JSON.stringify({
          action: "create_payment",
          work_order_id: workOrder.id,
          ...paymentForm,
        }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success("Оплата принята");
      setPaymentDialogOpen(false);
      fetchPayments();
    } catch {
      toast.error("Ошибка при приёме оплаты");
    }
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
          <Button
            variant="outline"
            onClick={() => navigate("/work-orders")}
          >
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

  return (
    <Layout
      title={`Заказ-наряд ${workOrder.number}`}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/work-orders")}
        >
          <Icon name="ArrowLeft" size={16} className="mr-1.5" />
          <span className="hidden sm:inline">К списку</span>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Информация</h3>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.className}`}>
                  {statusInfo.label}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Клиент</div>
                  <div className="text-sm font-medium text-foreground">{workOrder.client}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Автомобиль</div>
                  <div className="text-sm font-medium text-foreground">{workOrder.car || "---"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Дата</div>
                  <div className="text-sm font-medium text-foreground">{workOrder.date}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Мастер</div>
                  {editingMaster ? (
                    <div className="flex gap-2">
                      <Input
                        value={masterValue}
                        onChange={(e) => setMasterValue(e.target.value)}
                        className="h-8 text-sm"
                        placeholder="Имя мастера"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdateMaster();
                          if (e.key === "Escape") {
                            setEditingMaster(false);
                            setMasterValue(workOrder.master || "");
                          }
                        }}
                        autoFocus
                      />
                      <Button size="sm" className="h-8 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleUpdateMaster}>
                        <Icon name="Check" size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        onClick={() => {
                          setEditingMaster(false);
                          setMasterValue(workOrder.master || "");
                        }}
                      >
                        <Icon name="X" size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="text-sm font-medium text-foreground flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition-colors group"
                      onClick={() => setEditingMaster(true)}
                    >
                      <span>{workOrder.master || "---"}</span>
                      <Icon name="Pencil" size={12} className="text-muted-foreground group-hover:text-blue-600" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Статус</h3>
              <Select
                value={workOrder.status}
                onValueChange={(v) => handleStatusChange(v as WorkOrder["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Новый</SelectItem>
                  <SelectItem value="in-progress">В работе</SelectItem>
                  <SelectItem value="done">Готов</SelectItem>
                  <SelectItem value="issued">Выдан</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-white rounded-xl border border-border p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-foreground uppercase tracking-wide">Итого</span>
                <span className="text-2xl font-bold text-foreground">
                  {total.toLocaleString("ru-RU")} ₽
                </span>
              </div>
              {totalPaid > 0 && (
                <div className="space-y-1 pt-2 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Оплачено</span>
                    <span className="font-semibold text-green-600">{fmt(totalPaid)}</span>
                  </div>
                  {total - totalPaid > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-600">Остаток</span>
                      <span className="font-semibold text-orange-600">{fmt(total - totalPaid)}</span>
                    </div>
                  )}
                </div>
              )}
              <Button
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                onClick={openPaymentDialog}
              >
                <Icon name="Banknote" size={16} className="mr-1.5" />
                Принять оплату
              </Button>
            </div>

            {payments.length > 0 && (
              <div className="bg-white rounded-xl border border-border p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Оплаты</h3>
                <div className="divide-y divide-border">
                  {payments.map((p) => (
                    <div key={p.id} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                      <div>
                        <div className="text-sm font-medium text-green-600">+{fmt(Number(p.amount))}</div>
                        <div className="text-xs text-muted-foreground">
                          {methodLabels[p.payment_method] || p.payment_method} · {p.cashbox_name}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("ru-RU")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Работы</h3>
                <span className="text-xs text-muted-foreground">
                  {workOrder.works.length} {workOrder.works.length === 1 ? "позиция" : "позиций"}
                </span>
              </div>

              {workOrder.works.length > 0 ? (
                <div className="divide-y divide-border">
                  {workOrder.works.map((w, i) => (
                    <div key={w.id || i} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                      <span className="text-sm text-foreground">{w.name}</span>
                      <span className="text-sm font-semibold text-foreground shrink-0 ml-4">
                        {w.price.toLocaleString("ru-RU")} ₽
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  Работы не добавлены
                </div>
              )}

              {!isIssued && (
                <div className="flex gap-2 pt-3 border-t border-border">
                  <Input
                    placeholder="Название работы"
                    className="flex-1"
                    value={addWorkForm.name}
                    onChange={(e) => setAddWorkForm((p) => ({ ...p, name: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddWork();
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Цена"
                    className="w-28"
                    value={addWorkForm.price || ""}
                    onChange={(e) => setAddWorkForm((p) => ({ ...p, price: Number(e.target.value) }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddWork();
                    }}
                  />
                  <Button
                    className="bg-blue-500 hover:bg-blue-600 text-white shrink-0"
                    onClick={handleAddWork}
                  >
                    <Icon name="Plus" size={16} className="mr-1.5" />
                    <span className="hidden sm:inline">Добавить</span>
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Запчасти и материалы</h3>
                <span className="text-xs text-muted-foreground">
                  {workOrder.parts.length} {workOrder.parts.length === 1 ? "позиция" : "позиций"}
                </span>
              </div>

              {workOrder.parts.length > 0 ? (
                <div className="divide-y divide-border">
                  {workOrder.parts.map((p, i) => (
                    <div key={p.id || i} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                      <div className="text-sm text-foreground">
                        <span>{p.name}</span>
                        <span className="text-muted-foreground ml-1.5">x {p.qty}</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground shrink-0 ml-4">
                        {(p.price * p.qty).toLocaleString("ru-RU")} ₽
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  Запчасти не добавлены
                </div>
              )}

              {!isIssued && (
                <div className="flex gap-2 pt-3 border-t border-border">
                  <Input
                    placeholder="Название"
                    className="flex-1"
                    value={addPartForm.name}
                    onChange={(e) => setAddPartForm((p) => ({ ...p, name: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddPart();
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Кол"
                    className="w-20"
                    value={addPartForm.qty || ""}
                    onChange={(e) => setAddPartForm((p) => ({ ...p, qty: Number(e.target.value) }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddPart();
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Цена"
                    className="w-28"
                    value={addPartForm.price || ""}
                    onChange={(e) => setAddPartForm((p) => ({ ...p, price: Number(e.target.value) }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddPart();
                    }}
                  />
                  <Button
                    className="bg-blue-500 hover:bg-blue-600 text-white shrink-0"
                    onClick={handleAddPart}
                  >
                    <Icon name="Plus" size={16} className="mr-1.5" />
                    <span className="hidden sm:inline">Добавить</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
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
              <Select
                value={paymentForm.payment_method}
                onValueChange={(v) => setPaymentForm((f) => ({ ...f, payment_method: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <Select
                value={String(paymentForm.cashbox_id)}
                onValueChange={(v) => setPaymentForm((f) => ({ ...f, cashbox_id: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите кассу" />
                </SelectTrigger>
                <SelectContent>
                  {cashboxes.map((cb) => (
                    <SelectItem key={cb.id} value={String(cb.id)}>
                      {cb.name}
                    </SelectItem>
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
              <Button variant="outline" className="flex-1" onClick={() => setPaymentDialogOpen(false)}>
                Отмена
              </Button>
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