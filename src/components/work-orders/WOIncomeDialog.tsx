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
import { fmt, Cashbox } from "./woFinanceTypes";

interface IncomeForm {
  amount: number;
  cashbox_id: number;
  income_type: string;
  comment: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: IncomeForm;
  onFormChange: (form: IncomeForm) => void;
  cashboxes: Cashbox[];
  onSubmit: () => void;
}

const WOIncomeDialog = ({
  open,
  onOpenChange,
  form,
  onFormChange,
  cashboxes,
  onSubmit,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Дополнительный приход</DialogTitle>
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
                  <SelectItem key={cb.id} value={String(cb.id)}>{cb.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Тип прихода</label>
            <Select
              value={form.income_type}
              onValueChange={(v) => onFormChange({ ...form, income_type: v })}
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
              value={form.comment}
              onChange={(e) => onFormChange({ ...form, comment: e.target.value })}
              placeholder="За что приход"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={onSubmit}>
              <Icon name="Plus" size={15} className="mr-1.5" />
              Зачислить {form.amount ? fmt(form.amount) : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WOIncomeDialog;
