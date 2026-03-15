import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { Order, statusConfig } from "./types";

const COLUMNS: Array<{ key: Order["status"]; color: string; dot: string }> = [
  { key: "new",       color: "border-t-purple-400", dot: "bg-purple-400" },
  { key: "contacted", color: "border-t-blue-400",   dot: "bg-blue-400"   },
  { key: "approved",  color: "border-t-green-400",  dot: "bg-green-400"  },
  { key: "rejected",  color: "border-t-red-400",    dot: "bg-red-400"    },
];

interface Props {
  orders: Order[];
  onStatusChange: (orderId: number, newStatus: Order["status"]) => void;
  onEdit: (order: Order) => void;
}

export default function OrdersKanban({ orders, onStatusChange, onEdit }: Props) {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<Order["status"] | null>(null);
  const dragOrder = useRef<Order | null>(null);

  const byStatus = (status: Order["status"]) =>
    orders.filter((o) => o.status === status);

  const handleDragStart = (e: React.DragEvent, order: Order) => {
    dragOrder.current = order;
    setDraggingId(order.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setTimeout(() => {
      setDraggingId(null);
      setOverCol(null);
    }, 0);
    dragOrder.current = null;
  };

  const handleDrop = (e: React.DragEvent, status: Order["status"]) => {
    e.preventDefault();
    if (dragOrder.current && dragOrder.current.status !== status) {
      onStatusChange(dragOrder.current.id, status);
    }
    setDraggingId(null);
    setOverCol(null);
    dragOrder.current = null;
  };

  const handleDragOver = (e: React.DragEvent, status: Order["status"]) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverCol(status);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
      {COLUMNS.map((col) => {
        const items = byStatus(col.key);
        const cfg = statusConfig[col.key];
        const isOver = overCol === col.key;

        return (
          <div
            key={col.key}
            className="flex flex-col min-w-[220px] w-[220px] flex-shrink-0"
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={() => setOverCol(null)}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            {/* Column header */}
            <div className={`bg-white rounded-xl border border-border border-t-4 ${col.color} px-3 py-2.5 mb-3 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="text-sm font-semibold text-foreground">{cfg.label}</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {items.length}
                </span>
              </div>
            </div>

            {/* Drop zone */}
            <div
              className={`flex flex-col gap-2.5 flex-1 rounded-xl p-1.5 transition-colors duration-150 ${
                isOver ? "bg-blue-50 ring-2 ring-blue-300 ring-dashed" : "bg-transparent"
              }`}
            >
              {items.map((order) => {
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
                    {/* Number + date */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-600">{order.number}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(order.date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                      </span>
                    </div>

                    {/* Client */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon name="User" size={11} className="text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium text-foreground truncate">{order.client}</span>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon name="Phone" size={11} className="text-muted-foreground shrink-0" />
                      <span className="text-[11px] text-muted-foreground">{order.phone}</span>
                    </div>

                    {/* Car */}
                    {order.car && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Icon name="Car" size={11} className="text-muted-foreground shrink-0" />
                        <span className="text-[11px] text-muted-foreground truncate">{order.car}</span>
                      </div>
                    )}

                    {/* Service */}
                    {order.service && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <span className="text-[11px] text-foreground line-clamp-2 leading-tight">{order.service}</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty state */}
              {items.length === 0 && !isOver && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
                  <Icon name="LayoutGrid" size={24} />
                  <span className="text-xs mt-2">Нет заявок</span>
                </div>
              )}

              {/* Drop indicator */}
              {isOver && (
                <div className="rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/60 h-20 flex items-center justify-center">
                  <span className="text-xs text-blue-400">Перетащите сюда</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}