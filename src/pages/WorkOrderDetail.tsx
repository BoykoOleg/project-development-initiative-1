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

// Единый компонент выбора клиента (для Заказчика и Плательщика)
const ClientField = ({
  label, clientName, clientId, clients, isIssued, isDifferent, onSave, onNavigate,
}: {
  label: string;
  clientName: string;
  clientId?: number | null;
  clients: ClientRef[];
  isIssued: boolean;
  isDifferent?: boolean;
  onSave: (clientId: number | null, clientName: string) => void;
  onNavigate: (clientId: number) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const [pickedId, setPickedId] = useState<number | null>(clientId || null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const open = () => {
    setPickedId(clientId || null);
    setSearch(clientName);
    setDropOpen(false);
    setEditing(true);
  };

  const filtered = search.trim()
    ? clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || "").includes(search))
    : clients;

  const save = () => {
    const c = clients.find(c => c.id === pickedId);
    onSave(pickedId, c?.name || "");
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div ref={wrapRef} className="flex flex-col gap-1.5">
          <div className="relative">
            <Input
              className="h-8 text-sm pr-8"
              placeholder="Поиск по имени или телефону..."
              value={search}
              autoFocus
              onChange={(e) => { setSearch(e.target.value); setPickedId(null); setDropOpen(true); }}
              onFocus={() => setDropOpen(true)}
            />
            {pickedId && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => { setPickedId(null); setSearch(""); }}>
                <Icon name="X" size={13} />
              </button>
            )}
            {dropOpen && (
              <div className="absolute z-50 left-0 top-full mt-1 w-72 bg-white border border-border rounded-lg shadow-xl max-h-52 overflow-y-auto">
                {filtered.map(c => (
                  <div
                    key={c.id}
                    className={`px-3 py-2 cursor-pointer hover:bg-slate-50 ${pickedId === c.id ? "bg-blue-50" : ""}`}
                    onMouseDown={() => { setPickedId(c.id); setSearch(c.name); setDropOpen(false); }}
                  >
                    <div className="text-sm font-medium">{c.name}</div>
                    {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
                  </div>
                ))}
                {filtered.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">Не найдено</div>}
              </div>
            )}
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" className="h-7 bg-blue-500 hover:bg-blue-600 text-white" onClick={save} disabled={!pickedId}>
              <Icon name="Check" size={12} className="mr-1" />Сохранить
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditing(false)}>Отмена</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div
        className={`text-sm font-semibold text-foreground flex items-center gap-1.5 group ${!isIssued ? "cursor-pointer hover:text-blue-600 transition-colors" : ""}`}
        onClick={!isIssued ? open : undefined}
      >
        <span>{clientName}</span>
        {isDifferent && <span className="text-[10px] text-orange-500 font-normal">(другой)</span>}
        {!isIssued && <Icon name="Pencil" size={11} className="text-muted-foreground opacity-0 group-hover:opacity-100" />}
      </div>
    </div>
  );
};

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
  const [employees, setEmployees] = useState<{ id: number; name: string; role_label: string; is_active: boolean }[]>([]);
  const [editingEmployee, setEditingEmployee] = useState(false);
  const [employeeValue, setEmployeeValue] = useState<number | null>(null);

  const [complaint, setComplaint] = useState("");
  const [editingComplaint, setEditingComplaint] = useState(false);
  const [financePanelOpen, setFinancePanelOpen] = useState(false);

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

  const handleUpdateClient = async (clientId: number | null, clientName: string) => {
    if (!workOrder || !clientId) return;
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    setWorkOrder((prev) => prev ? { ...prev, client: client.name, client_id: clientId, client_phone: client.phone || "" } : prev);
    try {
      await apiCall({ action: "update", work_order_id: workOrder.id, client_id: clientId, client_name: client.name, client_phone: client.phone || "" });
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

            {/* Левая колонка: статус + суммы + даты */}
            <div className="flex sm:flex-col items-start gap-3 sm:gap-2 sm:shrink-0 sm:min-w-[150px]">
              <Select value={workOrder.status} onValueChange={(v) => handleStatusChange(v as WorkOrder["status"])}>
                <SelectTrigger className="w-[130px] sm:w-[150px]">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.className}`}>{statusInfo.label}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Новый</SelectItem>
                  <SelectItem value="in-progress">В работе</SelectItem>
                  <SelectItem value="done">Готов</SelectItem>
                  <SelectItem value="issued">Выдан</SelectItem>
                </SelectContent>
              </Select>
              <div className="space-y-1">
                <div>
                  <div className="text-xs text-muted-foreground">Итого</div>
                  <div className="text-xl font-bold text-foreground">{fmt(total)}</div>
                  {totalPaid > 0 && <div className="text-xs text-green-600 font-medium">Оплачено: {fmt(totalPaid)}</div>}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Создан</div>
                  <div className="text-sm font-semibold text-foreground">{workOrder.date}</div>
                </div>
                {workOrder.issued_at && (
                  <div>
                    <div className="text-xs text-muted-foreground">Закрыт</div>
                    <div className="text-sm font-semibold text-foreground">{new Date(workOrder.issued_at).toLocaleDateString("ru-RU")}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Правая часть: данные клиента */}
            <div className="flex-1 flex flex-col gap-2">

              {/* Заказчик */}
              <ClientField
                label="Заказчик"
                clientName={workOrder.client}
                clientId={workOrder.client_id}
                clients={clients}
                isIssued={isIssued}
                onSave={(clientId, clientName) => handleUpdateClient(clientId, clientName)}
                onNavigate={(cid) => navigate(`/clients/${cid}`)}
              />

              {/* Телефон */}
              {(() => {
                const phone = workOrder.client_phone || clients.find(c => c.id === workOrder.client_id)?.phone || "";
                return phone ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Телефон</span>
                    <a href={`tel:${phone}`} className="text-base font-semibold text-foreground hover:text-blue-600 transition-colors">{phone}</a>
                  </div>
                ) : null;
              })()}

              {/* Кнопка карточки клиента */}
              {workOrder.client_id && (
                <div>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate(`/clients/${workOrder.client_id}`)}>
                    <Icon name="User" size={12} className="mr-1.5" />
                    Карточка клиента
                  </Button>
                </div>
              )}

              {/* Плательщик */}
              <ClientField
                label="Плательщик"
                clientName={workOrder.payer_name || workOrder.client}
                clientId={workOrder.payer_client_id ?? workOrder.client_id}
                clients={clients}
                isIssued={isIssued}
                isDifferent={!!(workOrder.payer_client_id && workOrder.payer_client_id !== workOrder.client_id)}
                onSave={(clientId, clientName) => handleUpdatePayer(clientId)}
                onNavigate={(cid) => navigate(`/clients/${cid}`)}
              />

              {/* Автомобиль */}
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Автомобиль</span>
                <span className="text-sm font-semibold text-foreground">{workOrder.car || "—"}</span>
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