import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { Order, statusConfig, ASSIGNEES } from "./types";

const ASSIGNEE_COLS = [
  { key: "Артем",   color: "border-t-orange-400", dot: "bg-orange-400" },
  { key: "Олег",    color: "border-t-teal-400",   dot: "bg-teal-400"   },
  { key: "Алексей", color: "border-t-violet-400", dot: "bg-violet-400" },
];

const STATUS_COLS = [
  { key: "new",       color: "border-t-purple-400", dot: "bg-purple-400" },
  { key: "contacted", color: "border-t-blue-400",   dot: "bg-blue-400"   },
  { key: "approved",  color: "border-t-green-400",  dot: "bg-green-400"  },
  { key: "rejected",  color: "border-t-red-400",    dot: "bg-red-400"    },
];

interface Props {
  orders: Order[];
  onStatusChange: (orderId: number, newStatus: Order["status"]) => void;
  onAssigneeChange: (orderId: number, assignee: string | null) => void;
  onEdit: (order: Order) => void;
  onCreateWorkOrder: (order: Order) => void;
  onDelete: (orderId: number) => void;
}

export default function OrdersKanban({
  orders,
  onStatusChange,
  onAssigneeChange,
  onEdit,
  onCreateWorkOrder,
  onDelete,
}: Props) {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const dragOrder = useRef<Order | null>(null);

  const byAssignee = (name: string) => orders.filter((o) => o.assignee === name);
  const byStatus = (status: Order["status"]) =>
    orders.filter((o) => !ASSIGNEES.includes(o.assignee as typeof ASSIGNEES[number]) && o.status === status);

  const handleDragStart = (e: React.DragEvent, order: Order) => {
    dragOrder.current = order;
    setDraggingId(order.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setTimeout(() => { setDraggingId(null); setOverCol(null); }, 0);
    dragOrder.current = null;
  };

  const handleDrop = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    const order = dragOrder.current;
    if (!order) { setDraggingId(null); setOverCol(null); return; }

    const isAssignee = ASSIGNEES.includes(colKey as typeof ASSIGNEES[number]);

    if (isAssignee) {
      if (order.assignee !== colKey) onAssigneeChange(order.id, colKey);
    } else {
      if (order.assignee) onAssigneeChange(order.id, null);
      if (order.status !== colKey) onStatusChange(order.id, colKey as Order["status"]);
    }

    setDraggingId(null);
    setOverCol(null);
    dragOrder.current = null;
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverCol(colKey);
  };

  const renderCard = (order: Order) => {
    const isDragging = draggingId === order.id;
    return (
      <div
        key={order.id}
        draggable
        onDragStart={(e) => handleDragStart(e, order)}
        onDragEnd={handleDragEnd}
        onClick={() => onEdit(order)}
        className={`bg-white border border-border rounded-xl p-3 shadow-sm cursor-grab active:cursor-grabbing select-none transition-all duration-150 hover:shadow-md hover:border-blue-300 ${
          isDragging ? "opacity-40 scale-95 rotate-1" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-blue-600">{order.number}</span>
          <span className="text-[10px] text-muted-foreground">
            {order.date
              ? (() => { const [d, m] = order.date.split("."); return d && m ? `${d}.${m}` : order.date; })()
              : ""}
          </span>
        </div>

        {order.assignee && ASSIGNEES.includes(order.assignee as typeof ASSIGNEES[number]) && (
          <div className="mb-1.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusConfig[order.status]?.className ?? ""}`}>
              {statusConfig[order.status]?.label}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5 mb-1.5">
          <Icon name="User" size={11} className="text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">{order.client}</span>
        </div>

        <div className="flex items-center gap-1.5 mb-1.5">
          <Icon name="Phone" size={11} className="text-muted-foreground shrink-0" />
          <span className="text-[11px] text-muted-foreground">{order.phone}</span>
        </div>

        {order.car && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <Icon name="Car" size={11} className="text-muted-foreground shrink-0" />
            <span className="text-[11px] text-muted-foreground truncate">{order.car}</span>
          </div>
        )}

        {order.service && (
          <div className="mt-2 pt-2 border-t border-border">
            <span className="text-[11px] text-foreground line-clamp-2 leading-tight">{order.service}</span>
          </div>
        )}

        {order.status === "approved" && (
          <div className="mt-2 pt-2 border-t border-border">
            <button
              onClick={(e) => { e.stopPropagation(); onCreateWorkOrder(order); }}
              className="w-full flex items-center justify-center gap-1.5 text-[11px] font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg py-1 transition-colors"
            >
              <Icon name="ClipboardList" size={12} />
              Создать наряд
            </button>
          </div>
        )}

        {order.status === "rejected" && !order.assignee && (
          <div className="mt-2 pt-2 border-t border-border">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(order.id); }}
              className="w-full flex items-center justify-center gap-1.5 text-[11px] font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg py-1 transition-colors"
            >
              <Icon name="Trash2" size={12} />
              Удалить
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderCol = (colKey: string, items: Order[], label: string, colorClass: string, dotClass: string) => (
    <div
      key={colKey}
      className="flex flex-col min-w-[205px] w-[205px] flex-shrink-0"
      onDragOver={(e) => handleDragOver(e, colKey)}
      onDragLeave={() => setOverCol(null)}
      onDrop={(e) => handleDrop(e, colKey)}
    >
      <div className={`bg-white rounded-xl border border-border border-t-4 ${colorClass} px-3 py-2.5 mb-3 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dotClass}`} />
            <span className="text-sm font-semibold text-foreground">{label}</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
            {items.length}
          </span>
        </div>
      </div>

      <div className={`flex flex-col gap-2.5 flex-1 rounded-xl p-1.5 transition-colors duration-150 ${
        overCol === colKey ? "bg-blue-50 ring-2 ring-blue-300 ring-dashed" : "bg-transparent"
      }`}>
        {items.map(renderCard)}

        {items.length === 0 && overCol !== colKey && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
            <Icon name="LayoutGrid" size={24} />
            <span className="text-xs mt-2">Нет заявок</span>
          </div>
        )}

        {overCol === colKey && (
          <div className="rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/60 h-16 flex items-center justify-center">
            <span className="text-xs text-blue-400">Перетащите сюда</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
      {ASSIGNEE_COLS.map((col) =>
        renderCol(col.key, byAssignee(col.key), col.key, col.color, col.dot)
      )}

      <div className="w-px bg-border/60 flex-shrink-0 self-stretch mx-1" />

      {STATUS_COLS.map((col) =>
        renderCol(col.key, byStatus(col.key as Order["status"]), statusConfig[col.key].label, col.color, col.dot)
      )}
    </div>
  );
}
