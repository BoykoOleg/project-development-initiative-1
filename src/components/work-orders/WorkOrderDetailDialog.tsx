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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkOrder, getTotal } from "./types";

interface WorkOrderDetailDialogProps {
  selectedOrder: WorkOrder | null;
  onClose: () => void;
  onStatusChange: (id: number, status: WorkOrder["status"]) => void;
  addWorkForm: { name: string; price: number };
  setAddWorkForm: React.Dispatch<React.SetStateAction<{ name: string; price: number }>>;
  onAddWork: () => void;
  addPartForm: { name: string; qty: number; price: number };
  setAddPartForm: React.Dispatch<React.SetStateAction<{ name: string; qty: number; price: number }>>;
  onAddPart: () => void;
}

const WorkOrderDetailDialog = ({
  selectedOrder,
  onClose,
  onStatusChange,
  addWorkForm,
  setAddWorkForm,
  onAddWork,
  addPartForm,
  setAddPartForm,
  onAddPart,
}: WorkOrderDetailDialogProps) => (
  <Dialog open={!!selectedOrder} onOpenChange={() => onClose()}>
    <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
      {selectedOrder && (
        <>
          <DialogHeader>
            <DialogTitle>Заказ-наряд {selectedOrder.number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Клиент</div>
                <div className="font-medium">{selectedOrder.client}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Автомобиль</div>
                <div className="font-medium">{selectedOrder.car || "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Дата</div>
                <div className="font-medium">{selectedOrder.date}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Мастер</div>
                <div className="font-medium">{selectedOrder.master || "—"}</div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-foreground mb-2">Работы</div>
              {selectedOrder.works.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 mb-2">
                  {selectedOrder.works.map((w, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-foreground">{w.name}</span>
                      <span className="font-medium shrink-0 ml-2">{w.price.toLocaleString("ru-RU")} ₽</span>
                    </div>
                  ))}
                </div>
              )}
              {selectedOrder.status !== "issued" && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Название работы"
                    className="flex-1"
                    value={addWorkForm.name}
                    onChange={(e) => setAddWorkForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Цена"
                    className="w-24"
                    value={addWorkForm.price || ""}
                    onChange={(e) => setAddWorkForm((p) => ({ ...p, price: Number(e.target.value) }))}
                  />
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white shrink-0" onClick={onAddWork}>
                    <Icon name="Plus" size={14} />
                  </Button>
                </div>
              )}
            </div>

            <div>
              <div className="text-sm font-medium text-foreground mb-2">Запчасти и материалы</div>
              {selectedOrder.parts.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 mb-2">
                  {selectedOrder.parts.map((p, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-foreground">{p.name} x {p.qty}</span>
                      <span className="font-medium shrink-0 ml-2">{(p.price * p.qty).toLocaleString("ru-RU")} ₽</span>
                    </div>
                  ))}
                </div>
              )}
              {selectedOrder.status !== "issued" && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Название"
                    className="flex-1"
                    value={addPartForm.name}
                    onChange={(e) => setAddPartForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Кол"
                    className="w-16"
                    value={addPartForm.qty || ""}
                    onChange={(e) => setAddPartForm((p) => ({ ...p, qty: Number(e.target.value) }))}
                  />
                  <Input
                    type="number"
                    placeholder="Цена"
                    className="w-24"
                    value={addPartForm.price || ""}
                    onChange={(e) => setAddPartForm((p) => ({ ...p, price: Number(e.target.value) }))}
                  />
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white shrink-0" onClick={onAddPart}>
                    <Icon name="Plus" size={14} />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="text-sm font-medium">Итого:</span>
              <span className="text-lg font-bold text-foreground">{getTotal(selectedOrder).toLocaleString("ru-RU")} ₽</span>
            </div>

            <div className="flex gap-3 pt-2">
              <Select value={selectedOrder.status} onValueChange={(v) => onStatusChange(selectedOrder.id, v as WorkOrder["status"])}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Новый</SelectItem>
                  <SelectItem value="in-progress">В работе</SelectItem>
                  <SelectItem value="done">Готов</SelectItem>
                  <SelectItem value="issued">Выдан</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={onClose}>Закрыть</Button>
            </div>
          </div>
        </>
      )}
    </DialogContent>
  </Dialog>
);

export default WorkOrderDetailDialog;
