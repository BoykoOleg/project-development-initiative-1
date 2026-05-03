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
import { useResizableColumns } from "@/hooks/useResizableColumns";

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

const ResizeHandle = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) => (
  <div
    className="absolute right-0 top-0 h-full w-2 cursor-col-resize flex items-center justify-center group/handle select-none"
    onMouseDown={onMouseDown}
  >
    <div className="w-px h-4 bg-border group-hover/handle:bg-blue-400 transition-colors" />
  </div>
);

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
  const { widths, onMouseDown } = useResizableColumns([60, 90, 160, 130, 140, 180, 110, 180]);

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
        <table className="table-fixed w-full">
          <colgroup>
            {widths.map((w, i) => <col key={i} style={{ width: w }} />)}
          </colgroup>
          <thead>
            <tr className="border-b border-border">
              {["№", "Дата", "Клиент", "Телефон", "Авто", "Комментарий", "Статус", "Действия"].map((label, i) => (
                <th
                  key={i}
                  className={`text-left text-xs font-medium text-muted-foreground px-4 py-2 relative overflow-hidden${i === 3 ? " hidden md:table-cell" : ""}${i === 4 || i === 5 ? " hidden lg:table-cell" : ""}${i === 7 ? " text-right" : ""}`}
                >
                  <span className="block truncate">{label}</span>
                  {i < 7 && <ResizeHandle onMouseDown={onMouseDown(i)} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr
                key={order.id}
                className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onOpenEditDialog(order)}
              >
                <td className="px-4 py-2 overflow-hidden">
                  <span className="text-sm font-medium text-blue-600 block truncate">{order.number}</span>
                </td>
                <td className="px-4 py-2 text-sm text-muted-foreground overflow-hidden truncate">{order.date}</td>
                <td className="px-4 py-2 overflow-hidden">
                  <div className="text-sm font-medium text-foreground truncate">{order.client}</div>
                  <div className="text-xs text-muted-foreground md:hidden truncate">{order.phone}</div>
                </td>
                <td className="px-4 py-2 text-sm text-foreground hidden md:table-cell overflow-hidden truncate">{order.phone}</td>
                <td className="px-4 py-2 text-sm text-foreground hidden lg:table-cell overflow-hidden truncate">{order.car}</td>
                <td className="px-4 py-2 text-sm text-muted-foreground hidden lg:table-cell overflow-hidden truncate">{order.comment || order.service || "—"}</td>
                <td className="px-4 py-2 overflow-hidden">
                  <div className="flex flex-col gap-1 items-start">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.className}`}>
                      {statusConfig[order.status]?.label}
                    </span>
                    {order.source === "max_bot" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-100 text-violet-700">
                        <Icon name="Bot" size={10} />
                        Макс
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
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