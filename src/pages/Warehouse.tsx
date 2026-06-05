import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";
import WarehouseProductsTab, { Product, ProductForm } from "@/components/warehouse/WarehouseProductsTab";
import WarehouseSuppliersTab, { Supplier } from "@/components/warehouse/WarehouseSuppliersTab";
import WarehouseReceiptsTab, { Receipt } from "@/components/warehouse/WarehouseReceiptsTab";
import WarehouseTransfersTab, { Transfer } from "@/components/warehouse/WarehouseTransfersTab";
import { ExpenseDialog, type WorkOrderRef, type ReceiptRef, type ClientRef } from "@/pages/finance/FinanceDialogs";
import type { Cashbox, ExpenseGroup } from "@/pages/finance/useFinanceData";

interface Dashboard {
  total_products: number;
  total_quantity: number;
  total_supplied: number;
  low_stock_count: number;
  suppliers_count: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

const todayDate = () => new Date().toISOString().slice(0, 10);

const Warehouse = () => {
  const [tab, setTab] = useState<"products" | "suppliers" | "receipts" | "transfers">("products");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  // ExpenseDialog для оплаты поступления
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [expenseGroups, setExpenseGroups] = useState<ExpenseGroup[]>([]);
  const [activeCashboxes, setActiveCashboxes] = useState<Cashbox[]>([]);
  const [expenseForm, setExpenseForm] = useState({
    amount: 0,
    cashbox_id: 0,
    expense_group_id: "",
    comment: "",
    work_order_id: "",
    stock_receipt_id: "",
    client_id: "",
    operation_date: todayDate(),
  });

  const api = async (params: string) => {
    const url = getApiUrl("warehouse");
    if (!url) return null;
    const res = await fetch(`${url}?${params}`);
    return res.json();
  };

  const apiPost = async (body: Record<string, unknown>) => {
    const url = getApiUrl("warehouse");
    if (!url) return null;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const fetchAll = async () => {
    try {
      const [d, p, s, r, tr] = await Promise.all([
        api("section=dashboard"),
        api("section=products"),
        api("section=suppliers"),
        api("section=receipts"),
        api("section=transfers"),
      ]);
      if (d) setDashboard(d);
      if (p?.products) setProducts(p.products);
      if (s?.suppliers) setSuppliers(s.suppliers);
      if (r?.receipts) setReceipts(r.receipts);
      if (tr?.transfers) setTransfers(tr.transfers);
    } catch {
      toast.error("Ошибка загрузки склада");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handlePayReceipt = async (receipt: Receipt) => {
    try {
      const finUrl = getApiUrl("finance");
      if (!finUrl) return;
      const [cbRes, egRes] = await Promise.all([
        fetch(`${finUrl}?section=cashboxes`),
        fetch(`${finUrl}?section=expense_groups`),
      ]);
      const cbData = await cbRes.json();
      const egData = await egRes.json();
      const boxes: Cashbox[] = (cbData.cashboxes || []).filter((c: Cashbox) => c.is_active);
      const groups: ExpenseGroup[] = egData.expense_groups || [];
      setActiveCashboxes(boxes);
      setExpenseGroups(groups);

      const supplierGroup = groups.find((g) => g.name === "Оплата поставщиков");
      setExpenseForm({
        amount: Number(receipt.total_amount),
        cashbox_id: boxes[0]?.id || 0,
        expense_group_id: supplierGroup ? String(supplierGroup.id) : "",
        comment: `Оплата поступления ${receipt.receipt_number}${receipt.supplier_name ? ` (${receipt.supplier_name})` : ""}`,
        work_order_id: "",
        stock_receipt_id: String(receipt.id),
        client_id: "",
        operation_date: todayDate(),
      });
      setExpenseDialogOpen(true);
    } catch {
      toast.error("Не удалось загрузить данные для оплаты");
    }
  };

  const handleCreateExpense = async () => {
    if (!expenseForm.amount || !expenseForm.cashbox_id) {
      toast.error("Укажите сумму и кассу");
      return;
    }
    setExpenseSubmitting(true);
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const body: Record<string, unknown> = {
        action: "create_expense",
        amount: expenseForm.amount,
        cashbox_id: expenseForm.cashbox_id,
        comment: expenseForm.comment,
        operation_date: expenseForm.operation_date,
      };
      if (expenseForm.expense_group_id && expenseForm.expense_group_id !== "none")
        body.expense_group_id = Number(expenseForm.expense_group_id);
      if (expenseForm.stock_receipt_id)
        body.stock_receipt_id = Number(expenseForm.stock_receipt_id);
      if (expenseForm.work_order_id)
        body.work_order_id = Number(expenseForm.work_order_id);
      if (expenseForm.client_id)
        body.client_id = Number(expenseForm.client_id);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Ошибка сервера");
      toast.success("Расход записан");
      setExpenseDialogOpen(false);
      fetchAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка создания расхода");
    } finally {
      setExpenseSubmitting(false);
    }
  };

  const handleSaveProduct = async (form: ProductForm, editingId?: number) => {
    if (!form.sku?.trim() || !form.name?.trim()) {
      toast.error("Укажите номенклатурный номер и название");
      return;
    }
    try {
      const body = editingId
        ? { action: "update_product", product_id: editingId, ...form }
        : { action: "create_product", ...form };
      const data = await apiPost(body);
      if (data?.error) { toast.error(data.error); return; }
      toast.success(editingId ? "Номенклатура обновлена" : "Номенклатура добавлена");
      fetchAll();
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  const handleSaveSupplier = async (form: Record<string, unknown>, editingId?: number) => {
    if (!(form.name as string)?.trim()) { toast.error("Укажите название поставщика"); return; }
    try {
      const body: Record<string, unknown> = editingId
        ? { action: "update_supplier", supplier_id: editingId, ...form }
        : { action: "create_supplier", ...form };
      const data = await apiPost(body);
      if (data?.error) { toast.error(data.error); return; }
      toast.success(editingId ? "Поставщик обновлён" : "Поставщик добавлен");
      fetchAll();
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  const handleCreateReceipt = async (payload: { supplier_id: number | null; document_number: string; document_date: string | null; notes: string; items: { product_id: number; quantity: number; price: number }[] }) => {
    if (payload.items.length === 0) { toast.error("Добавьте хотя бы один товар"); return; }
    try {
      const data = await apiPost({ action: "create_receipt", ...payload });
      if (data?.error) { toast.error(data.error); return; }
      toast.success("Поступление оформлено");
      fetchAll();
    } catch {
      toast.error("Ошибка оформления поступления");
    }
  };

  return (
    <Layout title="Склад">
      <div className="space-y-6">
        {dashboard && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Товаров" value={String(dashboard.total_products)} icon="Package" color="blue" />
            <StatCard title="Общее кол-во" value={String(dashboard.total_quantity)} icon="Layers" color="green" />
            <StatCard title="Стоимость склада" value={fmt(dashboard.total_supplied)} icon="DollarSign" color="purple" />
            <StatCard
              title="Мало на складе"
              value={String(dashboard.low_stock_count)}
              icon="AlertTriangle"
              color={dashboard.low_stock_count > 0 ? "orange" : "green"}
            />
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {([
            { key: "products", label: "Номенклатура", icon: "Package" },
            { key: "receipts", label: "Поступления", icon: "FileInput" },
            { key: "transfers", label: "Перемещения", icon: "ArrowLeftRight" },
            { key: "suppliers", label: "Поставщики", icon: "Truck" },
          ] as const).map((t) => (
            <Button
              key={t.key}
              variant={tab === t.key ? "default" : "outline"}
              size="sm"
              className={tab === t.key ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
              onClick={() => setTab(t.key)}
            >
              <Icon name={t.icon} size={16} className="mr-1.5" />
              {t.label}
              {t.key === "transfers" && transfers.length > 0 && (
                <span className="ml-1.5 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {transfers.length}
                </span>
              )}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Загрузка...</div>
        ) : tab === "products" ? (
          <WarehouseProductsTab products={products} onSave={handleSaveProduct} />
        ) : tab === "receipts" ? (
          <WarehouseReceiptsTab receipts={receipts} products={products} suppliers={suppliers} onCreate={handleCreateReceipt} onPay={handlePayReceipt} />
        ) : tab === "transfers" ? (
          <WarehouseTransfersTab transfers={transfers} />
        ) : tab === "suppliers" ? (
          <WarehouseSuppliersTab suppliers={suppliers} onSave={handleSaveSupplier} />
        ) : null}
      </div>

      <ExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        expenseForm={expenseForm}
        setExpenseForm={setExpenseForm}
        activeCashboxes={activeCashboxes}
        expenseGroups={expenseGroups}
        workOrders={[] as WorkOrderRef[]}
        receipts={receipts.map((r) => ({ id: r.id, receipt_number: r.receipt_number, supplier_name: r.supplier_name, total_amount: Number(r.total_amount), document_date: r.document_date })) as ReceiptRef[]}
        clients={[] as ClientRef[]}
        onCreate={handleCreateExpense}
        submitting={expenseSubmitting}
      />
    </Layout>
  );
};

const StatCard = ({ title, value, icon, color }: {
  title: string; value: string; icon: string; color: string;
}) => {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-500",
    green: "bg-green-50 text-green-500",
    purple: "bg-purple-50 text-purple-500",
    orange: "bg-orange-50 text-orange-500",
  };
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon name={icon} size={20} />
        </div>
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{title}</div>
    </div>
  );
};

export default Warehouse;