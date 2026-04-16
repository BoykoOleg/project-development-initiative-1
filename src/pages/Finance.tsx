import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import Layout from "@/components/Layout";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";
import FinanceDashboard from "@/components/finance/FinanceDashboard";
import FinancePayments from "@/components/finance/FinancePayments";
import FinanceExpenses from "@/components/finance/FinanceExpenses";
import FinanceCashboxes from "@/components/finance/FinanceCashboxes";
import FinanceIncomes from "@/components/finance/FinanceIncomes";
import FinanceTransfers from "@/components/finance/FinanceTransfers";
import FinanceEconomics from "@/components/finance/FinanceEconomics";
import FinanceTochkaBank from "@/components/finance/FinanceTochkaBank";
import { useFinanceData } from "./finance/useFinanceData";
import type { Cashbox } from "./finance/useFinanceData";
import FinanceTabBar from "./finance/FinanceTabBar";
import {
  CashboxDialog,
  ExpenseDialog,
  EditExpenseDialog,
  EditPaymentDialog,
  EditIncomeDialog,
  GroupDialog,
  IncomeDialog,
  TransferDialog,
  type WorkOrderRef,
  type ReceiptRef,
  type ClientRef,
  type EditExpenseForm,
  type EditPaymentForm,
  type EditIncomeForm,
} from "./finance/FinanceDialogs";

const Finance = () => {
  const [tab, setTab] = useState<
    | "dashboard"
    | "payments"
    | "expenses"
    | "cashboxes"
    | "incomes"
    | "transfers"
    | "economics"
    | "tochka"
  >("dashboard");

  const {
    dashboard,
    payments,
    incomes,
    transfers,
    loading,
    expenses,
    expenseGroups,
    fetchDashboard,
    fetchPayments,
    fetchExpenses,
    fetchExpenseGroups,
    fetchIncomes,
    fetchTransfers,
  } = useFinanceData();

  const [cashboxDialogOpen, setCashboxDialogOpen] = useState(false);
  const [editingCashbox, setEditingCashbox] = useState<Cashbox | null>(null);
  const [cashboxForm, setCashboxForm] = useState({ name: "", type: "cash" });

  const [workOrders, setWorkOrders] = useState<WorkOrderRef[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRef[]>([]);
  const [clients, setClients] = useState<ClientRef[]>([]);

  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        const url = getApiUrl("work-orders");
        if (!url) return;
        const res = await fetch(url);
        const data = await res.json();
        if (data.work_orders) {
          setWorkOrders(
            data.work_orders.map((wo: { id: number; client: string; car: string }) => ({
              id: wo.id,
              number: `Н-${String(wo.id).padStart(4, "0")}`,
              client_name: wo.client || "",
              car_info: wo.car || "",
            })),
          );
        }
      } catch (err) {
        console.error(err);
      }
    };
    const fetchReceipts = async () => {
      try {
        const url = getApiUrl("warehouse");
        if (!url) return;
        const res = await fetch(`${url}?section=receipts`);
        const data = await res.json();
        if (data.receipts) setReceipts(data.receipts);
      } catch (err) {
        console.error(err);
      }
    };
    const fetchClients = async () => {
      try {
        const url = getApiUrl("finance");
        if (!url) return;
        const res = await fetch(`${url}?section=clients`);
        const data = await res.json();
        if (data.clients) setClients(data.clients);
      } catch (err) {
        console.error(err);
      }
    };
    fetchWorkOrders();
    fetchReceipts();
    fetchClients();
  }, []);

  const todayDate = () => new Date().toISOString().slice(0, 10);

  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
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
  const [editExpenseDialogOpen, setEditExpenseDialogOpen] = useState(false);
  const [editExpenseSubmitting, setEditExpenseSubmitting] = useState(false);
  const [editExpenseForm, setEditExpenseForm] = useState<EditExpenseForm>({
    id: 0,
    cashbox_id: 0,
    expense_group_id: "",
    comment: "",
    work_order_id: "",
    stock_receipt_id: "",
    amount: 0,
    client_id: "",
    operation_date: todayDate(),
  });

  const [editPaymentDialogOpen, setEditPaymentDialogOpen] = useState(false);
  const [editPaymentSubmitting, setEditPaymentSubmitting] = useState(false);
  const [editPaymentForm, setEditPaymentForm] = useState<EditPaymentForm>({
    id: 0,
    cashbox_id: 0,
    payment_method: "cash",
    comment: "",
    amount: 0,
    client_name: "",
    work_order_number: "",
  });

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "", description: "" });
  const [expenseSubTab, setExpenseSubTab] = useState<"list" | "groups">("list");

  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [incomeForm, setIncomeForm] = useState({
    amount: 0,
    cashbox_id: 0,
    income_type: "other",
    comment: "",
    work_order_id: "",
    client_id: "",
    operation_date: todayDate(),
  });
  const [editIncomeDialogOpen, setEditIncomeDialogOpen] = useState(false);
  const [editIncomeSubmitting, setEditIncomeSubmitting] = useState(false);
  const [editIncomeForm, setEditIncomeForm] = useState<EditIncomeForm>({
    id: 0,
    cashbox_id: 0,
    income_type: "other",
    comment: "",
    work_order_id: "",
    amount: 0,
    client_id: "",
    operation_date: todayDate(),
  });
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    amount: 0,
    from_cashbox_id: 0,
    to_cashbox_id: 0,
    comment: "",
  });

  const openCreateCashbox = () => {
    setEditingCashbox(null);
    setCashboxForm({ name: "", type: "cash" });
    setCashboxDialogOpen(true);
  };

  const openEditCashbox = (cb: Cashbox) => {
    setEditingCashbox(cb);
    setCashboxForm({ name: cb.name, type: cb.type });
    setCashboxDialogOpen(true);
  };

  const handleSaveCashbox = async () => {
    if (!cashboxForm.name.trim()) {
      toast.error("Введите название кассы");
      return;
    }
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const action = editingCashbox ? "update_cashbox" : "create_cashbox";
      const body: Record<string, unknown> = { action, ...cashboxForm };
      if (editingCashbox) body.cashbox_id = editingCashbox.id;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success(editingCashbox ? "Касса обновлена" : "Касса создана");
      setCashboxDialogOpen(false);
      fetchDashboard();
    } catch {
      toast.error("Ошибка сохранения кассы");
    }
  };

  const handleDeleteCashbox = async (cb: Cashbox) => {
    if (!confirm(`Удалить кассу "${cb.name}"?`)) return;
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_cashbox", cashbox_id: cb.id }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success("Касса удалена");
      fetchDashboard();
    } catch {
      toast.error("Ошибка удаления кассы");
    }
  };

  const handleToggleCashbox = async (cb: Cashbox) => {
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_cashbox",
          cashbox_id: cb.id,
          is_active: !cb.is_active,
        }),
      });
      toast.success(
        cb.is_active ? "Касса деактивирована" : "Касса активирована",
      );
      fetchDashboard();
    } catch {
      toast.error("Ошибка");
    }
  };

  const openCreateExpense = () => {
    const activeCashboxes =
      dashboard?.cashboxes.filter((c) => c.is_active) || [];
    setExpenseForm({
      amount: 0,
      cashbox_id: activeCashboxes[0]?.id || 0,
      expense_group_id: "",
      comment: "",
      work_order_id: "",
      stock_receipt_id: "",
      client_id: "",
      operation_date: todayDate(),
    });
    setExpenseDialogOpen(true);
  };

  const handleCreateExpense = async () => {
    if (expenseSubmitting) return;
    if (expenseForm.amount <= 0 || !expenseForm.cashbox_id) {
      toast.error("Укажите сумму и выберите кассу");
      return;
    }
    setExpenseSubmitting(true);
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const body: Record<string, unknown> = {
        action: "create_expense",
        cashbox_id: expenseForm.cashbox_id,
        amount: expenseForm.amount,
        comment: expenseForm.comment,
        operation_date: expenseForm.operation_date || null,
      };
      if (expenseForm.expense_group_id && expenseForm.expense_group_id !== "none") {
        body.expense_group_id = Number(expenseForm.expense_group_id);
      }
      if (expenseForm.work_order_id && expenseForm.work_order_id !== "none") {
        body.work_order_id = Number(expenseForm.work_order_id);
      }
      if (expenseForm.stock_receipt_id && expenseForm.stock_receipt_id !== "none") {
        body.stock_receipt_id = Number(expenseForm.stock_receipt_id);
      }
      if (expenseForm.client_id && expenseForm.client_id !== "none") {
        body.client_id = Number(expenseForm.client_id);
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success("Расход создан");
      setExpenseDialogOpen(false);
      fetchExpenses();
      fetchDashboard();
    } catch {
      toast.error("Ошибка при создании расхода");
    } finally {
      setExpenseSubmitting(false);
    }
  };

  const openEditExpense = (expense: { id: number; cashbox_id: number; expense_group_id: number | null; comment: string; work_order_id: number | null; stock_receipt_id: number | null; amount: number; client_id?: number | null; operation_date?: string | null }) => {
    setEditExpenseForm({
      id: expense.id,
      cashbox_id: expense.cashbox_id,
      expense_group_id: expense.expense_group_id ? String(expense.expense_group_id) : "none",
      comment: expense.comment || "",
      work_order_id: expense.work_order_id ? String(expense.work_order_id) : "",
      stock_receipt_id: expense.stock_receipt_id ? String(expense.stock_receipt_id) : "",
      amount: Number(expense.amount),
      client_id: expense.client_id ? String(expense.client_id) : "",
      operation_date: expense.operation_date ? String(expense.operation_date).slice(0, 10) : todayDate(),
    });
    setEditExpenseDialogOpen(true);
  };

  const handleUpdateExpense = async () => {
    if (editExpenseSubmitting) return;
    setEditExpenseSubmitting(true);
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const body: Record<string, unknown> = {
        action: "update_expense",
        expense_id: editExpenseForm.id,
        cashbox_id: editExpenseForm.cashbox_id,
        comment: editExpenseForm.comment,
        operation_date: editExpenseForm.operation_date || null,
      };
      if (editExpenseForm.expense_group_id && editExpenseForm.expense_group_id !== "none") {
        body.expense_group_id = Number(editExpenseForm.expense_group_id);
      }
      if (editExpenseForm.work_order_id && editExpenseForm.work_order_id !== "none") {
        body.work_order_id = Number(editExpenseForm.work_order_id);
      }
      if (editExpenseForm.stock_receipt_id && editExpenseForm.stock_receipt_id !== "none") {
        body.stock_receipt_id = Number(editExpenseForm.stock_receipt_id);
      }
      if (editExpenseForm.client_id && editExpenseForm.client_id !== "none") {
        body.client_id = Number(editExpenseForm.client_id);
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success("Расход обновлён");
      setEditExpenseDialogOpen(false);
      fetchExpenses();
      fetchDashboard();
    } catch {
      toast.error("Ошибка при обновлении расхода");
    } finally {
      setEditExpenseSubmitting(false);
    }
  };

  const openEditPayment = (payment: { id: number; cashbox_id: number; payment_method: string; comment: string; amount: number; client_name: string; work_order_number: string }) => {
    setEditPaymentForm({
      id: payment.id,
      cashbox_id: payment.cashbox_id,
      payment_method: payment.payment_method,
      comment: payment.comment || "",
      amount: Number(payment.amount),
      client_name: payment.client_name,
      work_order_number: payment.work_order_number,
    });
    setEditPaymentDialogOpen(true);
  };

  const handleUpdatePayment = async () => {
    if (editPaymentSubmitting) return;
    setEditPaymentSubmitting(true);
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const body: Record<string, unknown> = {
        action: "update_payment",
        payment_id: editPaymentForm.id,
        cashbox_id: editPaymentForm.cashbox_id,
        payment_method: editPaymentForm.payment_method,
        comment: editPaymentForm.comment,
      };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success("Платёж обновлён");
      setEditPaymentDialogOpen(false);
      fetchPayments();
      fetchDashboard();
    } catch {
      toast.error("Ошибка при обновлении платежа");
    } finally {
      setEditPaymentSubmitting(false);
    }
  };

  const openCreateGroup = () => {
    setGroupForm({ name: "", description: "" });
    setGroupDialogOpen(true);
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) {
      toast.error("Введите название группы");
      return;
    }
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_expense_group", ...groupForm }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success("Группа расходов создана");
      setGroupDialogOpen(false);
      fetchExpenseGroups();
    } catch {
      toast.error("Ошибка при создании группы");
    }
  };

  const openCreateIncome = () => {
    const activeCashboxes =
      dashboard?.cashboxes.filter((c) => c.is_active) || [];
    setIncomeForm({
      amount: 0,
      cashbox_id: activeCashboxes[0]?.id || 0,
      income_type: "other",
      comment: "",
      work_order_id: "",
      client_id: "",
      operation_date: todayDate(),
    });
    setIncomeDialogOpen(true);
  };

  const openEditIncome = (income: { id: number; cashbox_id: number; income_type: string; comment: string; work_order_id: number | null; amount: number; client_id?: number | null; operation_date?: string | null }) => {
    setEditIncomeForm({
      id: income.id,
      cashbox_id: income.cashbox_id,
      income_type: income.income_type || "other",
      comment: income.comment || "",
      work_order_id: income.work_order_id ? String(income.work_order_id) : "",
      amount: Number(income.amount),
      client_id: income.client_id ? String(income.client_id) : "",
      operation_date: income.operation_date ? String(income.operation_date).slice(0, 10) : todayDate(),
    });
    setEditIncomeDialogOpen(true);
  };

  const handleCreateIncome = async () => {
    if (incomeForm.amount <= 0 || !incomeForm.cashbox_id) {
      toast.error("Укажите сумму и выберите кассу");
      return;
    }
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const body: Record<string, unknown> = {
        action: "create_income",
        cashbox_id: incomeForm.cashbox_id,
        amount: incomeForm.amount,
        income_type: incomeForm.income_type,
        comment: incomeForm.comment,
        operation_date: incomeForm.operation_date || null,
      };
      if (incomeForm.work_order_id && incomeForm.work_order_id !== "none") {
        body.work_order_id = Number(incomeForm.work_order_id);
      }
      if (incomeForm.client_id && incomeForm.client_id !== "none") {
        body.client_id = Number(incomeForm.client_id);
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success("Приходный ордер создан");
      setIncomeDialogOpen(false);
      fetchIncomes();
      fetchDashboard();
    } catch {
      toast.error("Ошибка при создании приходного ордера");
    }
  };

  const handleUpdateIncome = async () => {
    if (editIncomeSubmitting) return;
    setEditIncomeSubmitting(true);
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const body: Record<string, unknown> = {
        action: "update_income",
        income_id: editIncomeForm.id,
        cashbox_id: editIncomeForm.cashbox_id,
        income_type: editIncomeForm.income_type,
        comment: editIncomeForm.comment,
        operation_date: editIncomeForm.operation_date || null,
      };
      if (editIncomeForm.work_order_id && editIncomeForm.work_order_id !== "none") {
        body.work_order_id = Number(editIncomeForm.work_order_id);
      }
      if (editIncomeForm.client_id && editIncomeForm.client_id !== "none") {
        body.client_id = Number(editIncomeForm.client_id);
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success("Приход обновлён");
      setEditIncomeDialogOpen(false);
      fetchIncomes();
      fetchDashboard();
    } catch {
      toast.error("Ошибка при обновлении прихода");
    } finally {
      setEditIncomeSubmitting(false);
    }
  };

  const openCreateTransfer = () => {
    const activeCashboxes =
      dashboard?.cashboxes.filter((c) => c.is_active) || [];
    setTransferForm({
      amount: 0,
      from_cashbox_id: activeCashboxes[0]?.id || 0,
      to_cashbox_id:
        activeCashboxes.length > 1 ? activeCashboxes[1]?.id || 0 : 0,
      comment: "",
    });
    setTransferDialogOpen(true);
  };

  const handleCreateTransfer = async () => {
    if (
      transferForm.amount <= 0 ||
      !transferForm.from_cashbox_id ||
      !transferForm.to_cashbox_id
    ) {
      toast.error("Укажите сумму и выберите кассы");
      return;
    }
    if (transferForm.from_cashbox_id === transferForm.to_cashbox_id) {
      toast.error("Нельзя переводить деньги в ту же кассу");
      return;
    }
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const body: Record<string, unknown> = {
        action: "create_transfer",
        from_cashbox_id: transferForm.from_cashbox_id,
        to_cashbox_id: transferForm.to_cashbox_id,
        amount: transferForm.amount,
        comment: transferForm.comment,
      };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success("Перемещение создано");
      setTransferDialogOpen(false);
      fetchTransfers();
      fetchDashboard();
    } catch {
      toast.error("Ошибка при создании перемещения");
    }
  };

  const monthDiff = dashboard
    ? dashboard.prev_month_revenue > 0
      ? Math.round(
          ((dashboard.month_revenue - dashboard.prev_month_revenue) /
            dashboard.prev_month_revenue) *
            100,
        )
      : dashboard.month_revenue > 0
        ? 100
        : 0
    : 0;

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const activeCashboxes = dashboard?.cashboxes.filter((c) => c.is_active) || [];

  return (
    <Layout title="Финансы">
      <div className="space-y-6">
        <FinanceTabBar tab={tab} onSetTab={setTab} />

        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Загрузка...
          </div>
        ) : tab === "dashboard" && dashboard ? (
          <FinanceDashboard
            dashboard={dashboard}
            totalExpenses={totalExpenses}
            monthDiff={monthDiff}
          />
        ) : tab === "payments" ? (
          <FinancePayments payments={payments} onEditPayment={openEditPayment} />
        ) : tab === "expenses" ? (
          <FinanceExpenses
            expenses={expenses}
            expenseGroups={expenseGroups}
            expenseSubTab={expenseSubTab}
            totalExpenses={totalExpenses}
            onSetSubTab={setExpenseSubTab}
            onOpenCreateExpense={openCreateExpense}
            onOpenCreateGroup={openCreateGroup}
            onEditExpense={openEditExpense}
          />
        ) : tab === "cashboxes" ? (
          <FinanceCashboxes
            cashboxes={dashboard?.cashboxes || []}
            onOpenCreate={openCreateCashbox}
            onOpenEdit={openEditCashbox}
            onToggle={handleToggleCashbox}
            onDelete={handleDeleteCashbox}
          />
        ) : tab === "incomes" ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={openCreateIncome}
              >
                <Icon name="Plus" size={16} className="mr-1.5" />
                Новый приход
              </Button>
            </div>
            <FinanceIncomes incomes={incomes} onEditIncome={openEditIncome} />
          </div>
        ) : tab === "transfers" ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                className="bg-purple-500 hover:bg-purple-600 text-white"
                onClick={openCreateTransfer}
              >
                <Icon name="ArrowRightLeft" size={16} className="mr-1.5" />
                Новое перемещение
              </Button>
            </div>
            <FinanceTransfers transfers={transfers} />
          </div>
        ) : tab === "economics" ? (
          <FinanceEconomics />
        ) : tab === "tochka" ? (
          <FinanceTochkaBank onImported={() => { fetchExpenses(); fetchIncomes(); fetchDashboard(); }} />
        ) : null}
      </div>

      <CashboxDialog
        open={cashboxDialogOpen}
        onOpenChange={setCashboxDialogOpen}
        editingCashbox={editingCashbox}
        cashboxForm={cashboxForm}
        setCashboxForm={setCashboxForm}
        onSave={handleSaveCashbox}
      />

      <ExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        expenseForm={expenseForm}
        setExpenseForm={setExpenseForm}
        activeCashboxes={activeCashboxes}
        expenseGroups={expenseGroups}
        workOrders={workOrders}
        receipts={receipts}
        clients={clients}
        onCreate={handleCreateExpense}
        submitting={expenseSubmitting}
      />

      <EditExpenseDialog
        open={editExpenseDialogOpen}
        onOpenChange={setEditExpenseDialogOpen}
        form={editExpenseForm}
        setForm={setEditExpenseForm}
        activeCashboxes={activeCashboxes}
        expenseGroups={expenseGroups}
        workOrders={workOrders}
        receipts={receipts}
        clients={clients}
        onSave={handleUpdateExpense}
        submitting={editExpenseSubmitting}
      />

      <EditPaymentDialog
        open={editPaymentDialogOpen}
        onOpenChange={setEditPaymentDialogOpen}
        form={editPaymentForm}
        setForm={setEditPaymentForm}
        activeCashboxes={activeCashboxes}
        onSave={handleUpdatePayment}
        submitting={editPaymentSubmitting}
      />

      <GroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        groupForm={groupForm}
        setGroupForm={setGroupForm}
        onCreate={handleCreateGroup}
      />

      <IncomeDialog
        open={incomeDialogOpen}
        onOpenChange={setIncomeDialogOpen}
        incomeForm={incomeForm}
        setIncomeForm={setIncomeForm}
        activeCashboxes={activeCashboxes}
        workOrders={workOrders}
        clients={clients}
        onCreate={handleCreateIncome}
      />

      <EditIncomeDialog
        open={editIncomeDialogOpen}
        onOpenChange={setEditIncomeDialogOpen}
        form={editIncomeForm}
        setForm={setEditIncomeForm}
        activeCashboxes={activeCashboxes}
        workOrders={workOrders}
        clients={clients}
        onSave={handleUpdateIncome}
        submitting={editIncomeSubmitting}
      />

      <TransferDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        transferForm={transferForm}
        setTransferForm={setTransferForm}
        activeCashboxes={activeCashboxes}
        onCreate={handleCreateTransfer}
      />
    </Layout>
  );
};

export default Finance;