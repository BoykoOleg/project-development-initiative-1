import { useState, useEffect } from "react";
import { getApiUrl } from "@/lib/api";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WOFinanceData, Cashbox, ExpenseGroup } from "./woFinanceTypes";
import WOFinanceSummary from "./WOFinanceSummary";
import WOExpenseDialog from "./WOExpenseDialog";
import WOIncomeDialog from "./WOIncomeDialog";

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
            <WOFinanceSummary
              data={data}
              onAddExpense={openExpenseDialog}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <WOExpenseDialog
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        form={expenseForm}
        onFormChange={setExpenseForm}
        cashboxes={cashboxes}
        expenseGroups={expenseGroups}
        onSubmit={handleCreateExpense}
      />

      <WOIncomeDialog
        open={incomeOpen}
        onOpenChange={setIncomeOpen}
        form={incomeForm}
        onFormChange={setIncomeForm}
        cashboxes={cashboxes}
        onSubmit={handleCreateIncome}
      />
    </>
  );
};

export default WorkOrderFinancePanel;
