import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Order, statusConfig } from "./types";

interface OrdersTableProps {
  orders: Order[];
  filtered: Order[];
  loading: boolean;
  search: string;
  onOpenCreateDialog: () => void;
  onOpenEditDialog: (order: Order) => void;
  onUpdateStatus: (orderId: number, status: Order["status"]) => void;
  onCreateWorkOrder: (order: Order) => void;
  onDeleteOrder: (orderId: number) => void;
}

const OrdersTable = ({
  orders,
  filtered,
  loading,
  search,
  onOpenCreateDialog,
  onOpenEditDialog,
  onUpdateStatus,
  onCreateWorkOrder,
  onDeleteOrder,
}: OrdersTableProps) => {
  if (loading) {
    return <div className="text-center py-12 text-sm text-muted-foreground">Загрузка...</div>;
  }

  if (orders.length === 0 && !search) {
    return (
      <div className="bg-white rounded-xl border border-border shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="ClipboardList" size={28} className="text-blue-500" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">Заявок пока нет</h3>
        <p className="text-sm text-muted-foreground mb-4">Создайте первую заявку</p>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={onOpenCreateDialog}>
          <Icon name="Plus" size={16} className="mr-1.5" />
          Новая заявка
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">№</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Дата</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Клиент</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Телефон</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden lg:table-cell">Авто</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden lg:table-cell">Комментарий</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Статус</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr
                key={order.id}
                className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onOpenEditDialog(order)}
              >
                <td className="px-5 py-3.5">
                  <span className="text-sm font-medium text-blue-600">{order.number}</span>
                </td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">{order.date}</td>
                <td className="px-5 py-3.5">
                  <div className="text-sm font-medium text-foreground">{order.client}</div>
                  <div className="text-xs text-muted-foreground md:hidden">{order.phone}</div>
                </td>
                <td className="px-5 py-3.5 text-sm text-foreground hidden md:table-cell">{order.phone}</td>
                <td className="px-5 py-3.5 text-sm text-foreground hidden lg:table-cell">{order.car}</td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground hidden lg:table-cell max-w-[200px] truncate">{order.comment || order.service || "—"}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.className}`}>
                    {statusConfig[order.status]?.label}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    {order.status === "approved" && (
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white h-8 text-xs"
                        onClick={() => onCreateWorkOrder(order)}
                      >
                        <Icon name="FileText" size={14} className="mr-1" />
                        <span className="hidden sm:inline">Наряд</span>
                      </Button>
                    )}
                    {order.status === "rejected" && (
                      <Button
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white h-8 text-xs"
                        onClick={() => onDeleteOrder(order.id)}
                      >
                        <Icon name="Trash2" size={14} className="mr-1" />
                        <span className="hidden sm:inline">Удалить</span>
                      </Button>
                    )}
                    <Select
                      value={order.status}
                      onValueChange={(v) => onUpdateStatus(order.id, v as Order["status"])}
                    >
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Новая</SelectItem>
                        <SelectItem value="contacted">Связались</SelectItem>
                        <SelectItem value="approved">Одобрена</SelectItem>
                        <SelectItem value="rejected">Отклонена</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  Заявки не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersTable;