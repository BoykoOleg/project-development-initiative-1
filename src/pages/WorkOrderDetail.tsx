import { useState, useEffect, useRef } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Layout from "@/components/Layout";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";
import { WorkOrder, WorkItem, PartItem, statusConfig, getTotal } from "@/components/work-orders/types";
import WorkOrderWorksSection from "@/components/work-orders/WorkOrderWorksSection";
import WorkOrderPartsSection from "@/components/work-orders/WorkOrderPartsSection";
import WorkOrderPaymentSection from "@/components/work-orders/WorkOrderPaymentSection";
import WorkOrderFinancePanel from "@/components/work-orders/WorkOrderFinancePanel";
import TransferDialog from "@/components/work-orders/TransferDialog";

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

interface ClientCar {
  id: number;
  brand: string;
  model: string;
  year?: string;
  vin?: string;
  license_plate?: string;
}

interface ClientRef {
  id: number;
  name: string;
  phone: string;
  cars: ClientCar[];
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
  const [linkedIncomes, setLinkedIncomes] = useState<{ id: number; amount: number; income_type: string; comment: string; cashbox_name: string; created_at: string }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<ClientRef[]>([]);
  const [editingPayer, setEditingPayer] = useState(false);
  const [payerValue, setPayerValue] = useState<number | null>(null);
  const [employees, setEmployees] = useState<{ id: number; name: string; role_label: string; is_active: boolean }[]>([]);
  const [editingEmployee, setEditingEmployee] = useState(false);
  const [employeeValue, setEmployeeValue] = useState<number | null>(null);

  const [complaint, setComplaint] = useState("");
  const [editingComplaint, setEditingComplaint] = useState(false);
  const [financePanelOpen, setFinancePanelOpen] = useState(false);

  const [editingClient, setEditingClient] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [selectedPhone, setSelectedPhone] = useState("");
  const [clientDropOpen, setClientDropOpen] = useState(false);
  const clientSearchRef = useRef<HTMLDivElement>(null);

  const [transferMenuOpen, setTransferMenuOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferDirection, setTransferDirection] = useState<"to_order" | "to_stock">("to_order");
  const transferMenuRef = useRef<HTMLDivElement>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const fetchWorkOrder = async () => {
    try {
      const url = getApiUrl("work-orders");
      if (!url) { setLoading(false); setNotFound(true); return; }
      const res = await fetch(url);
      const data = await res.json();
      if (data.work_orders) {
        const found = data.work_orders.find((wo: WorkOrder) => wo.id === Number(id));
        if (found) { setWorkOrder(found); setMasterValue(found.master || ""); setComplaint(found.complaint || ""); }
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

  const fetchLinkedIncomes = async () => {
    if (!id) return;
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(`${url}?section=incomes&work_order_id=${id}`);
      const data = await res.json();
      if (data.incomes) setLinkedIncomes(data.incomes);
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

  const fetchEmployees = async () => {
    try {
      const url = getApiUrl("employees");
      if (!url) return;
      const res = await fetch(url);
      const data = await res.json();
      if (data.employees) setEmployees(data.employees.filter((e: { is_active: boolean }) => e.is_active));
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchWorkOrder(); fetchProducts(); fetchClients(); fetchEmployees(); }, [id]);
  useEffect(() => { fetchCashboxes(); fetchPayments(); fetchLinkedIncomes(); }, [id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (transferMenuRef.current && !transferMenuRef.current.contains(e.target as Node)) {
        setTransferMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate("/work-orders");
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clientSearchRef.current && !clientSearchRef.current.contains(e.target as Node)) {
        setClientDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  const handleUpdateEmployee = async (empId: number | null) => {
    if (!workOrder) return;
    const empName = empId ? (employees.find(e => e.id === empId)?.name || '') : '';
    setWorkOrder((prev) => (prev ? { ...prev, employee_id: empId, employee_name: empName } : prev));
    setEditingEmployee(false);
    try {
      await apiCall({ action: "update", work_order_id: workOrder.id, employee_id: empId });
      toast.success("Ответственный обновлён");
    } catch { toast.error("Ошибка"); }
  };

  const handleUpdateComplaint = async () => {
    if (!workOrder) return;
    setWorkOrder((prev) => (prev ? { ...prev, complaint } : prev));
    setEditingComplaint(false);
    try {
      await apiCall({ action: "update", work_order_id: workOrder.id, complaint });
      toast.success("Причина обращения сохранена");
    } catch { toast.error("Ошибка"); }
  };

  const openEditClient = () => {
    if (!workOrder) return;
    setSelectedClientId(workOrder.client_id || null);
    setSelectedCarId(workOrder.car_id || null);
    setSelectedPhone(workOrder.client_phone || "");
    setClientSearch(workOrder.client || "");
    setClientDropOpen(false);
    setEditingClient(true);
  };

  const getClientCars = (): ClientCar[] => {
    if (!selectedClientId) return [];
    const c = clients.find((cl) => cl.id === selectedClientId);
    return c?.cars || [];
  };

  const handleUpdateClient = async () => {
    if (!workOrder || !selectedClientId) return;
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return;
    const cars = client.cars || [];
    const car = cars.find((c: ClientCar) => c.id === selectedCarId);
    const carInfo = car ? `${car.brand} ${car.model}${car.year ? " " + car.year : ""}${car.license_plate ? " · " + car.license_plate : ""}` : "";
    const updates = {
      action: "update",
      work_order_id: workOrder.id,
      client_id: selectedClientId,
      client_name: client.name,
      client_phone: selectedPhone || client.phone || "",
      car_id: selectedCarId || null,
      car_info: carInfo,
    };
    setWorkOrder((prev) => prev ? {
      ...prev,
      client: client.name,
      client_id: selectedClientId,
      client_phone: selectedPhone || client.phone || "",
      car_id: selectedCarId || null,
      car: carInfo,
    } : prev);
    setEditingClient(false);
    try {
      await apiCall(updates);
      toast.success("Заказчик обновлён");
    } catch { toast.error("Ошибка"); }
  };

  const handleAddWork = async (form: { name: string; price: number; qty: number; norm_hours: number; norm_hour_price: number; discount: number; employee_id: number | null }) => {
    if (!workOrder) return;
    try {
      const data = await apiCall({ action: "add_work", work_order_id: workOrder.id, ...form });
      if (data?.work) {
        setWorkOrder((prev) => prev ? { ...prev, works: [...prev.works, data.work] } : prev);
        toast.success("Работа добавлена");
      }
    } catch { toast.error("Ошибка"); }
  };

  const handleUpdateWork = async (w: WorkItem, form: { name: string; price: number; qty: number; norm_hours: number; norm_hour_price: number; discount: number; employee_id: number | null }) => {
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

  const handleAddPart = async (payload: { product_id?: number; part_number?: string; name: string; qty: number; price: number; purchase_price: number }) => {
    if (!workOrder) return;
    let outOfStock = false;
    if (payload.product_id) {
      const prod = products.find((p) => p.id === payload.product_id);
      if (prod && payload.qty > prod.quantity) {
        outOfStock = true;
      }
      if (!payload.name && prod) payload.name = prod.name;
    }
    if (!payload.product_id && !payload.name.trim()) {
      toast.error("Укажите название или выберите товар со склада");
      return;
    }

    const existing = workOrder.parts.find((p) =>
      payload.product_id ? p.product_id === payload.product_id : (payload.part_number && p.part_number === payload.part_number)
    );

    if (existing) {
      try {
        const data = await apiCall({
          action: "update_part", part_id: existing.id,
          part_number: existing.part_number ?? '',
          name: existing.name,
          qty: existing.qty + payload.qty,
          price: existing.price,
          purchase_price: existing.purchase_price,
        });
        if (data?.part) {
          setWorkOrder((prev) => prev ? { ...prev, parts: prev.parts.map((x) => x.id === existing.id ? data.part : x) } : prev);
          toast.success("Количество увеличено");
          fetchProducts();
        }
      } catch { toast.error("Ошибка"); }
      return;
    }

    try {
      const data = await apiCall({
        action: "add_part",
        work_order_id: workOrder.id,
        ...payload,
        out_of_stock: outOfStock,
        price: payload.price,
        purchase_price: payload.purchase_price,
      });
      if (data?.part) {
        // Если product_id появился после создания на бэкенде (из подбора) — проверяем остаток
        const addedPart = data.part;
        if (addedPart.product_id && !payload.product_id) {
          // Новый продукт создан на бэкенде, остаток = 0 → помечаем out_of_stock
          await apiCall({ action: "update_part", part_id: addedPart.id, out_of_stock: true, name: addedPart.name, qty: addedPart.qty, price: addedPart.sell_price ?? payload.price, purchase_price: addedPart.purchase_price ?? payload.purchase_price });
          addedPart.out_of_stock = true;
          outOfStock = true;
        }
        setWorkOrder((prev) => prev ? { ...prev, parts: [...prev.parts, addedPart] } : prev);
        if (outOfStock) {
          toast.warning("Запчасть добавлена. Товара нет на складе — нужно заказать");
        } else {
          toast.success(payload.product_id ? "Запчасть добавлена. Создайте перемещение для передачи товара в работу" : "Запчасть добавлена");
        }
        fetchProducts();
      }
    } catch { toast.error("Ошибка"); }
  };

  const handleUpdatePart = async (p: PartItem, form: { part_number?: string; name: string; qty: number; price: number; purchase_price: number }) => {
    try {
      const data = await apiCall({
        action: "update_part", part_id: p.id,
        part_number: form.part_number ?? '',
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
      toast.success("Запчасть удалена из заказ-наряда");
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

  const handleDeleteOrder = async () => {
    try {
      const data = await apiCall({ action: "delete_order", work_order_id: workOrder.id });
      if (data?.success) {
        toast.success("Заказ-наряд удалён");
        navigate("/work-orders");
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch {
      toast.error("Ошибка при удалении");
    }
    setDeleteConfirmOpen(false);
  };

  const canDelete = workOrder.works.length === 0 && workOrder.parts.length === 0 && payments.length === 0;

  const statusInfo = statusConfig[workOrder.status];
  const total = getTotal(workOrder);
  const isIssued = workOrder.status === "issued";
  const worksTotal = workOrder.works.reduce((s, w) => s + w.price, 0);
  const partsTotal = workOrder.parts.reduce((s, p) => s + p.price * p.qty, 0);
  const partsCost = workOrder.parts.reduce((s, p) => s + (p.purchase_price || 0) * p.qty, 0);
  const partsMargin = partsTotal - partsCost;

  return (
    <>
    <Layout
      title={`Заказ-наряд ${workOrder.number}`}
      actions={
        <div className="flex items-center gap-2">
          {/* Выпадающее меню Перемещение */}
          <div className="relative" ref={transferMenuRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransferMenuOpen((v) => !v)}
            >
              <Icon name="ArrowLeftRight" size={16} className="mr-1.5 text-blue-500" />
              <span className="hidden sm:inline">Перемещение</span>
              <Icon name="ChevronDown" size={14} className="ml-1 text-muted-foreground" />
            </Button>
            {transferMenuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg z-50 min-w-[220px] py-1">
                <button
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 flex items-center gap-2.5 transition-colors"
                  onClick={() => {
                    setTransferDirection("to_order");
                    setTransferDialogOpen(true);
                    setTransferMenuOpen(false);
                  }}
                >
                  <Icon name="ArrowRight" size={16} className="text-blue-500" />
                  <div>
                    <div className="font-medium">Склад → Заказ-наряд</div>
                    <div className="text-xs text-muted-foreground">Передать товары в работу</div>
                  </div>
                </button>
                <button
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 flex items-center gap-2.5 transition-colors"
                  onClick={() => {
                    setTransferDirection("to_stock");
                    setTransferDialogOpen(true);
                    setTransferMenuOpen(false);
                  }}
                >
                  <Icon name="ArrowLeft" size={16} className="text-orange-500" />
                  <div>
                    <div className="font-medium">Заказ-наряд → Склад</div>
                    <div className="text-xs text-muted-foreground">Вернуть товары на склад</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={() => setFinancePanelOpen(true)}>
            <Icon name="BarChart2" size={16} className="mr-1.5" />
            <span className="hidden sm:inline">Структура</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/work-orders/${workOrder.id}/print`)}>
            <Icon name="Printer" size={16} className="mr-1.5" />
            <span className="hidden sm:inline">Печать</span>
          </Button>
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Icon name="Trash2" size={16} />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate("/work-orders")}>
            <Icon name="ArrowLeft" size={16} className="mr-1.5" />
            <span className="hidden sm:inline">К списку</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* === ШАПКА === */}
        <div className="bg-white border border-border p-4 sm:p-5 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
            {/* Верхняя/левая: статус + сумма */}
            <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-3 sm:shrink-0">
              <Select
                value={workOrder.status}
                onValueChange={(v) => handleStatusChange(v as WorkOrder["status"])}
              >
                <SelectTrigger className="w-[130px] sm:w-[140px]">
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
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Итого</div>
                <div className="text-xl font-bold text-foreground">{fmt(total)}</div>
                {totalPaid > 0 && (
                  <div className="text-xs text-green-600 font-medium">Оплачено: {fmt(totalPaid)}</div>
                )}
              </div>
            </div>

            {/* Правая часть: инфо */}
            <div className="flex-1 flex flex-col gap-2.5">
              {/* Заказчик */}
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Заказчик</span>
                  {editingClient ? (
                    <div ref={clientSearchRef} className="flex flex-col gap-2">
                      {/* Поиск клиента */}
                      <div className="relative">
                        <Input
                          className="h-8 text-sm pr-8"
                          placeholder="Поиск по имени или телефону..."
                          value={clientSearch}
                          autoFocus
                          onChange={(e) => { setClientSearch(e.target.value); setClientDropOpen(true); }}
                          onFocus={() => setClientDropOpen(true)}
                        />
                        {selectedClientId && (
                          <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => { setSelectedClientId(null); setSelectedCarId(null); setClientSearch(""); }}>
                            <Icon name="X" size={13} />
                          </button>
                        )}
                        {clientDropOpen && (
                          <div className="absolute z-50 left-0 top-full mt-1 w-72 bg-white border border-border rounded-lg shadow-xl max-h-52 overflow-y-auto">
                            {clients.filter((c) => !clientSearch.trim() || c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.phone || "").includes(clientSearch)).map((c) => (
                              <div
                                key={c.id}
                                className={`px-3 py-2 cursor-pointer hover:bg-slate-50 ${selectedClientId === c.id ? "bg-blue-50" : ""}`}
                                onMouseDown={() => { setSelectedClientId(c.id); setSelectedCarId(null); setSelectedPhone(c.phone || ""); setClientSearch(c.name); setClientDropOpen(false); }}
                              >
                                <div className="text-sm font-medium">{c.name}</div>
                                {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
                              </div>
                            ))}
                            {clients.filter((c) => !clientSearch.trim() || c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.phone || "").includes(clientSearch)).length === 0 && (
                              <div className="px-3 py-2 text-sm text-muted-foreground">Не найдено</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Выбор авто из карточки клиента */}
                      {selectedClientId && getClientCars().length > 0 && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">Автомобиль клиента</span>
                          <div className="flex flex-wrap gap-1">
                            <button
                              className={`text-xs px-2 py-1 rounded border transition-colors ${!selectedCarId ? "bg-blue-500 text-white border-blue-500" : "border-border hover:bg-slate-50"}`}
                              onClick={() => setSelectedCarId(null)}
                            >
                              Без авто
                            </button>
                            {getClientCars().map((car) => (
                              <button
                                key={car.id}
                                className={`text-xs px-2 py-1 rounded border transition-colors ${selectedCarId === car.id ? "bg-blue-500 text-white border-blue-500" : "border-border hover:bg-slate-50"}`}
                                onClick={() => setSelectedCarId(car.id)}
                              >
                                {car.brand} {car.model}{car.year ? ` ${car.year}` : ""}{car.license_plate ? ` · ${car.license_plate}` : ""}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Телефон */}
                      {selectedClientId && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">Телефон</span>
                          <Input className="h-8 text-sm" placeholder="+7..." value={selectedPhone} onChange={(e) => setSelectedPhone(e.target.value)} />
                        </div>
                      )}

                      <div className="flex gap-1.5">
                        <Button size="sm" className="h-7 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleUpdateClient} disabled={!selectedClientId}>
                          <Icon name="Check" size={12} className="mr-1" />Сохранить
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingClient(false)}>Отмена</Button>
                        {selectedClientId && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 ml-auto" onClick={() => navigate(`/clients/${selectedClientId}`)}>
                            <Icon name="ExternalLink" size={12} className="mr-1" />Карточка
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-sm font-semibold text-foreground flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition-colors group"
                      onClick={!isIssued ? openEditClient : undefined}
                    >
                      <span>{workOrder.client}</span>
                      {workOrder.client_phone && <span className="text-xs text-muted-foreground font-normal">{workOrder.client_phone}</span>}
                      {!isIssued && <Icon name="Pencil" size={11} className="text-muted-foreground opacity-0 group-hover:opacity-100" />}
                      {workOrder.client_id && (
                        <button
                          className="opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-600"
                          onClick={(e) => { e.stopPropagation(); navigate(`/clients/${workOrder.client_id}`); }}
                          title="Открыть карточку клиента"
                        >
                          <Icon name="ExternalLink" size={11} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Плательщик */}
                {!editingClient && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Плательщик</span>
                    {editingPayer ? (
                      <div className="flex gap-1.5 items-center">
                        <select
                          className="h-7 text-sm border rounded px-2"
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
                )}
              </div>

              {/* Автомобиль */}
              {!editingClient && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Автомобиль</span>
                  <span className="text-sm font-semibold text-foreground">{workOrder.car || "—"}</span>
                </div>
              )}

              {/* Дата */}
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Дата</span>
                <div>
                  <span className="text-sm font-semibold text-foreground">{workOrder.date}</span>
                  {workOrder.issued_at && (
                    <span className="text-[10px] text-muted-foreground ml-2">Выдан: {new Date(workOrder.issued_at).toLocaleDateString("ru-RU")}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === ПРИЧИНА ОБРАЩЕНИЯ === */}
        <div className="bg-white border border-border p-5 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-foreground">Причина обращения</div>
            {!editingComplaint && !isIssued && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => setEditingComplaint(true)}>
                <Icon name="Pencil" size={12} className="mr-1" />
                Изменить
              </Button>
            )}
          </div>
          {editingComplaint ? (
            <div className="flex flex-col gap-2">
              <textarea
                className="w-full border border-border rounded-md p-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={3}
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="Опишите причину обращения клиента..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setEditingComplaint(false); setComplaint(workOrder.complaint || ""); }
                }}
              />
              <div className="flex gap-2">
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleUpdateComplaint}>
                  <Icon name="Check" size={14} className="mr-1" />Сохранить
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditingComplaint(false); setComplaint(workOrder.complaint || ""); }}>
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`text-sm ${complaint ? "text-foreground" : "text-muted-foreground italic"} ${!isIssued ? "cursor-pointer hover:text-blue-600 transition-colors" : ""}`}
              onClick={() => !isIssued && setEditingComplaint(true)}
            >
              {complaint || "Не указана"}
            </div>
          )}
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
          linkedIncomes={linkedIncomes}
          cashboxes={cashboxes}
          onPayment={handlePayment}
        />
      </div>
    </Layout>

    {workOrder && (
      <WorkOrderFinancePanel
        workOrderId={workOrder.id}
        open={financePanelOpen}
        onClose={() => setFinancePanelOpen(false)}
      />
    )}

    {workOrder && (
      <TransferDialog
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        workOrderId={workOrder.id}
        workOrderNumber={workOrder.number}
        parts={workOrder.parts}
        products={products}
        direction={transferDirection}
        onConfirmed={() => {
          fetchWorkOrder();
          fetchProducts();
        }}
      />
    )}

    <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Удалить заказ-наряд?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <p className="text-sm text-muted-foreground">
            Вы действительно уверены, что хотите удалить заказ-наряд <span className="font-medium text-foreground">{workOrder.number}</span>? Это действие нельзя отменить.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirmOpen(false)}>Отмена</Button>
            <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={handleDeleteOrder}>
              <Icon name="Trash2" size={15} className="mr-1.5" />Удалить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default WorkOrderDetail;