import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/api";

interface Income {
  id: number;
  income_group_id: number | null;
  cashbox_id: number;
  amount: number;
  income_type: string;
  comment: string;
  created_at: string;
  cashbox_name: string;
  cashbox_type: string;
  client_id?: number | null;
  client_name?: string | null;
  operation_date?: string | null;
  work_order_id?: number | null;
  bank_description?: string | null;
  bank_counterparty?: string | null;
}

interface IncomeGroup {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  total_received: number;
  income_count: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

interface Props {
  incomes: Income[];
  incomeGroups: IncomeGroup[];
  incomeSubTab: "list" | "groups";
  onSetSubTab: (tab: "list" | "groups") => void;
  onOpenCreateIncome: () => void;
  onOpenCreateGroup: () => void;
  onEditIncome?: (income: Income) => void;
  onEditGroup?: (group: IncomeGroup) => void;
  onDeleteGroup?: (group: IncomeGroup) => void;
  onAutoAssign?: () => void;
}

interface GroupRowProps {
  group: IncomeGroup;
  monthOffset: number;
  onEditIncome?: (income: Income) => void;
  onEditGroup?: (group: IncomeGroup) => void;
  onDeleteGroup?: (group: IncomeGroup) => void;
}

const GroupRow = ({ group, monthOffset, onEditIncome, onEditGroup, onDeleteGroup }: GroupRowProps) => {
  const [open, setOpen] = useState(false);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleToggle = async () => {
    if (!open && !loaded) {
      setLoading(true);
      try {
        const url = getApiUrl("finance");
        const res = await fetch(`${url}?section=incomes_by_group&group_id=${group.id}&month_offset=${monthOffset}`);
        const data = await res.json();
        if (data.incomes) setIncomes(data.incomes);
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
        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
          <Icon name="FolderOpen" size={16} className="text-green-500" />
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
            <div className="text-sm font-bold text-green-600">{fmt(Number(group.total_received))}</div>
            <div className="text-xs text-muted-foreground">{group.income_count} приходов</div>
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
          {incomes.length === 0 && loaded ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              В этой группе пока нет приходов за выбранный месяц
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
                {incomes.map((i) => (
                  <tr
                    key={i.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => onEditIncome?.(i)}
                  >
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap text-muted-foreground">
                      {new Date(i.operation_date || i.created_at).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-4 py-2.5 text-xs hidden sm:table-cell">
                      {i.bank_counterparty
                        ? <span className="font-medium text-foreground truncate max-w-[180px] block">{i.bank_counterparty}</span>
                        : i.client_name
                          ? <span className="font-medium text-foreground">{i.client_name}</span>
                          : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell truncate max-w-[200px]">
                      {i.bank_description || i.comment || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-right text-green-600 whitespace-nowrap">
                      +{fmt(Number(i.amount))}
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

function getMonthKey(offset: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(offset: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
}

const FinanceIncomes = ({
  incomes,
  incomeGroups,
  incomeSubTab,
  onSetSubTab,
  onOpenCreateIncome,
  onOpenCreateGroup,
  onEditIncome,
  onEditGroup,
  onDeleteGroup,
  onAutoAssign,
}: Props) => {
  const [monthOffset, setMonthOffset] = useState(0);

  const monthKey = getMonthKey(monthOffset);
  const filteredIncomes = incomes.filter((i) => {
    const dateStr = i.operation_date || i.created_at;
    return dateStr?.slice(0, 7) === monthKey;
  });
  const totalIncomes = filteredIncomes.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <Button
            variant={incomeSubTab === "list" ? "default" : "outline"}
            size="sm"
            className={incomeSubTab === "list" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
            onClick={() => onSetSubTab("list")}
          >
            Приходные ордера
          </Button>
          <Button
            variant={incomeSubTab === "groups" ? "default" : "outline"}
            size="sm"
            className={incomeSubTab === "groups" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
            onClick={() => onSetSubTab("groups")}
          >
            Группы приходов
          </Button>
        </div>
        <div className="flex gap-2">
          {incomeSubTab === "groups" && (
            <Button variant="outline" size="sm" onClick={onAutoAssign}>
              <Icon name="Wand2" size={14} className="mr-1.5" />
              Авто-привязка
            </Button>
          )}
          {incomeSubTab === "list" ? (
            <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={onOpenCreateIncome}>
              <Icon name="Plus" size={16} className="mr-1.5" />
              Новый приход
            </Button>
          ) : (
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={onOpenCreateGroup}>
              <Icon name="Plus" size={16} className="mr-1.5" />
              Новая группа
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setMonthOffset((v) => v - 1)}
        >
          <Icon name="ChevronLeft" size={16} />
        </Button>
        <span className="text-sm font-medium min-w-[140px] text-center capitalize">
          {getMonthLabel(monthOffset)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={monthOffset >= 0}
          onClick={() => setMonthOffset((v) => v + 1)}
        >
          <Icon name="ChevronRight" size={16} />
        </Button>
      </div>

      {incomeSubTab === "list" ? (
        <div className="bg-white rounded-xl border border-border shadow-sm">
          {filteredIncomes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="TrendingUp" size={28} className="text-green-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Приходов пока нет</h3>
              <p className="text-sm text-muted-foreground mb-4">Создайте приходный ордер</p>
              <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={onOpenCreateIncome}>
                <Icon name="Plus" size={16} className="mr-1.5" />
                Создать приход
              </Button>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-border bg-green-50/50 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Всего приходов: <strong>{filteredIncomes.length}</strong></span>
                <span className="text-sm font-bold text-green-600">{fmt(totalIncomes)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Дата</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Контрагент</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Группа</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Касса</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden lg:table-cell">Описание</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Сумма</th>
                      <th className="w-10 px-2 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncomes.map((i) => {
                      const group = incomeGroups.find((g) => g.id === i.income_group_id);
                      return (
                        <tr key={i.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="px-5 py-3.5 text-sm whitespace-nowrap">
                            {new Date(i.operation_date || i.created_at).toLocaleDateString("ru-RU")}
                          </td>
                          <td className="px-5 py-3.5 text-sm">
                            {i.bank_counterparty
                              ? <span className="font-medium truncate max-w-[160px] block">{i.bank_counterparty}</span>
                              : i.client_name
                                ? <span className="font-medium">{i.client_name}</span>
                                : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-5 py-3.5 hidden md:table-cell">
                            {group ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                {group.name}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-sm hidden md:table-cell">{i.cashbox_name}</td>
                          <td className="px-5 py-3.5 text-sm text-muted-foreground hidden lg:table-cell truncate max-w-[200px]">
                            {i.bank_description || i.comment || "—"}
                          </td>
                          <td className="px-5 py-3.5 text-sm font-semibold text-right text-green-600 whitespace-nowrap">
                            +{fmt(Number(i.amount))}
                          </td>
                          <td className="px-2 py-3.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => onEditIncome?.(i)}
                            >
                              <Icon name="Pencil" size={13} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {incomeGroups.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-12 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="FolderOpen" size={28} className="text-green-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Групп приходов пока нет</h3>
              <p className="text-sm text-muted-foreground mb-4">Создайте группы для классификации приходов</p>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={onOpenCreateGroup}>
                <Icon name="Plus" size={16} className="mr-1.5" />
                Создать группу
              </Button>
            </div>
          ) : (
            incomeGroups.map((g) => (
              <GroupRow
                key={g.id}
                group={g}
                monthOffset={monthOffset}
                onEditIncome={onEditIncome}
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

export default FinanceIncomes;
