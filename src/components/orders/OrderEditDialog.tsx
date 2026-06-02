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
import { Order, OrderMessage, ASSIGNEES, statusConfig } from "./types";
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
  onAssigneeChange?: (orderId: number, assignee: string | null) => void;
}

const ASSIGNEE_COLORS: Record<string, { bg: string; text: string; active: string }> = {
  "Артем":   { bg: "bg-orange-50",  text: "text-orange-700", active: "bg-orange-100 ring-2 ring-orange-400" },
  "Олег":    { bg: "bg-teal-50",    text: "text-teal-700",   active: "bg-teal-100 ring-2 ring-teal-400"     },
  "Алексей": { bg: "bg-violet-50",  text: "text-violet-700", active: "bg-violet-100 ring-2 ring-violet-400" },
};

const OrderEditDialog = ({
  open,
  onOpenChange,
  editingOrder,
  editForm,
  setEditForm,
  onSubmit,
  onDelete,
  onAssigneeChange,
}: OrderEditDialogProps) => {
  const { user } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [msgText, setMsgText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !editingOrder) return;
    const id = editingOrder.id;
    setMessages([]);
    setMsgText("");
    const url = getApiUrl("orders");
    if (!url) return;
    fetch(`${url}?action=messages&order_id=${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.messages) setMessages(d.messages); })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingOrder?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    return new Date(ts).toLocaleString("ru-RU", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  };

  const currentAssignee = editingOrder?.assignee ?? null;

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

          <div className="grid grid-cols-2 gap-5 pt-1">
            {/* ── Левая колонка ── */}
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                <div className="font-medium text-foreground">{editingOrder?.client}</div>
                <div className="text-muted-foreground">{editingOrder?.phone}</div>
                {editingOrder?.car && <div className="text-muted-foreground">{editingOrder.car}</div>}
                {editingOrder?.service && (
                  <div className="text-foreground/80 text-xs mt-1 pt-1 border-t border-border">
                    {editingOrder.service}
                  </div>
                )}
              </div>

              <div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusConfig[editingOrder?.status ?? "new"]?.className ?? ""}`}>
                  {statusConfig[editingOrder?.status ?? "new"]?.label}
                </span>
              </div>

              {onAssigneeChange && editingOrder && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Исполнитель</label>
                  <div className="flex gap-2 flex-wrap">
                    {ASSIGNEES.map((name) => {
                      const colors = ASSIGNEE_COLORS[name];
                      const isActive = currentAssignee === name;
                      return (
                        <button
                          key={name}
                          onClick={() => onAssigneeChange(editingOrder.id, isActive ? null : name)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            isActive
                              ? `${colors.active} ${colors.text} border-transparent`
                              : `${colors.bg} ${colors.text} border-transparent hover:border-current`
                          }`}
                        >
                          {name}
                        </button>
                      );
                    })}
                    {currentAssignee && (
                      <button
                        onClick={() => onAssigneeChange(editingOrder.id, null)}
                        className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground border border-transparent hover:border-border hover:bg-muted transition-all"
                      >
                        Снять
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Комментарий</label>
                <Textarea
                  placeholder="Что нужно сделать, детали заявки"
                  value={editForm.comment}
                  onChange={(e) => setEditForm((f) => ({ ...f, comment: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Отмена</Button>
                <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={onSubmit}>Сохранить</Button>
              </div>
            </div>

            {/* ── Правая колонка — Переписка ── */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="MessageSquare" size={15} className="text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Переписка</span>
              </div>

              <div className="bg-muted/30 rounded-xl p-3 overflow-y-auto mb-3 space-y-3 min-h-[260px] max-h-[380px]">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/50">
                    <Icon name="MessageCircle" size={28} />
                    <span className="text-xs mt-2">Сообщений пока нет</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = user && (msg.user_id === user.id || msg.user_name === user.name);
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                          isMe
                            ? "bg-blue-500 text-white rounded-br-sm"
                            : "bg-white border border-border text-foreground rounded-bl-sm"
                        }`}>
                          {!isMe && (
                            <div className="text-[10px] font-semibold mb-0.5 opacity-60">{msg.user_name}</div>
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
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 shrink-0"
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
