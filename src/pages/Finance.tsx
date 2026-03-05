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
import FinanceDashboard from "@/components/finance/FinanceDashboard";
import FinancePayments from "@/components/finance/FinancePayments";
import FinanceExpenses from "@/components/finance/FinanceExpenses";
import FinanceCashboxes from "@/components/finance/FinanceCashboxes";

interface Cashbox {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  balance: number;
  total_received: number;
}

interface Payment {
  id: number;
  work_order_id: number;
  cashbox_id: number;
  amount: number;
  payment_method: string;
  comment: string;
  created_at: string;
  cashbox_name: string;
  cashbox_type: string;
  client_name: string;
  work_order_number: string;
}

interface Dashboard {
  total_revenue: number;
  month_revenue: number;
  today_revenue: number;
  prev_month_revenue: number;
  total_payments: number;
  completed_orders: number;
  total_works: number;
  total_parts: number;
  by_method: Record<string, number>;
  cashboxes: Cashbox[];
}

interface ExpenseGroup {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  total_spent: number;
  expense_count: number;
}

interface Expense {
  id: number;
  expense_group_id: number | null;
  cashbox_id: number;
  amount: number;
  comment: string;
  created_at: string;
  cashbox_name: string;
  cashbox_type: string;
  group_name: string | null;
}

const Finance = () => {
  const [tab, setTab] = useState<"dashboard" | "payments" | "expenses" | "cashboxes">("dashboard");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [cashboxDialogOpen, setCashboxDialogOpen] = useState(false);
  const [editingCashbox, setEditingCashbox] = useState<Cashbox | null>(null);
  const [cashboxForm, setCashboxForm] = useState({ name: "", type: "cash" });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseGroups, setExpenseGroups] = useState<ExpenseGroup[]>([]);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ amount: 0, cashbox_id: 0, expense_group_id: "", comment: "" });
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "", description: "" });
  const [expenseSubTab, setExpenseSubTab] = useState<"list" | "groups">("list");

  const fetchDashboard = async () => {
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(`${url}?section=dashboard`);
      const data = await res.json();
      setDashboard(data);
    } catch {
      toast.error("Ошибка загрузки финансов");
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(`${url}?section=payments`);
      const data = await res.json();
      if (data.payments) setPayments(data.payments);
    } catch {
      toast.error("Ошибка загрузки платежей");
    }
  };

  const fetchExpenses = async () => {
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(`${url}?section=expenses`);
      const data = await res.json();
      if (data.expenses) setExpenses(data.expenses);
    } catch {
      toast.error("Ошибка загрузки расходов");
    }
  };

  const fetchExpenseGroups = async () => {
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(`${url}?section=expense_groups`);
      const data = await res.json();
      if (data.expense_groups) setExpenseGroups(data.expense_groups);
    } catch {
      toast.error("Ошибка загрузки групп расходов");
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchPayments();
    fetchExpenses();
    fetchExpenseGroups();
  }, []);

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
        body: JSON.stringify({ action: "update_cashbox", cashbox_id: cb.id, is_active: !cb.is_active }),
      });
      toast.success(cb.is_active ? "Касса деактивирована" : "Касса активирована");
      fetchDashboard();
    } catch {
      toast.error("Ошибка");
    }
  };

  const openCreateExpense = () => {
    const activeCashboxes = dashboard?.cashboxes.filter((c) => c.is_active) || [];
    setExpenseForm({
      amount: 0,
      cashbox_id: activeCashboxes[0]?.id || 0,
      expense_group_id: "",
      comment: "",
    });
    setExpenseDialogOpen(true);
  };

  const handleCreateExpense = async () => {
    if (!expenseForm.amount || !expenseForm.cashbox_id) {
      toast.error("Укажите сумму и выберите кассу");
      return;
    }
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const body: Record<string, unknown> = {
        action: "create_expense",
        cashbox_id: expenseForm.cashbox_id,
        amount: expenseForm.amount,
        comment: expenseForm.comment,
      };
      if (expenseForm.expense_group_id) {
        body.expense_group_id = Number(expenseForm.expense_group_id);
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

  const monthDiff = dashboard
    ? dashboard.prev_month_revenue > 0
      ? Math.round(((dashboard.month_revenue - dashboard.prev_month_revenue) / dashboard.prev_month_revenue) * 100)
      : dashboard.month_revenue > 0
        ? 100
        : 0
    : 0;

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const activeCashboxes = dashboard?.cashboxes.filter((c) => c.is_active) || [];

  return (
    <Layout title="Финансы">
      <div className="space-y-6">
        <div className="flex gap-2 flex-wrap">
          {([
            { key: "dashboard", label: "Обзор", icon: "BarChart3" },
            { key: "payments", label: "Платежи", icon: "Receipt" },
            { key: "expenses", label: "Расходы", icon: "TrendingDown" },
            { key: "cashboxes", label: "Кассы", icon: "Wallet" },
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
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Загрузка...</div>
        ) : tab === "dashboard" && dashboard ? (
          <FinanceDashboard
            dashboard={dashboard}
            totalExpenses={totalExpenses}
            monthDiff={monthDiff}
          />
        ) : tab === "payments" ? (
          <FinancePayments payments={payments} />
        ) : tab === "expenses" ? (
          <FinanceExpenses
            expenses={expenses}
            expenseGroups={expenseGroups}
            expenseSubTab={expenseSubTab}
            totalExpenses={totalExpenses}
            onSetSubTab={setExpenseSubTab}
            onOpenCreateExpense={openCreateExpense}
            onOpenCreateGroup={openCreateGroup}
          />
        ) : tab === "cashboxes" ? (
          <FinanceCashboxes
            cashboxes={dashboard?.cashboxes || []}
            onOpenCreate={openCreateCashbox}
            onOpenEdit={openEditCashbox}
            onToggle={handleToggleCashbox}
            onDelete={handleDeleteCashbox}
          />
        ) : null}
      </div>

      {/* Диалог создания кассы */}
      <Dialog open={cashboxDialogOpen} onOpenChange={setCashboxDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCashbox ? "Редактировать кассу" : "Новая касса"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Название</label>
              <Input
                value={cashboxForm.name}
                onChange={(e) => setCashboxForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Например: Основная касса"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Тип</label>
              <Select value={cashboxForm.type} onValueChange={(v) => setCashboxForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Наличные</SelectItem>
                  <SelectItem value="bank">Расчётный счёт</SelectItem>
                  <SelectItem value="card">Терминал</SelectItem>
                  <SelectItem value="online">Онлайн</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setCashboxDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleSaveCashbox}>
                {editingCashbox ? "Сохранить" : "Создать"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог создания расхода */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Расходно-кассовый ордер</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Сумма *</label>
              <Input
                type="number"
                value={expenseForm.amount || ""}
                onChange={(e) => setExpenseForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Касса *</label>
              <Select
                value={String(expenseForm.cashbox_id)}
                onValueChange={(v) => setExpenseForm((f) => ({ ...f, cashbox_id: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите кассу" />
                </SelectTrigger>
                <SelectContent>
                  {activeCashboxes.map((cb) => (
                    <SelectItem key={cb.id} value={String(cb.id)}>
                      {cb.name} ({new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(Number(cb.balance))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Группа расходов</label>
              <Select
                value={expenseForm.expense_group_id}
                onValueChange={(v) => setExpenseForm((f) => ({ ...f, expense_group_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Без группы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без группы</SelectItem>
                  {expenseGroups.filter((g) => g.is_active).map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Комментарий</label>
              <Input
                value={expenseForm.comment}
                onChange={(e) => setExpenseForm((f) => ({ ...f, comment: e.target.value }))}
                placeholder="За что расход"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setExpenseDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={handleCreateExpense}>
                <Icon name="Minus" size={16} className="mr-1.5" />
                Списать {expenseForm.amount ? new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(expenseForm.amount) : ""}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог создания группы расходов */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Новая группа расходов</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Название *</label>
              <Input
                value={groupForm.name}
                onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Например: Аренда"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Описание</label>
              <Input
                value={groupForm.description}
                onChange={(e) => setGroupForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Необязательно"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setGroupDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleCreateGroup}>
                Создать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Finance;
