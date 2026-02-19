import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import WorkOrderWorksSection from "@/components/work-orders/WorkOrderWorksSection";
import WorkOrderPartsSection from "@/components/work-orders/WorkOrderPartsSection";
import WorkOrderPaymentSection from "@/components/work-orders/WorkOrderPaymentSection";

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

interface Product {
  id: number;
  sku: string;
  name: string;
  purchase_price: number;
  quantity: number;
  unit: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

const WorkOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editingMaster, setEditingMaster] = useState(false);
  const [masterValue, setMasterValue] = useState("");

  const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<{ id: number; name: string; phone: string }[]>([]);
  const [editingPayer, setEditingPayer] = useState(false);
  const [payerValue, setPayerValue] = useState<number | null>(null);

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

  const fetchProducts = async () => {
    try {
      const url = getApiUrl("warehouse");
      if (!url) return;
      const res = await fetch(`${url}?section=products`);
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch { /* ignore */ }
  };

  const fetchCashboxes = async () => {
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(`${url}?section=cashboxes`);
      const data = await res.json();
      if (data.cashboxes) {
        setCashboxes(data.cashboxes.filter((c: Cashbox) => c.is_active));
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

  const fetchClients = async () => {
    try {
      const url = getApiUrl("clients");
      if (!url) return;
      const res = await fetch(url);
      const data = await res.json();
      if (data.clients) setClients(data.clients);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchWorkOrder(); fetchProducts(); fetchClients(); }, [id]);
  useEffect(() => { fetchCashboxes(); fetchPayments(); }, [id]);

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

  const handleUpdatePayer = async (clientId: number | null) => {
    if (!workOrder) return;
    const payerName = clientId ? (clients.find(c => c.id === clientId)?.name || '') : '';
    setWorkOrder((prev) => (prev ? { ...prev, payer_client_id: clientId, payer_name: payerName } : prev));
    setEditingPayer(false);
    try {
      await apiCall({ action: "update", work_order_id: workOrder.id, payer_client_id: clientId, payer_name: payerName });
      toast.success("Плательщик обновлён");
    } catch { toast.error("Ошибка"); }
  };

  const handleAddWork = async (form: { name: string; price: number; qty: number; norm_hours: number; norm_hour_price: number; discount: number }) => {
    if (!workOrder) return;
    try {
      const data = await apiCall({ action: "add_work", work_order_id: workOrder.id, ...form });
      if (data?.work) {
        setWorkOrder((prev) => prev ? { ...prev, works: [...prev.works, data.work] } : prev);
        toast.success("Работа добавлена");
      }
    } catch { toast.error("Ошибка"); }
  };

  const handleUpdateWork = async (w: WorkItem, form: { name: string; price: number; qty: number; norm_hours: number; norm_hour_price: number; discount: number }) => {
    try {
      const data = await apiCall({ action: "update_work", work_id: w.id, ...form });
      if (data?.work) {
        setWorkOrder((prev) => prev ? { ...prev, works: prev.works.map((x) => x.id === w.id ? data.work : x) } : prev);
        toast.success("Работа обновлена");
      }
    } catch { toast.error("Ошибка"); }
  };

  const handleDeleteWork = async (w: WorkItem) => {
    if (!workOrder) return;
    try {
      await apiCall({ action: "delete_work", work_id: w.id });
      setWorkOrder((prev) => prev ? { ...prev, works: prev.works.filter((x) => x.id !== w.id) } : prev);
      toast.success("Работа удалена");
    } catch { toast.error("Ошибка"); }
  };

  const handleAddPart = async (payload: { product_id?: number; name: string; qty: number; price: number; purchase_price: number }) => {
    if (!workOrder) return;
    if (payload.product_id) {
      const prod = products.find((p) => p.id === payload.product_id);
      if (prod && payload.qty > prod.quantity) {
        toast.error(`На складе только ${prod.quantity} ${prod.unit}`);
        return;
      }
      if (!payload.name && prod) payload.name = prod.name;
    }
    if (!payload.product_id && !payload.name.trim()) {
      toast.error("Укажите название или выберите товар со склада");
      return;
    }
    try {
      const data = await apiCall({
        action: "add_part",
        work_order_id: workOrder.id,
        ...payload,
        price: payload.price,
        purchase_price: payload.purchase_price,
      });
      if (data?.part) {
        setWorkOrder((prev) => prev ? { ...prev, parts: [...prev.parts, data.part] } : prev);
        toast.success(payload.product_id ? "Запчасть добавлена, списана со склада" : "Запчасть добавлена");
        fetchProducts();
      }
    } catch { toast.error("Ошибка"); }
  };

  const handleUpdatePart = async (p: PartItem, form: { name: string; qty: number; price: number; purchase_price: number }) => {
    try {
      const data = await apiCall({
        action: "update_part", part_id: p.id,
        name: form.name, qty: form.qty,
        price: form.price, purchase_price: form.purchase_price,
      });
      if (data?.part) {
        setWorkOrder((prev) => prev ? { ...prev, parts: prev.parts.map((x) => x.id === p.id ? data.part : x) } : prev);
        toast.success("Запчасть обновлена");
        fetchProducts();
      }
    } catch { toast.error("Ошибка"); }
  };

  const handleDeletePart = async (p: PartItem) => {
    if (!workOrder) return;
    try {
      await apiCall({ action: "delete_part", part_id: p.id });
      setWorkOrder((prev) => prev ? { ...prev, parts: prev.parts.filter((x) => x.id !== p.id) } : prev);
      toast.success("Запчасть удалена, возвращена на склад");
      fetchProducts();
    } catch { toast.error("Ошибка"); }
  };

  const handlePayment = async (form: { amount: number; payment_method: string; cashbox_id: number; comment: string }) => {
    if (!workOrder || !form.amount || !form.cashbox_id) {
      toast.error("Укажите сумму и выберите кассу");
      return;
    }
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_payment", work_order_id: workOrder.id, ...form }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success("Оплата принята");
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
  const partsCost = workOrder.parts.reduce((s, p) => s + (p.purchase_price || 0) * p.qty, 0);
  const partsMargin = partsTotal - partsCost;

  return (
    <Layout
      title={`Заказ-наряд ${workOrder.number}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/work-orders/${workOrder.id}/print`)}>
            <Icon name="Printer" size={16} className="mr-1.5" />
            <span className="hidden sm:inline">Печать</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/work-orders")}>
            <Icon name="ArrowLeft" size={16} className="mr-1.5" />
            <span className="hidden sm:inline">К списку</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* === ШАПКА === */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Заказчик</div>
                <div className="text-sm font-semibold text-foreground">{workOrder.client}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Плательщик</div>
                {editingPayer ? (
                  <div className="flex gap-1.5 items-center">
                    <select
                      className="h-7 text-sm border rounded px-2 flex-1"
                      value={payerValue ?? ""}
                      onChange={(e) => setPayerValue(e.target.value ? Number(e.target.value) : null)}
                      autoFocus
                    >
                      <option value="">= Заказчик =</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <Button size="sm" className="h-7 w-7 p-0 bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleUpdatePayer(payerValue)}>
                      <Icon name="Check" size={12} />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingPayer(false)}>
                      <Icon name="X" size={12} />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="text-sm font-semibold text-foreground flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors group"
                    onClick={() => { setPayerValue(workOrder.payer_client_id || null); setEditingPayer(true); }}
                  >
                    <span>{workOrder.payer_name || workOrder.client}</span>
                    {workOrder.payer_client_id && workOrder.payer_client_id !== workOrder.client_id && (
                      <span className="text-[10px] text-orange-500 font-normal">(другой)</span>
                    )}
                    <Icon name="Pencil" size={11} className="text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Автомобиль</div>
                <div className="text-sm font-semibold text-foreground">{workOrder.car || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Дата</div>
                <div className="text-sm font-semibold text-foreground">{workOrder.date}</div>
                {workOrder.issued_at && (
                  <div className="text-[10px] text-muted-foreground">Выдан: {new Date(workOrder.issued_at).toLocaleDateString("ru-RU")}</div>
                )}
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

        <WorkOrderWorksSection
          works={workOrder.works}
          isIssued={isIssued}
          onAdd={handleAddWork}
          onUpdate={handleUpdateWork}
          onDelete={handleDeleteWork}
        />

        <WorkOrderPartsSection
          parts={workOrder.parts}
          products={products}
          isIssued={isIssued}
          onAdd={handleAddPart}
          onUpdate={handleUpdatePart}
          onDelete={handleDeletePart}
        />

        <WorkOrderPaymentSection
          total={total}
          worksTotal={worksTotal}
          partsMargin={partsMargin}
          partsCost={partsCost}
          totalPaid={totalPaid}
          payments={payments}
          cashboxes={cashboxes}
          onPayment={handlePayment}
        />
      </div>
    </Layout>
  );
};

export default WorkOrderDetail;