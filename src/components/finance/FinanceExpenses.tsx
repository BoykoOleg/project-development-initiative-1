import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/api";

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
  work_order_id: number | null;
  stock_receipt_id: number | null;
  client_id?: number | null;
  client_name?: string | null;
  operation_date?: string | null;
}

interface ExpenseGroup {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  total_spent: number;
  expense_count: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

interface Props {
  expenses: Expense[];
  expenseGroups: ExpenseGroup[];
  expenseSubTab: "list" | "groups";
  totalExpenses: number;
  onSetSubTab: (tab: "list" | "groups") => void;
  onOpenCreateExpense: () => void;
  onOpenCreateGroup: () => void;
  onEditExpense?: (expense: Expense) => void;
  onEditGroup?: (group: ExpenseGroup) => void;
  onDeleteGroup?: (group: ExpenseGroup) => void;
}

interface GroupRowProps {
  group: ExpenseGroup;
  onEditExpense?: (expense: Expense) => void;
  onEditGroup?: (group: ExpenseGroup) => void;
  onDeleteGroup?: (group: ExpenseGroup) => void;
}

const GroupRow = ({ group, onEditExpense, onEditGroup, onDeleteGroup }: GroupRowProps) => {
  const [open, setOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleToggle = async () => {
    if (!open && !loaded) {
      setLoading(true);
      try {
        const url = getApiUrl("finance");
        const res = await fetch(`${url}?section=expenses_by_group&group_id=${group.id}`);
        const data = await res.json();
        if (data.expenses) setExpenses(data.expenses);
        setLoaded(true);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    setOpen((v) => !v);
  };

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={handleToggle}
      >
        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
          <Icon name="FolderOpen" size={16} className="text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{group.name}</span>
            {!group.is_active && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Неактивна</span>
            )}
          </div>
          {group.description && (
            <div className="text-xs text-muted-foreground mt-0.5">{group.description}</div>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-red-600">{fmt(Number(group.total_spent))}</div>
            <div className="text-xs text-muted-foreground">{group.expense_count} расходов</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); onEditGroup?.(group); }}
          >
            <Icon name="Pencil" size={13} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
            onClick={(e) => { e.stopPropagation(); onDeleteGroup?.(group); }}
          >
            <Icon name="Trash2" size={13} />
          </Button>
          {loading
            ? <Icon name="Loader2" size={16} className="animate-spin text-muted-foreground" />
            : <Icon name={open ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground" />
          }
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-muted/10">
          {expenses.length === 0 && loaded ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              В этой группе пока нет расходов
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">Дата</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 hidden sm:table-cell">Контрагент</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 hidden md:table-cell">Комментарий</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2">Сумма</th>
                  <th className="w-8 px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => onEditExpense?.(e)}
                  >
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap text-muted-foreground">
                      {new Date(e.operation_date || e.created_at).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-4 py-2.5 text-xs hidden sm:table-cell">
                      {e.client_name
                        ? <span className="font-medium text-foreground">{e.client_name}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell truncate max-w-[180px]">
                      {e.comment || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-right text-red-600 whitespace-nowrap">
                      -{fmt(Number(e.amount))}
                    </td>
                    <td className="px-2 py-2.5">
                      <Icon name="Pencil" size={12} className="text-muted-foreground" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

const FinanceExpenses = ({
  expenses,
  expenseGroups,
  expenseSubTab,
  totalExpenses,
  onSetSubTab,
  onOpenCreateExpense,
  onOpenCreateGroup,
  onEditExpense,
  onEditGroup,
  onDeleteGroup,
}: Props) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={expenseSubTab === "list" ? "default" : "outline"}
            size="sm"
            className={expenseSubTab === "list" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
            onClick={() => onSetSubTab("list")}
          >
            Расходные ордера
          </Button>
          <Button
            variant={expenseSubTab === "groups" ? "default" : "outline"}
            size="sm"
            className={expenseSubTab === "groups" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
            onClick={() => onSetSubTab("groups")}
          >
            Группы расходов
          </Button>
        </div>
        <div className="flex gap-2">
          {expenseSubTab === "list" ? (
            <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={onOpenCreateExpense}>
              <Icon name="Minus" size={16} className="mr-1.5" />
              Новый расход
            </Button>
          ) : (
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={onOpenCreateGroup}>
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
              <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={onOpenCreateExpense}>
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
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Контрагент</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Группа</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Касса</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden lg:table-cell">Комментарий</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Сумма</th>
                      <th className="w-10 px-2 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-5 py-3.5 text-sm whitespace-nowrap">
                          {new Date(e.operation_date || e.created_at).toLocaleDateString("ru-RU")}
                        </td>
                        <td className="px-5 py-3.5 text-sm">
                          {e.client_name
                            ? <span className="font-medium">{e.client_name}</span>
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          {e.group_name ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {e.group_name}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm hidden md:table-cell">{e.cashbox_name}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground hidden lg:table-cell truncate max-w-[200px]">
                          {e.comment || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-right text-red-600 whitespace-nowrap">
                          -{fmt(Number(e.amount))}
                        </td>
                        <td className="px-2 py-3.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => onEditExpense?.(e)}
                          >
                            <Icon name="Pencil" size={13} />
                          </Button>
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
        <div className="space-y-2">
          {expenseGroups.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-12 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="FolderOpen" size={28} className="text-blue-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Групп расходов пока нет</h3>
              <p className="text-sm text-muted-foreground mb-4">Создайте группы для классификации расходов</p>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={onOpenCreateGroup}>
                <Icon name="Plus" size={16} className="mr-1.5" />
                Создать группу
              </Button>
            </div>
          ) : (
            expenseGroups.map((g) => (
              <GroupRow
                key={g.id}
                group={g}
                onEditExpense={onEditExpense}
                onEditGroup={onEditGroup}
                onDeleteGroup={onDeleteGroup}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FinanceExpenses;