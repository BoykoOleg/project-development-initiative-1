import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CarFields from "@/components/CarFields";
import { Car, Client } from "./ClientTypes";
import { getApiUrl } from "@/lib/api";

interface CarDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  carForm: Car;
  onCarFormChange: (car: Car) => void;
  onSubmit: () => void;
  submitLabel: string;
}

const CarDialog = ({ open, onOpenChange, title, carForm, onCarFormChange, onSubmit, submitLabel }: CarDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <CarFields
          brand={carForm.brand}
          model={carForm.model}
          year={carForm.year}
          vin={carForm.vin}
          licensePlate={carForm.license_plate}
          onBrandChange={(v) => onCarFormChange({ ...carForm, brand: v, model: v !== carForm.brand ? "" : carForm.model })}
          onModelChange={(v) => onCarFormChange({ ...carForm, model: v })}
          onYearChange={(v) => onCarFormChange({ ...carForm, year: v })}
          onVinChange={(v) => onCarFormChange({ ...carForm, vin: v })}
          onLicensePlateChange={(v) => onCarFormChange({ ...carForm, license_plate: v })}
        />
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={onSubmit}>{submitLabel}</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

interface CallRecord {
  id: string;
  phone: string;
  dst?: string;
  direction: "in" | "out" | "missed";
  duration: number;
  started_at: string;
  transcript?: string | null;
  transcript_status?: string;
  transcript_structured?: TranscriptLine[] | null;
  record_url?: string | null;
}

interface TranscriptLine {
  speaker: string;
  role: "operator" | "client" | "unknown";
  text: string;
}

const formatDuration = (s: number) => {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m} мин ${sec} сек` : `${sec} сек`;
};

const formatCallTime = (raw: string | number) => {
  if (!raw) return "—";
  const num = Number(raw);
  const d = !isNaN(num) && num > 1000000000 ? new Date(num * 1000) : new Date(raw as string);
  if (isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) + " " +
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

const CallsHistory = ({ phone }: { phone: string }) => {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const url = getApiUrl("calls");
      if (!url) { setLoading(false); return; }
      try {
        const res = await fetch(`${url}?action=calls_by_phone&phone=${encodeURIComponent(phone)}`);
        const data = await res.json();
        setCalls(data.calls || []);
      } catch {
        setCalls([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [phone]);

  if (loading) return (
    <div className="flex items-center justify-center py-8 text-muted-foreground">
      <Icon name="Loader2" size={20} className="animate-spin mr-2" />
      <span className="text-sm">Загружаю звонки...</span>
    </div>
  );

  if (calls.length === 0) return (
    <div className="text-center py-8 text-muted-foreground">
      <Icon name="PhoneOff" size={28} className="mx-auto mb-2 opacity-30" />
      <p className="text-sm">Звонков не найдено</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {calls.map((call) => (
        <div key={call.id} className="border border-border rounded-lg overflow-hidden">
          <div
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 cursor-pointer"
            onClick={() => call.transcript && setExpandedId(expandedId === call.id ? null : call.id)}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              call.direction === "in" ? "bg-green-50" : call.direction === "out" ? "bg-blue-50" : "bg-red-50"
            }`}>
              <Icon
                name={call.direction === "in" ? "PhoneIncoming" : call.direction === "out" ? "PhoneOutgoing" : "PhoneMissed"}
                size={13}
                className={call.direction === "in" ? "text-green-600" : call.direction === "out" ? "text-blue-600" : "text-red-500"}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">{formatCallTime(call.started_at)}</span>
                {call.duration > 0 && (
                  <span className="text-xs text-muted-foreground">{formatDuration(call.duration)}</span>
                )}
                {call.dst && (
                  <span className="text-xs text-muted-foreground font-mono">→ {call.dst}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {call.transcript_status === "done" && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 gap-1">
                  <Icon name="FileText" size={9} />
                  Текст
                </Badge>
              )}
              {call.record_url && (
                <button
                  onClick={(e) => { e.stopPropagation(); window.open(call.record_url!, "_blank"); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Icon name="Play" size={14} />
                </button>
              )}
              {call.transcript && (
                <Icon name={expandedId === call.id ? "ChevronUp" : "ChevronDown"} size={14} className="text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Расшифровка */}
          {expandedId === call.id && call.transcript && (
            <div className="border-t border-border bg-muted/20 px-3 py-3">
              {call.transcript_structured && call.transcript_structured.length > 0 ? (
                <div className="space-y-2">
                  {call.transcript_structured.map((line, i) => (
                    <div key={i} className={`flex gap-2 ${line.role === "operator" ? "flex-row" : "flex-row-reverse"}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        line.role === "operator" ? "bg-blue-100 text-blue-700" : line.role === "client" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                      }`}>
                        {line.role === "operator" ? "О" : line.role === "client" ? "К" : "?"}
                      </div>
                      <div className={`flex-1 max-w-[85%] ${line.role !== "operator" ? "flex flex-col items-end" : ""}`}>
                        <p className={`text-[10px] font-medium mb-0.5 ${
                          line.role === "operator" ? "text-blue-600" : line.role === "client" ? "text-green-600" : "text-muted-foreground"
                        }`}>{line.speaker}</p>
                        <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                          line.role === "operator" ? "bg-blue-50 text-foreground rounded-tl-sm" :
                          line.role === "client" ? "bg-green-50 text-foreground rounded-tr-sm" :
                          "bg-muted text-foreground"
                        }`}>
                          {line.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">{call.transcript}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

interface Props {
  selectedClient: Client | null;
  editClientMode: boolean;
  editClientForm: { name: string; phone: string; email: string; comment: string };
  onEditClientFormChange: (form: { name: string; phone: string; email: string; comment: string }) => void;
  onOpenEditClientMode: () => void;
  onUpdateClient: () => void;
  onCancelEdit: () => void;
  onClose: () => void;

  carDialogOpen: boolean;
  onCarDialogOpenChange: (v: boolean) => void;
  carForm: Car;
  onCarFormChange: (car: Car) => void;
  onAddCar: () => void;
  onOpenAddCarDialog: () => void;

  editCarDialogOpen: boolean;
  onEditCarDialogOpenChange: (v: boolean) => void;
  editCarForm: Car;
  onEditCarFormChange: (car: Car) => void;
  onUpdateCar: () => void;
  onOpenEditCarDialog: (car: Car) => void;

  onDeleteCar: (carId: number) => void;
}

const ClientDetailDialog = ({
  selectedClient,
  editClientMode,
  editClientForm,
  onEditClientFormChange,
  onOpenEditClientMode,
  onUpdateClient,
  onCancelEdit,
  onClose,
  carDialogOpen,
  onCarDialogOpenChange,
  carForm,
  onCarFormChange,
  onAddCar,
  onOpenAddCarDialog,
  editCarDialogOpen,
  onEditCarDialogOpenChange,
  editCarForm,
  onEditCarFormChange,
  onUpdateCar,
  onOpenEditCarDialog,
  onDeleteCar,
}: Props) => {
  const [activeTab, setActiveTab] = useState<"info" | "calls">("info");

  return (
    <>
      <Dialog open={!!selectedClient && !carDialogOpen && !editCarDialogOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-6">
                  <DialogTitle>{editClientMode ? "Редактирование клиента" : selectedClient.name}</DialogTitle>
                  {!editClientMode && (
                    <Button size="sm" variant="outline" onClick={onOpenEditClientMode}>
                      <Icon name="Pencil" size={14} className="mr-1" />
                      Изменить
                    </Button>
                  )}
                </div>
              </DialogHeader>

              {/* Вкладки */}
              {!editClientMode && (
                <div className="flex gap-1 border-b border-border pb-0 -mb-2">
                  {[
                    { key: "info" as const, label: "Данные", icon: "User" },
                    { key: "calls" as const, label: "Звонки", icon: "Phone" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors ${
                        activeTab === tab.key
                          ? "border-blue-500 text-blue-600 font-medium"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon name={tab.icon} size={14} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-4 pt-2">
                {editClientMode ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">ФИО *</label>
                      <Input value={editClientForm.name} onChange={(e) => onEditClientFormChange({ ...editClientForm, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Телефон *</label>
                        <Input value={editClientForm.phone} onChange={(e) => onEditClientFormChange({ ...editClientForm, phone: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Email</label>
                        <Input placeholder="email@example.com" value={editClientForm.email} onChange={(e) => onEditClientFormChange({ ...editClientForm, email: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Комментарий</label>
                      <Textarea rows={2} value={editClientForm.comment} onChange={(e) => onEditClientFormChange({ ...editClientForm, comment: e.target.value })} />
                    </div>
                    <div className="flex gap-3 pt-1">
                      <Button variant="outline" className="flex-1" onClick={onCancelEdit}>Отмена</Button>
                      <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={onUpdateClient}>Сохранить</Button>
                    </div>
                  </>
                ) : activeTab === "info" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Телефон</div>
                        <div className="font-medium">{selectedClient.phone}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Email</div>
                        <div className="font-medium">{selectedClient.email || "—"}</div>
                      </div>
                      {selectedClient.comment && (
                        <div className="col-span-2">
                          <div className="text-muted-foreground">Комментарий</div>
                          <div className="font-medium">{selectedClient.comment}</div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-foreground">Автомобили</div>
                        <Button size="sm" variant="outline" onClick={onOpenAddCarDialog}>
                          <Icon name="Plus" size={14} className="mr-1" />
                          Добавить авто
                        </Button>
                      </div>
                      {selectedClient.cars.length > 0 ? (
                        <div className="space-y-3">
                          {selectedClient.cars.map((car) => (
                            <div key={car.id} className="bg-muted/50 rounded-lg p-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="text-sm font-medium text-foreground">
                                    {car.brand} {car.model} {car.year}
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {car.license_plate && (
                                      <div className="text-xs text-foreground font-mono font-medium bg-white border border-border px-1.5 py-0.5 rounded">
                                        {car.license_plate}
                                      </div>
                                    )}
                                    {car.vin && (
                                      <div className="text-xs text-muted-foreground font-mono">
                                        VIN: {car.vin}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                                    onClick={() => onOpenEditCarDialog(car)}
                                  >
                                    <Icon name="Pencil" size={14} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                    onClick={() => car.id && onDeleteCar(car.id)}
                                  >
                                    <Icon name="Trash2" size={14} />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-lg">
                          Нет автомобилей
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <CallsHistory phone={selectedClient.phone} />
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <CarDialog
        open={carDialogOpen}
        onOpenChange={onCarDialogOpenChange}
        title="Добавить автомобиль"
        carForm={carForm}
        onCarFormChange={onCarFormChange}
        onSubmit={onAddCar}
        submitLabel="Добавить"
      />

      <CarDialog
        open={editCarDialogOpen}
        onOpenChange={onEditCarDialogOpenChange}
        title="Редактировать автомобиль"
        carForm={editCarForm}
        onCarFormChange={onEditCarFormChange}
        onSubmit={onUpdateCar}
        submitLabel="Сохранить"
      />
    </>
  );
};

export default ClientDetailDialog;
