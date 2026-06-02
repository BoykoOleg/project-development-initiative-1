import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { Order, OrderTask, statusConfig, ASSIGNEES } from "./types";

const STATUS_COLUMNS: Array<{ key: Order["status"]; color: string; dot: string }> = [
  { key: "new",       color: "border-t-purple-400", dot: "bg-purple-400" },
  { key: "contacted", color: "border-t-blue-400",   dot: "bg-blue-400"   },
  { key: "approved",  color: "border-t-green-400",  dot: "bg-green-400"  },
  { key: "rejected",  color: "border-t-red-400",    dot: "bg-red-400"    },
];

const ASSIGNEE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "Артем":   { bg: "bg-orange-50",  text: "text-orange-700", dot: "bg-orange-400" },
  "Олег":    { bg: "bg-teal-50",    text: "text-teal-700",   dot: "bg-teal-400"   },
  "Алексей": { bg: "bg-violet-50",  text: "text-violet-700", dot: "bg-violet-400" },
};

interface Props {
  orders: Order[];
  tasks: Record<number, OrderTask[]>;
  onStatusChange: (orderId: number, newStatus: Order["status"]) => void;
  onEdit: (order: Order) => void;
  onCreateWorkOrder: (order: Order) => void;
  onDelete: (orderId: number) => void;
}

export default function OrdersKanban({ orders, tasks, onStatusChange, onEdit, onCreateWorkOrder, onDelete }: Props) {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<Order["status"] | null>(null);
  const dragOrder = useRef<Order | null>(null);

  const byStatus = (status: Order["status"]) => orders.filter((o) => o.status === status);

  const handleDragStart = (e: React.DragEvent, order: Order) => {
    dragOrder.current = order;
    setDraggingId(order.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setTimeout(() => { setDraggingId(null); setOverCol(null); }, 0);
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
    <div className="space-y-6">
      {/* ── Статусные колонки (Канбан) ── */}
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-340px)]">
        {STATUS_COLUMNS.map((col) => {
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

              <div className={`flex flex-col gap-2.5 flex-1 rounded-xl p-1.5 transition-colors duration-150 ${
                isOver ? "bg-blue-50 ring-2 ring-blue-300 ring-dashed" : "bg-transparent"
              }`}>
                {items.map((order) => {
                  const isDragging = draggingId === order.id;
                  const orderTasks = tasks[order.id] || [];
                  const hasTasks = orderTasks.length > 0;

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
                          {order.date ? (() => { const [d, m] = order.date.split("."); return d && m ? `${d}.${m}` : order.date; })() : ""}
                        </span>
                      </div>

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

                      {/* Задачи исполнителей */}
                      {hasTasks && (
                        <div className="mt-2 pt-2 border-t border-border space-y-1">
                          {ASSIGNEES.map((assignee) => {
                            const assigneeTasks = orderTasks.filter((t) => t.assignee === assignee);
                            if (assigneeTasks.length === 0) return null;
                            const done = assigneeTasks.filter((t) => t.done).length;
                            const colors = ASSIGNEE_COLORS[assignee];
                            return (
                              <div key={assignee} className={`flex items-center justify-between px-1.5 py-0.5 rounded ${colors.bg}`}>
                                <span className={`text-[10px] font-medium ${colors.text}`}>{assignee}</span>
                                <span className={`text-[10px] ${colors.text} opacity-70`}>{done}/{assigneeTasks.length}</span>
                              </div>
                            );
                          })}
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

                      {order.status === "rejected" && (
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
                })}

                {items.length === 0 && !isOver && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
                    <Icon name="LayoutGrid" size={24} />
                    <span className="text-xs mt-2">Нет заявок</span>
                  </div>
                )}

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

      {/* ── Колонки исполнителей ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Users" size={15} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Задачи исполнителей</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {ASSIGNEES.map((assignee) => {
            const colors = ASSIGNEE_COLORS[assignee];
            const allAssigneeTasks = orders.flatMap((o) =>
              (tasks[o.id] || [])
                .filter((t) => t.assignee === assignee)
                .map((t) => ({ ...t, order }))
            );
            const activeTasks = orders.flatMap((o) =>
              (tasks[o.id] || [])
                .filter((t) => t.assignee === assignee && !t.done)
                .map((t) => ({ task: t, order: o }))
            );
            const doneTasks = orders.flatMap((o) =>
              (tasks[o.id] || [])
                .filter((t) => t.assignee === assignee && t.done)
                .map((t) => ({ task: t, order: o }))
            );
            const total = allAssigneeTasks.length;
            const doneCount = doneTasks.length;

            return (
              <div key={assignee} className="flex flex-col min-w-[240px] w-[240px] flex-shrink-0">
                <div className={`bg-white rounded-xl border border-border border-t-4 px-3 py-2.5 mb-3 shadow-sm`}
                  style={{ borderTopColor: assignee === "Артем" ? "#fb923c" : assignee === "Олег" ? "#2dd4bf" : "#a78bfa" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                      <span className="text-sm font-semibold text-foreground">{assignee}</span>
                    </div>
                    {total > 0 && (
                      <span className="text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                        {doneCount}/{total}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  {activeTasks.map(({ task, order }) => (
                    <div
                      key={task.id}
                      onClick={() => onEdit(order)}
                      className={`${colors.bg} border border-border rounded-xl p-2.5 cursor-pointer hover:shadow-sm transition-all`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${colors.dot}`} />
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium text-blue-600 mb-0.5">{order.number}</div>
                          <div className="text-xs text-foreground leading-snug">{task.text || "Без описания"}</div>
                          <div className="text-[10px] text-muted-foreground mt-1 truncate">{order.client}</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {doneTasks.length > 0 && (
                    <div className="space-y-1.5">
                      {doneTasks.map(({ task, order }) => (
                        <div
                          key={task.id}
                          onClick={() => onEdit(order)}
                          className="bg-muted/40 border border-border/50 rounded-xl p-2.5 cursor-pointer opacity-60 hover:opacity-80 transition-all"
                        >
                          <div className="flex items-start gap-2">
                            <Icon name="CheckCircle2" size={12} className="text-green-500 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[11px] font-medium text-muted-foreground mb-0.5">{order.number}</div>
                              <div className="text-xs text-muted-foreground line-through leading-snug">{task.text || "Без описания"}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {total === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
                      <Icon name="CheckSquare" size={22} />
                      <span className="text-xs mt-2">Нет задач</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
