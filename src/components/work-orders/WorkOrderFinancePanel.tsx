import { useState, useEffect } from "react";
import { getApiUrl } from "@/lib/api";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (s: string) =>
  new Date(s).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

interface FinanceRow {
  id: number;
  amount: string | number;
  comment: string;
  created_at: string;
  cashbox_name: string;
}

interface PaymentRow extends FinanceRow {
  payment_method: string;
}

interface ExpenseRow extends FinanceRow {
  group_name?: string;
}

interface IncomeRow extends FinanceRow {
  income_type: string;
}

interface WorkItem {
  name: string;
  qty: number;
  price: number;
  norm_hours: number;
  discount: number;
}

interface PartItem {
  name: string;
  qty: number;
  sell_price: number;
  purchase_price: number;
}

interface WOFinanceData {
  work_order: {
    id: number;
    number: string;
    client_name: string;
    car_info: string;
    status: string;
  };
  works_total: number;
  parts_total: number;
  parts_purchase_total: number;
  parts_margin: number;
  order_total: number;
  paid: number;
  debt: number;
  total_income: number;
  total_expense: number;
  profit: number;
  works: WorkItem[];
  parts: PartItem[];
  payments: PaymentRow[];
  expenses: ExpenseRow[];
  incomes: IncomeRow[];
}

interface Cashbox {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  balance: number;
}

interface ExpenseGroup {
  id: number;
  name: string;
  is_active: boolean;
}

const paymentMethodLabel: Record<string, string> = {
  cash: "Наличные",
  card: "Карта",
  transfer: "Перевод",
  online: "Онлайн",
};

const incomeTypeLabel: Record<string, string> = {
  other: "Прочее",
  deposit: "Взнос",
  refund: "Возврат",
  investment: "Инвестиции",
  loan: "Займ",
};

interface Props {
  workOrderId: number;
  open: boolean;
  onClose: () => void;
}

const WorkOrderFinancePanel = ({ workOrderId, open, onClose }: Props) => {
  const [data, setData] = useState<WOFinanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);
  const [expenseGroups, setExpenseGroups] = useState<ExpenseGroup[]>([]);

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    amount: 0,
    cashbox_id: 0,
    expense_group_id: "",
    comment: "",
  });

  const [incomeOpen, setIncomeOpen] = useState(false);
  const [incomeForm, setIncomeForm] = useState({
    amount: 0,
    cashbox_id: 0,
    income_type: "other",
    comment: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(
        `${url}?section=work_order_finance&work_order_id=${workOrderId}`,
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
        return;
      }
      setData(json);
    } catch {
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const fetchCashboxes = async () => {
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(`${url}?section=cashboxes`);
      const json = await res.json();
      if (json.cashboxes)
        setCashboxes(json.cashboxes.filter((c: Cashbox) => c.is_active));
    } catch (err) {
      console.error("fetchCashboxes", err);
    }
  };

  const fetchExpenseGroups = async () => {
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(`${url}?section=expense_groups`);
      const json = await res.json();
      if (json.expense_groups) setExpenseGroups(json.expense_groups);
    } catch (err) {
      console.error("fetchExpenseGroups", err);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
      fetchCashboxes();
      fetchExpenseGroups();
    }
  }, [open, workOrderId]); // eslint-disable-line react-hooks/exhaustive-deps

  const openExpenseDialog = () => {
    setExpenseForm({
      amount: 0,
      cashbox_id: cashboxes[0]?.id || 0,
      expense_group_id: "",
      comment: "",
    });
    setExpenseOpen(true);
  };

  const openIncomeDialog = () => {
    setIncomeForm({
      amount: 0,
      cashbox_id: cashboxes[0]?.id || 0,
      income_type: "other",
      comment: "",
    });
    setIncomeOpen(true);
  };

  const handleCreateExpense = async () => {
    if (!expenseForm.amount || !expenseForm.cashbox_id) {
      toast.error("Укажите сумму и кассу");
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
        work_order_id: workOrderId,
      };
      if (expenseForm.expense_group_id && expenseForm.expense_group_id !== "none") {
        body.expense_group_id = Number(expenseForm.expense_group_id);
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.error) { toast.error(json.error); return; }
      toast.success("Расход добавлен к заказ-наряду");
      setExpenseOpen(false);
      fetchData();
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleCreateIncome = async () => {
    if (!incomeForm.amount || !incomeForm.cashbox_id) {
      toast.error("Укажите сумму и кассу");
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
        work_order_id: workOrderId,
      };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.error) { toast.error(json.error); return; }
      toast.success("Приход добавлен к заказ-наряду");
      setIncomeOpen(false);
      fetchData();
    } catch {
      toast.error("Ошибка");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="BarChart2" size={18} />
              Структура заказ-наряда
              {data && (
                <span className="text-muted-foreground font-normal text-sm ml-1">
                  {data.work_order.number} · {data.work_order.client_name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Загрузка...
            </div>
          ) : data ? (
            <div className="space-y-5 pt-1">
              {/* Сводные показатели */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border bg-card p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Стоимость</div>
                  <div className="font-semibold text-sm">{fmt(data.order_total)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    раб. {fmt(data.works_total)} + зч. {fmt(data.parts_total)}
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Оплачено</div>
                  <div className="font-semibold text-sm text-green-600">{fmt(data.paid)}</div>
                  {data.debt > 0 && (
                    <div className="text-xs text-red-500 mt-0.5">долг {fmt(data.debt)}</div>
                  )}
                </div>
                <div className="rounded-lg border bg-card p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Расходы</div>
                  <div className="font-semibold text-sm text-red-500">{fmt(data.total_expense)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">по ордерам</div>
                </div>
                <div className={`rounded-lg border p-3 text-center ${data.profit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <div className="text-xs text-muted-foreground mb-1">Прибыль</div>
                  <div className={`font-semibold text-sm ${data.profit >= 0 ? "text-green-700" : "text-red-600"}`}>
                    {fmt(data.profit)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">доход − расход</div>
                </div>
              </div>

              {/* Платежи от клиента */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <Icon name="CreditCard" size={15} className="text-blue-500" />
                    Платежи от клиента
                    <Badge variant="secondary" className="text-xs">{data.payments.length}</Badge>
                  </h3>
                </div>
                {data.payments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Нет платежей</p>
                ) : (
                  <div className="rounded-md border divide-y text-sm">
                    {data.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">{fmtDate(p.created_at)}</span>
                          <span>{p.cashbox_name} · {paymentMethodLabel[p.payment_method] || p.payment_method}</span>
                          {p.comment && <span className="text-xs text-muted-foreground">{p.comment}</span>}
                        </div>
                        <span className="font-medium text-green-600 shrink-0 ml-3">+{fmt(Number(p.amount))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Доходы с работ и запчастей */}
              <section>
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                  <Icon name="Layers" size={15} className="text-blue-500" />
                  Состав заказ-наряда
                </h3>

                {/* Работы */}
                {data.works.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Работы</span>
                      <span className="text-xs font-semibold text-foreground">{fmt(data.works_total)}</span>
                    </div>
                    <div className="rounded-md border divide-y text-sm">
                      {data.works.map((w, idx) => (
                        <div key={idx} className="flex items-center justify-between px-3 py-2">
                          <div className="flex flex-col min-w-0 flex-1 mr-3">
                            <span className="text-sm">{w.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {w.qty > 1 && `× ${w.qty}`}
                              {w.norm_hours > 0 && ` · ${w.norm_hours} н/ч`}
                              {w.discount > 0 && <span className="text-red-400"> · скидка {fmt(w.discount)}</span>}
                            </span>
                          </div>
                          <span className="font-medium text-foreground shrink-0">{fmt(w.price * w.qty)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Запчасти */}
                {data.parts.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Запчасти и материалы</span>
                      <span className="text-xs font-semibold text-foreground">{fmt(data.parts_total)}</span>
                    </div>
                    <div className="rounded-md border divide-y text-sm">
                      {data.parts.map((p, idx) => {
                        const sellSum = p.sell_price * p.qty;
                        const buySum = (p.purchase_price || 0) * p.qty;
                        const margin = sellSum - buySum;
                        return (
                          <div key={idx} className="flex items-center justify-between px-3 py-2">
                            <div className="flex flex-col min-w-0 flex-1 mr-3">
                              <span className="text-sm">{p.name}</span>
                              <span className="text-xs text-muted-foreground">
                                × {p.qty}
                                {buySum > 0 && (
                                  <> · закуп {fmt(buySum)} <span className={margin >= 0 ? "text-green-600" : "text-red-500"}>/ наценка {fmt(margin)}</span></>
                                )}
                              </span>
                            </div>
                            <span className="font-medium text-foreground shrink-0">{fmt(sellSum)}</span>
                          </div>
                        );
                      })}
                    </div>
                    {data.parts_purchase_total > 0 && (
                      <div className="flex items-center justify-between mt-1.5 px-1 text-xs text-muted-foreground">
                        <span>Закупка итого</span>
                        <span>{fmt(data.parts_purchase_total)}</span>
                      </div>
                    )}
                    {data.parts_margin !== 0 && (
                      <div className="flex items-center justify-between px-1 text-xs">
                        <span className="text-muted-foreground">Наценка итого</span>
                        <span className={data.parts_margin >= 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                          {fmt(data.parts_margin)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {data.works.length === 0 && data.parts.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Работы и запчасти не добавлены</p>
                )}
              </section>

              {/* Расходы */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <Icon name="TrendingDown" size={15} className="text-red-500" />
                    Расходы
                    <Badge variant="secondary" className="text-xs">{data.expenses.length}</Badge>
                  </h3>
                  <Button size="sm" variant="outline" onClick={openExpenseDialog} className="h-7 text-xs">
                    <Icon name="Plus" size={13} className="mr-1" />
                    Добавить
                  </Button>
                </div>
                {data.expenses.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Нет расходов</p>
                ) : (
                  <div className="rounded-md border divide-y text-sm">
                    {data.expenses.map((e) => (
                      <div key={e.id} className="flex items-center justify-between px-3 py-2">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">{fmtDate(e.created_at)}</span>
                          <span>
                            {e.cashbox_name}
                            {e.group_name && <> · <span className="text-muted-foreground">{e.group_name}</span></>}
                          </span>
                          {e.comment && <span className="text-xs text-muted-foreground">{e.comment}</span>}
                        </div>
                        <span className="font-medium text-red-500 shrink-0 ml-3">−{fmt(Number(e.amount))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Итог строка */}
              <div className="rounded-lg bg-muted/50 px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Итого движение денег</span>
                <div className="flex gap-4">
                  <span className="text-green-600">+{fmt(data.total_income)}</span>
                  <span className="text-red-500">−{fmt(data.total_expense)}</span>
                  <span className={`font-semibold ${data.profit >= 0 ? "text-green-700" : "text-red-600"}`}>
                    = {fmt(data.profit)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Диалог расхода */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Расход по заказ-наряду</DialogTitle>
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
                <SelectTrigger><SelectValue placeholder="Выберите кассу" /></SelectTrigger>
                <SelectContent>
                  {cashboxes.map((cb) => (
                    <SelectItem key={cb.id} value={String(cb.id)}>
                      {cb.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Группа расходов</label>
              <Select
                value={expenseForm.expense_group_id || "none"}
                onValueChange={(v) => setExpenseForm((f) => ({ ...f, expense_group_id: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Без группы" /></SelectTrigger>
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
              <Button variant="outline" className="flex-1" onClick={() => setExpenseOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={handleCreateExpense}>
                <Icon name="Minus" size={15} className="mr-1.5" />
                Списать {expenseForm.amount ? fmt(expenseForm.amount) : ""}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог прихода */}
      <Dialog open={incomeOpen} onOpenChange={setIncomeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Дополнительный приход</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Сумма *</label>
              <Input
                type="number"
                value={incomeForm.amount || ""}
                onChange={(e) => setIncomeForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Касса *</label>
              <Select
                value={String(incomeForm.cashbox_id)}
                onValueChange={(v) => setIncomeForm((f) => ({ ...f, cashbox_id: Number(v) }))}
              >
                <SelectTrigger><SelectValue placeholder="Выберите кассу" /></SelectTrigger>
                <SelectContent>
                  {cashboxes.map((cb) => (
                    <SelectItem key={cb.id} value={String(cb.id)}>{cb.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Тип прихода</label>
              <Select
                value={incomeForm.income_type}
                onValueChange={(v) => setIncomeForm((f) => ({ ...f, income_type: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="other">Прочее</SelectItem>
                  <SelectItem value="deposit">Взнос</SelectItem>
                  <SelectItem value="refund">Возврат</SelectItem>
                  <SelectItem value="investment">Инвестиции</SelectItem>
                  <SelectItem value="loan">Займ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Комментарий</label>
              <Input
                value={incomeForm.comment}
                onChange={(e) => setIncomeForm((f) => ({ ...f, comment: e.target.value }))}
                placeholder="За что приход"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIncomeOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={handleCreateIncome}>
                <Icon name="Plus" size={15} className="mr-1.5" />
                Зачислить {incomeForm.amount ? fmt(incomeForm.amount) : ""}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkOrderFinancePanel;