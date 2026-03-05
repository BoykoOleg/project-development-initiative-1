import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

interface Cashbox {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  balance: number;
  total_received: number;
}

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

interface Props {
  cashboxes: Cashbox[];
  onOpenCreate: () => void;
  onOpenEdit: (cb: Cashbox) => void;
  onToggle: (cb: Cashbox) => void;
  onDelete: (cb: Cashbox) => void;
}

const FinanceCashboxes = ({ cashboxes, onOpenCreate, onOpenEdit, onToggle, onDelete }: Props) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={onOpenCreate}>
          <Icon name="Plus" size={16} className="mr-1.5" />
          Добавить кассу
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cashboxes.map((cb) => (
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
              <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenEdit(cb)}>
                <Icon name="Pencil" size={14} className="mr-1" />
                Изменить
              </Button>
              <Button variant="outline" size="sm" onClick={() => onToggle(cb)}>
                <Icon name={cb.is_active ? "EyeOff" : "Eye"} size={14} />
              </Button>
              <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={() => onDelete(cb)}>
                <Icon name="Trash2" size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinanceCashboxes;
