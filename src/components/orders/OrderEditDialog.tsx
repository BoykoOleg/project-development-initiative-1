import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";
import { Order } from "./types";

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

const OrderEditDialog = ({
  open,
  onOpenChange,
  editingOrder,
  editForm,
  setEditForm,
  onSubmit,
  onDelete,
}: OrderEditDialogProps) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (editingOrder && onDelete) {
      onDelete(editingOrder.id);
      setConfirmDelete(false);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); setConfirmDelete(false); }}>
        <DialogContent className="sm:max-w-md">
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
          <div className="space-y-3 pt-1">
            <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
              <div className="font-medium text-foreground">{editingOrder?.client}</div>
              <div className="text-muted-foreground">{editingOrder?.phone}</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Комментарий</label>
              <Textarea
                placeholder="Что нужно сделать, детали заявки"
                value={editForm.comment}
                onChange={(e) => setEditForm((f) => ({ ...f, comment: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Отмена</Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={onSubmit}>Сохранить</Button>
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
              Вы действительно уверены, что хотите удалить заявку <span className="font-medium text-foreground">{editingOrder?.number}</span>? Это действие нельзя отменить.
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