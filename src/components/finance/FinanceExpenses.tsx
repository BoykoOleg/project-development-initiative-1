import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

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
}

const FinanceExpenses = ({
  expenses,
  expenseGroups,
  expenseSubTab,
  totalExpenses,
  onSetSubTab,
  onOpenCreateExpense,
  onOpenCreateGroup,
  onEditExpense,
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
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Группа</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Касса</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden sm:table-cell">Комментарий</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => onEditExpense?.(e)}>
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
              <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={onOpenCreateGroup}>
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
  );
};

export default FinanceExpenses;