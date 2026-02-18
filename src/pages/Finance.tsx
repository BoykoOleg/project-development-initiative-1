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

const methodLabels: Record<string, string> = {
  cash: "Наличные",
  card: "Карта",
  transfer: "Перевод",
  online: "Онлайн",
};

const typeLabels: Record<string, string> = {
  cash: "Наличные",
  bank: "Расчётный счёт",
  card: "Терминал",
  online: "Онлайн",
};

const typeIcons: Record<string, string> = {
  cash: "Banknote",
  bank: "Building2",
  card: "CreditCard",
  online: "Globe",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

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
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Выручка сегодня"
                value={fmt(dashboard.today_revenue)}
                icon="CalendarDays"
                color="blue"
              />
              <StatCard
                title="Выручка за месяц"
                value={fmt(dashboard.month_revenue)}
                icon="TrendingUp"
                color="green"
                badge={monthDiff !== 0 ? `${monthDiff > 0 ? "+" : ""}${monthDiff}%` : undefined}
                badgePositive={monthDiff >= 0}
              />
              <StatCard
                title="Всего выручка"
                value={fmt(dashboard.total_revenue)}
                icon="DollarSign"
                color="purple"
              />
              <StatCard
                title="Расходы"
                value={fmt(totalExpenses)}
                icon="TrendingDown"
                color="orange"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-border p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Стоимость работ и запчастей</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Работы (итого)</span>
                    <span className="text-sm font-semibold">{fmt(dashboard.total_works)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Запчасти (итого)</span>
                    <span className="text-sm font-semibold">{fmt(dashboard.total_parts)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="text-sm font-medium">Итого начислено</span>
                    <span className="text-base font-bold text-foreground">{fmt(dashboard.total_works + dashboard.total_parts)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-600">Оплачено</span>
                    <span className="text-base font-bold text-green-600">{fmt(dashboard.total_revenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-red-600">Расходы</span>
                    <span className="text-base font-bold text-red-600">{fmt(totalExpenses)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-border p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Оплата по способам (месяц)</h3>
                {Object.keys(dashboard.by_method).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Нет данных за текущий месяц</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(dashboard.by_method).map(([method, amount]) => (
                      <div key={method} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{methodLabels[method] || method}</span>
                        <span className="text-sm font-semibold">{fmt(amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Кассы</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboard.cashboxes.map((cb) => (
                  <div key={cb.id} className={`rounded-lg border p-4 ${cb.is_active ? "border-border" : "border-border bg-gray-50 opacity-60"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name={typeIcons[cb.type] || "Wallet"} size={18} className="text-muted-foreground" />
                      <span className="text-sm font-medium">{cb.name}</span>
                    </div>
                    <div className="text-lg font-bold text-foreground">{fmt(Number(cb.balance))}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Получено: {fmt(Number(cb.total_received))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : tab === "payments" ? (
          <div className="bg-white rounded-xl border border-border shadow-sm">
            {payments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Receipt" size={28} className="text-blue-500" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Платежей пока нет</h3>
                <p className="text-sm text-muted-foreground">Принимайте оплату в заказ-нарядах</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Дата</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Наряд</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Клиент</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Способ</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Касса</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-5 py-3.5 text-sm">{new Date(p.created_at).toLocaleDateString("ru-RU")}</td>
                        <td className="px-5 py-3.5 text-sm font-medium text-blue-600">{p.work_order_number}</td>
                        <td className="px-5 py-3.5 text-sm">{p.client_name}</td>
                        <td className="px-5 py-3.5 text-sm hidden md:table-cell">{methodLabels[p.payment_method] || p.payment_method}</td>
                        <td className="px-5 py-3.5 text-sm hidden md:table-cell">{p.cashbox_name}</td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-right text-green-600">+{fmt(Number(p.amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : tab === "expenses" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={expenseSubTab === "list" ? "default" : "outline"}
                  size="sm"
                  className={expenseSubTab === "list" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
                  onClick={() => setExpenseSubTab("list")}
                >
                  Расходные ордера
                </Button>
                <Button
                  variant={expenseSubTab === "groups" ? "default" : "outline"}
                  size="sm"
                  className={expenseSubTab === "groups" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
                  onClick={() => setExpenseSubTab("groups")}
                >
                  Группы расходов
                </Button>
              </div>
              <div className="flex gap-2">
                {expenseSubTab === "list" ? (
                  <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={openCreateExpense}>
                    <Icon name="Minus" size={16} className="mr-1.5" />
                    Новый расход
                  </Button>
                ) : (
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={openCreateGroup}>
                    <Icon name="Plus" size={16} className="mr-1.5" />
                    Новая группа
                  </Button>
                )}
              </div>
            </div>

            {expenseSubTab === "list" ? (
              <div className="bg-white rounded-xl border border-border shadow-sm">
                {expenses.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon name="TrendingDown" size={28} className="text-red-500" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Расходов пока нет</h3>
                    <p className="text-sm text-muted-foreground mb-4">Создайте расходно-кассовый ордер</p>
                    <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={openCreateExpense}>
                      <Icon name="Minus" size={16} className="mr-1.5" />
                      Создать расход
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="px-5 py-3 border-b border-border bg-red-50/50 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Всего расходов: <strong>{expenses.length}</strong></span>
                      <span className="text-sm font-bold text-red-600">{fmt(totalExpenses)}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Дата</th>
                            <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Группа</th>
                            <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Касса</th>
                            <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden sm:table-cell">Комментарий</th>
                            <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Сумма</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.map((e) => (
                            <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                              <td className="px-5 py-3.5 text-sm">{new Date(e.created_at).toLocaleDateString("ru-RU")}</td>
                              <td className="px-5 py-3.5">
                                {e.group_name ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                    {e.group_name}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-sm hidden md:table-cell">{e.cashbox_name}</td>
                              <td className="px-5 py-3.5 text-sm text-muted-foreground hidden sm:table-cell truncate max-w-[200px]">
                                {e.comment || "—"}
                              </td>
                              <td className="px-5 py-3.5 text-sm font-semibold text-right text-red-600">
                                -{fmt(Number(e.amount))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {expenseGroups.length === 0 ? (
                  <div className="col-span-full bg-white rounded-xl border border-border p-12 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon name="FolderOpen" size={28} className="text-blue-500" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Групп расходов пока нет</h3>
                    <p className="text-sm text-muted-foreground mb-4">Создайте группы для классификации расходов</p>
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={openCreateGroup}>
                      <Icon name="Plus" size={16} className="mr-1.5" />
                      Создать группу
                    </Button>
                  </div>
                ) : (
                  expenseGroups.map((g) => (
                    <div
                      key={g.id}
                      className={`bg-white rounded-xl border p-5 space-y-3 ${g.is_active ? "border-border" : "border-border bg-gray-50 opacity-60"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                            <Icon name="FolderOpen" size={20} className="text-red-500" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{g.name}</div>
                            {g.description && (
                              <div className="text-xs text-muted-foreground">{g.description}</div>
                            )}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${g.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {g.is_active ? "Активна" : "Неактивна"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div>
                          <div className="text-lg font-bold text-red-600">{fmt(Number(g.total_spent))}</div>
                          <div className="text-xs text-muted-foreground">{g.expense_count} расходов</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : tab === "cashboxes" ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={openCreateCashbox}>
                <Icon name="Plus" size={16} className="mr-1.5" />
                Добавить кассу
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboard?.cashboxes.map((cb) => (
                <div key={cb.id} className={`bg-white rounded-xl border p-5 space-y-3 ${cb.is_active ? "border-border" : "border-border bg-gray-50"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cb.is_active ? "bg-blue-50" : "bg-gray-100"}`}>
                        <Icon name={typeIcons[cb.type] || "Wallet"} size={20} className={cb.is_active ? "text-blue-500" : "text-gray-400"} />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{cb.name}</div>
                        <div className="text-xs text-muted-foreground">{typeLabels[cb.type] || cb.type}</div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cb.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {cb.is_active ? "Активна" : "Неактивна"}
                    </span>
                  </div>
                  <div className="text-xl font-bold">{fmt(Number(cb.balance))}</div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditCashbox(cb)}>
                      <Icon name="Pencil" size={14} className="mr-1" />
                      Изменить
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggleCashbox(cb)}>
                      <Icon name={cb.is_active ? "EyeOff" : "Eye"} size={14} />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteCashbox(cb)}>
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                      {cb.name} ({fmt(Number(cb.balance))})
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
                Списать {expenseForm.amount ? fmt(expenseForm.amount) : ""}
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

const StatCard = ({ title, value, icon, color, badge, badgePositive }: {
  title: string;
  value: string;
  icon: string;
  color: string;
  badge?: string;
  badgePositive?: boolean;
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
        {badge && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgePositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{title}</div>
    </div>
  );
};

export default Finance;
