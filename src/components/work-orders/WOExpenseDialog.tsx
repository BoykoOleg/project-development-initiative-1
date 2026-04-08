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
import { fmt, Cashbox, ExpenseGroup } from "./woFinanceTypes";

interface ExpenseForm {
  amount: number;
  cashbox_id: number;
  expense_group_id: string;
  comment: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ExpenseForm;
  onFormChange: (form: ExpenseForm) => void;
  cashboxes: Cashbox[];
  expenseGroups: ExpenseGroup[];
  onSubmit: () => void;
  submitting?: boolean;
}

const WOExpenseDialog = ({
  open,
  onOpenChange,
  form,
  onFormChange,
  cashboxes,
  expenseGroups,
  onSubmit,
  submitting,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Расход по заказ-наряду</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Сумма *</label>
            <Input
              type="number"
              value={form.amount || ""}
              onChange={(e) => onFormChange({ ...form, amount: Number(e.target.value) })}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Касса *</label>
            <Select
              value={String(form.cashbox_id)}
              onValueChange={(v) => onFormChange({ ...form, cashbox_id: Number(v) })}
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
              value={form.expense_group_id || "none"}
              onValueChange={(v) => onFormChange({ ...form, expense_group_id: v })}
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
              value={form.comment}
              onChange={(e) => onFormChange({ ...form, comment: e.target.value })}
              placeholder="За что расход"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={onSubmit} disabled={submitting}>
              <Icon name="Minus" size={15} className="mr-1.5" />
              {submitting ? "Списание..." : `Списать ${form.amount ? fmt(form.amount) : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WOExpenseDialog;