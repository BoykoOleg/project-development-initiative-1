import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
}

const OrderEditDialog = ({
  open,
  onOpenChange,
  editingOrder,
  editForm,
  setEditForm,
  onSubmit,
}: OrderEditDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать заявку {editingOrder?.number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Клиент *</label>
            <Input value={editForm.client} onChange={(e) => setEditForm((f) => ({ ...f, client: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Телефон *</label>
            <Input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Автомобиль</label>
            <Input
              placeholder="Марка модель год"
              value={editForm.car}
              onChange={(e) => setEditForm((f) => ({ ...f, car: e.target.value }))}
            />
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
  );
};

export default OrderEditDialog;
