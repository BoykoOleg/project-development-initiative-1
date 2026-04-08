import React, { useRef } from "react";
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

interface Car {
  id: number;
  brand: string;
  model: string;
  year: string;
  vin: string;
  license_plate?: string;
}

interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  cars: Car[];
}

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
  // client search props
  clients: Client[];
  selectedClient: Client | null;
  clientSearch: string;
  setClientSearch: (v: string) => void;
  clientDropdownOpen: boolean;
  setClientDropdownOpen: (v: boolean) => void;
  onSelectClient: (client: Client) => void;
  onClearClient: () => void;
  onSelectCar: (car: Car) => void;
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
  clients,
  selectedClient,
  clientSearch,
  setClientSearch,
  clientDropdownOpen,
  setClientDropdownOpen,
  onSelectClient,
  onClearClient,
  onSelectCar,
}: WorkOrderCreateDialogProps) => {
  const clientInputRef = useRef<HTMLInputElement>(null);

  const filteredClients = (() => {
    if (!clientSearch.trim()) return clients.slice(0, 20);
    const q = clientSearch.toLowerCase();
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    ).slice(0, 20);
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {createForm.order_id ? `Наряд по заявке З-${createForm.order_id.padStart(4, "0")}` : "Новый заказ-наряд"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">

          {/* Клиент с поиском */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Клиент *</label>
            {selectedClient ? (
              <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-blue-600">
                    {selectedClient.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{selectedClient.name}</div>
                  {selectedClient.phone && (
                    <div className="text-xs text-muted-foreground">{selectedClient.phone}</div>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="shrink-0 h-7 w-7 p-0" onClick={onClearClient}>
                  <Icon name="X" size={14} />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  ref={clientInputRef}
                  placeholder="Начните вводить имя или телефон..."
                  value={createForm.client}
                  autoComplete="off"
                  onChange={(e) => {
                    setCreateForm((p) => ({ ...p, client: e.target.value }));
                    setClientSearch(e.target.value);
                    if (e.target.value.length >= 2) setClientDropdownOpen(true);
                    else setClientDropdownOpen(false);
                  }}
                  onFocus={() => {
                    if (createForm.client.length >= 2 || filteredClients.length > 0) setClientDropdownOpen(true);
                  }}
                  onBlur={() => { setTimeout(() => setClientDropdownOpen(false), 150); }}
                />
                {clientDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredClients.length > 0 ? (
                      filteredClients.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
                          onMouseDown={(e) => { e.preventDefault(); onSelectClient(c); }}
                        >
                          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-blue-600">
                              {c.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{c.name}</div>
                            {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
                          </div>
                          {c.cars.length > 0 && (
                            <span className="text-xs text-muted-foreground shrink-0">{c.cars.length} авто</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        Клиент не найден — будет создан автоматически
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {!selectedClient && createForm.client && (
              <p className="text-xs text-blue-500 flex items-center gap-1">
                <Icon name="Info" size={12} />
                Новый клиент будет создан автоматически
              </p>
            )}
          </div>

          {/* Авто клиента */}
          {selectedClient && selectedClient.cars.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Авто клиента</label>
              <div className="flex flex-wrap gap-2">
                {selectedClient.cars.map((car) => {
                  const carStr = `${car.brand} ${car.model} ${car.year}`.trim();
                  return (
                    <button
                      key={car.id}
                      type="button"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                        createForm.car === carStr
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-border text-foreground hover:bg-muted/50"
                      }`}
                      onClick={() => onSelectCar(car)}
                    >
                      <Icon name="Car" size={13} />
                      {carStr}
                      {car.license_plate && <span className="text-muted-foreground">· {car.license_plate}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Автомобиль */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Автомобиль</label>
            <Input
              placeholder="Марка модель год"
              value={createForm.car}
              onChange={(e) => setCreateForm((p) => ({ ...p, car: e.target.value }))}
            />
          </div>

          {/* Мастер */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Мастер</label>
            <Input
              placeholder="Имя мастера"
              value={createForm.master}
              onChange={(e) => setCreateForm((p) => ({ ...p, master: e.target.value }))}
            />
          </div>

          {/* Работы */}
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

          {/* Запчасти */}
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
};

export default WorkOrderCreateDialog;
