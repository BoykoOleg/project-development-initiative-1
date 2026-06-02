import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";
import { Order, OrderTask, OrderMessage, ASSIGNEES } from "./types";
import { getApiUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface EditForm {
  client: string;
  phone: string;
  car: string;
  service: string;
  comment: string;
}

interface OrderEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingOrder: Order | null;
  editForm: EditForm;
  setEditForm: React.Dispatch<React.SetStateAction<EditForm>>;
  onSubmit: () => void;
  onDelete?: (orderId: number) => void;
}

const ASSIGNEE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Артем":   { bg: "bg-orange-50",  text: "text-orange-700", border: "border-orange-200" },
  "Олег":    { bg: "bg-teal-50",    text: "text-teal-700",   border: "border-teal-200"   },
  "Алексей": { bg: "bg-violet-50",  text: "text-violet-700", border: "border-violet-200" },
};

const OrderEditDialog = ({
  open,
  onOpenChange,
  editingOrder,
  editForm,
  setEditForm,
  onSubmit,
  onDelete,
}: OrderEditDialogProps) => {
  const { user } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [tasks, setTasks] = useState<OrderTask[]>([]);
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  const [savingTask, setSavingTask] = useState<string | null>(null);

  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [msgText, setMsgText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !editingOrder) return;
    const id = editingOrder.id;
    setTasks([]);
    setMessages([]);
    setTaskDrafts({});
    setMsgText("");
    const url = getApiUrl("orders");
    if (!url) return;
    fetch(`${url}?action=tasks&order_id=${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.tasks) setTasks(d.tasks); })
      .catch(console.error);
    fetch(`${url}?action=messages&order_id=${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.messages) setMessages(d.messages); })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingOrder?.id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const saveTask = async (assignee: string, taskId?: number) => {
    if (!editingOrder) return;
    const url = getApiUrl("orders");
    if (!url) return;
    const text = taskDrafts[assignee] ?? "";
    setSavingTask(assignee);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert_task",
          order_id: editingOrder.id,
          assignee,
          text,
          task_id: taskId,
        }),
      });
      const data = await res.json();
      if (data.task) {
        setTasks((prev) => {
          const exists = prev.find((t) => t.id === data.task.id);
          return exists
            ? prev.map((t) => (t.id === data.task.id ? data.task : t))
            : [...prev, data.task];
        });
        setTaskDrafts((d) => { const n = { ...d }; delete n[assignee]; return n; });
      }
    } catch (e) {
      console.error(e);
    }
    setSavingTask(null);
  };

  const toggleTaskDone = async (task: OrderTask) => {
    const url = getApiUrl("orders");
    if (!url) return;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert_task",
          order_id: task.order_id,
          assignee: task.assignee,
          text: task.text,
          done: !task.done,
          task_id: task.id,
        }),
      });
      const data = await res.json();
      if (data.task) {
        setTasks((prev) => prev.map((t) => (t.id === data.task.id ? data.task : t)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !editingOrder) return;
    const url = getApiUrl("orders");
    if (!url) return;
    setSendingMsg(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_message",
          order_id: editingOrder.id,
          text: msgText.trim(),
          user_id: user?.id ?? null,
          user_name: user?.name ?? "Гость",
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setMsgText("");
      }
    } catch (e) {
      console.error(e);
    }
    setSendingMsg(false);
  };

  const handleDelete = () => {
    if (editingOrder && onDelete) {
      onDelete(editingOrder.id);
      setConfirmDelete(false);
      onOpenChange(false);
    }
  };

  const formatTime = (ts: string) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); setConfirmDelete(false); }}>
        <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle>Заявка {editingOrder?.number}</DialogTitle>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Icon name="Trash2" size={14} />
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            {/* Клиент и авто */}
            <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
              <div className="font-medium text-foreground">{editingOrder?.client}</div>
              <div className="text-muted-foreground">{editingOrder?.phone}</div>
              {editingOrder?.car && <div className="text-muted-foreground">{editingOrder.car}</div>}
              {editingOrder?.service && <div className="text-foreground/80 text-xs mt-1">{editingOrder.service}</div>}
            </div>

            {/* Комментарий */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Комментарий</label>
              <Textarea
                placeholder="Что нужно сделать, детали заявки"
                value={editForm.comment}
                onChange={(e) => setEditForm((f) => ({ ...f, comment: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Отмена</Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={onSubmit}>Сохранить</Button>
            </div>

            {/* ── Задачи исполнителей ── */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="CheckSquare" size={15} className="text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Задачи исполнителей</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {ASSIGNEES.map((assignee) => {
                  const colors = ASSIGNEE_COLORS[assignee];
                  const assigneeTasks = tasks.filter((t) => t.assignee === assignee);
                  const draft = taskDrafts[assignee] ?? "";

                  return (
                    <div key={assignee} className={`${colors.bg} border ${colors.border} rounded-xl p-3 space-y-2`}>
                      <div className={`text-xs font-semibold ${colors.text}`}>{assignee}</div>

                      {assigneeTasks.map((task) => (
                        <div key={task.id} className="flex items-start gap-2">
                          <button
                            onClick={() => toggleTaskDone(task)}
                            className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                              task.done
                                ? "bg-green-500 border-green-500"
                                : `border-current ${colors.text} bg-white`
                            }`}
                          >
                            {task.done && <Icon name="Check" size={10} className="text-white" />}
                          </button>
                          <span className={`text-xs leading-snug ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {task.text || "—"}
                          </span>
                        </div>
                      ))}

                      <div className="flex gap-1.5">
                        <Input
                          placeholder="Добавить задачу..."
                          value={draft}
                          onChange={(e) => setTaskDrafts((d) => ({ ...d, [assignee]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) saveTask(assignee); }}
                          className="h-7 text-xs bg-white/70 border-white/50"
                        />
                        {draft.trim() && (
                          <Button
                            size="sm"
                            variant="outline"
                            className={`h-7 w-7 p-0 ${colors.text} bg-white/70 hover:bg-white border-0 shrink-0`}
                            onClick={() => saveTask(assignee)}
                            disabled={savingTask === assignee}
                          >
                            {savingTask === assignee
                              ? <Icon name="Loader2" size={12} className="animate-spin" />
                              : <Icon name="Plus" size={12} />}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Переписка ── */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="MessageSquare" size={15} className="text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Переписка</span>
              </div>

              <div className="bg-muted/30 rounded-xl p-3 space-y-3 max-h-64 overflow-y-auto mb-3">
                {messages.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-6">
                    Сообщений пока нет
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = user && (msg.user_id === user.id || msg.user_name === user.name);
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                          isMe
                            ? "bg-blue-500 text-white rounded-br-sm"
                            : "bg-white border border-border text-foreground rounded-bl-sm"
                        }`}>
                          {!isMe && (
                            <div className="text-[10px] font-semibold mb-0.5 opacity-70">{msg.user_name}</div>
                          )}
                          <div className="leading-snug">{msg.text}</div>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 px-1">
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Написать сообщение..."
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!msgText.trim() || sendingMsg}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3"
                >
                  {sendingMsg
                    ? <Icon name="Loader2" size={16} className="animate-spin" />
                    : <Icon name="Send" size={16} />}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить заявку?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground">
              Вы действительно уверены, что хотите удалить заявку{" "}
              <span className="font-medium text-foreground">{editingOrder?.number}</span>? Это действие нельзя отменить.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>Отмена</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={handleDelete}>
                <Icon name="Trash2" size={15} className="mr-1.5" />Удалить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderEditDialog;
