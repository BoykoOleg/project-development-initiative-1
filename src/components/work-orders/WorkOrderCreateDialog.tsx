import React from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkItem, PartItem } from "./types";

interface WorkOrderCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createForm: { client: string; car: string; master: string; order_id: string };
  setCreateForm: React.Dispatch<React.SetStateAction<{ client: string; car: string; master: string; order_id: string }>>;
  newWorks: WorkItem[];
  setNewWorks: React.Dispatch<React.SetStateAction<WorkItem[]>>;
  newParts: PartItem[];
  setNewParts: React.Dispatch<React.SetStateAction<PartItem[]>>;
  onSubmit: () => void;
}

const WorkOrderCreateDialog = ({
  open,
  onOpenChange,
  createForm,
  setCreateForm,
  newWorks,
  setNewWorks,
  newParts,
  setNewParts,
  onSubmit,
}: WorkOrderCreateDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {createForm.order_id ? `Наряд по заявке З-${createForm.order_id.padStart(4, "0")}` : "Новый заказ-наряд"}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Клиент *</label>
            <Input placeholder="ФИО клиента" value={createForm.client} onChange={(e) => setCreateForm((p) => ({ ...p, client: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Автомобиль</label>
            <Input placeholder="Марка модель год" value={createForm.car} onChange={(e) => setCreateForm((p) => ({ ...p, car: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Мастер</label>
          <Input placeholder="Имя мастера" value={createForm.master} onChange={(e) => setCreateForm((p) => ({ ...p, master: e.target.value }))} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Работы</label>
            <Button variant="ghost" size="sm" onClick={() => setNewWorks((p) => [...p, { name: "", price: 0, qty: 1, norm_hours: 0, norm_hour_price: 0, discount: 0 }])}>
              <Icon name="Plus" size={14} className="mr-1" />Добавить
            </Button>
          </div>
          <div className="space-y-2">
            {newWorks.map((w, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="Название работы"
                  className="flex-1"
                  value={w.name}
                  onChange={(e) => setNewWorks((p) => p.map((item, j) => j === i ? { ...item, name: e.target.value } : item))}
                />
                <Input
                  type="number"
                  placeholder="Цена"
                  className="w-28"
                  value={w.price || ""}
                  onChange={(e) => setNewWorks((p) => p.map((item, j) => j === i ? { ...item, price: Number(e.target.value) } : item))}
                />
                {newWorks.length > 1 && (
                  <Button variant="ghost" size="sm" className="shrink-0 text-red-500" onClick={() => setNewWorks((p) => p.filter((_, j) => j !== i))}>
                    <Icon name="X" size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Запчасти</label>
            <Button variant="ghost" size="sm" onClick={() => setNewParts((p) => [...p, { name: "", qty: 1, price: 0 }])}>
              <Icon name="Plus" size={14} className="mr-1" />Добавить
            </Button>
          </div>
          <div className="space-y-2">
            {newParts.map((p, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="Название"
                  className="flex-1"
                  value={p.name}
                  onChange={(e) => setNewParts((prev) => prev.map((item, j) => j === i ? { ...item, name: e.target.value } : item))}
                />
                <Input
                  type="number"
                  placeholder="Кол"
                  className="w-20"
                  value={p.qty || ""}
                  onChange={(e) => setNewParts((prev) => prev.map((item, j) => j === i ? { ...item, qty: Number(e.target.value) } : item))}
                />
                <Input
                  type="number"
                  placeholder="Цена"
                  className="w-28"
                  value={p.price || ""}
                  onChange={(e) => setNewParts((prev) => prev.map((item, j) => j === i ? { ...item, price: Number(e.target.value) } : item))}
                />
                {newParts.length > 1 && (
                  <Button variant="ghost" size="sm" className="shrink-0 text-red-500" onClick={() => setNewParts((prev) => prev.filter((_, j) => j !== i))}>
                    <Icon name="X" size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={onSubmit}>Создать</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default WorkOrderCreateDialog;