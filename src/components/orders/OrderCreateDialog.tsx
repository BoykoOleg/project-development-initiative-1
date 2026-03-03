import { useRef } from "react";
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
import CarFields from "@/components/CarFields";
import { Car, Client } from "./types";

interface CarForm {
  brand: string;
  model: string;
  year: string;
  vin: string;
  license_plate: string;
}

interface Form {
  client: string;
  phone: string;
  car: string;
  service: string;
  comment: string;
}

interface OrderCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: Form;
  setForm: React.Dispatch<React.SetStateAction<Form>>;
  carForm: CarForm;
  setCarForm: React.Dispatch<React.SetStateAction<CarForm>>;
  selectedClient: Client | null;
  filteredClients: Client[];
  clientSearch: string;
  setClientSearch: (v: string) => void;
  clientDropdownOpen: boolean;
  setClientDropdownOpen: (v: boolean) => void;
  recognizing: boolean;
  onSelectClient: (client: Client) => void;
  onClearClient: () => void;
  onSelectCar: (car: Car) => void;
  onPhotoRecognize: (file: File) => void;
  onSubmit: () => void;
}

const OrderCreateDialog = ({
  open,
  onOpenChange,
  form,
  setForm,
  carForm,
  setCarForm,
  selectedClient,
  filteredClients,
  clientSearch,
  setClientSearch,
  clientDropdownOpen,
  setClientDropdownOpen,
  recognizing,
  onSelectClient,
  onClearClient,
  onSelectCar,
  onPhotoRecognize,
  onSubmit,
}: OrderCreateDialogProps) => {
  const clientInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новая заявка</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {recognizing && (
            <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
              <Icon name="Loader2" size={16} className="animate-spin text-amber-600" />
              <span className="text-sm text-amber-700">ИИ распознаёт документ...</span>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Клиент *</label>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onPhotoRecognize(file);
              }}
            />
            {selectedClient ? (
              <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-blue-600">
                    {selectedClient.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{selectedClient.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedClient.phone}</div>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0 h-7 w-7 p-0" onClick={onClearClient}>
                  <Icon name="X" size={14} />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={clientInputRef}
                    placeholder="Начните вводить имя или телефон..."
                    value={form.client}
                    autoComplete="off"
                    onChange={(e) => {
                      setForm((f) => ({ ...f, client: e.target.value }));
                      setClientSearch(e.target.value);
                      if (e.target.value.length >= 2) setClientDropdownOpen(true);
                      else setClientDropdownOpen(false);
                    }}
                    onFocus={() => { if (form.client.length >= 2 || filteredClients.length > 0) setClientDropdownOpen(true); }}
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
                              <div className="text-xs text-muted-foreground">{c.phone}</div>
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
                <Button
                  className="h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                  disabled={recognizing}
                  onClick={() => photoInputRef.current?.click()}
                >
                  {recognizing ? (
                    <Icon name="Loader2" size={16} className="animate-spin" />
                  ) : (
                    <Icon name="Camera" size={16} />
                  )}
                </Button>
              </div>
            )}
            {!selectedClient && form.client && (
              <p className="text-xs text-blue-500 flex items-center gap-1">
                <Icon name="Info" size={12} />
                Новый клиент будет создан автоматически
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Телефон *</label>
            <Input
              placeholder="+7 (___) ___-__-__"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              disabled={!!selectedClient}
            />
            <p className="text-xs text-muted-foreground">Номер будет приведён к формату +7</p>
          </div>

          {selectedClient && selectedClient.cars.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Авто клиента</label>
              <div className="flex flex-wrap gap-2">
                {selectedClient.cars.map((car) => (
                  <button
                    key={car.id}
                    type="button"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      carForm.brand === car.brand && carForm.model === car.model
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "bg-white border-border text-foreground hover:bg-muted/50"
                    }`}
                    onClick={() => onSelectCar(car)}
                  >
                    <Icon name="Car" size={14} />
                    {car.brand} {car.model} {car.year}
                  </button>
                ))}
              </div>
            </div>
          )}

          <CarFields
            brand={carForm.brand}
            model={carForm.model}
            year={carForm.year}
            vin={carForm.vin}
            licensePlate={carForm.license_plate}
            onBrandChange={(v) => setCarForm((p) => ({ ...p, brand: v, model: v !== p.brand ? "" : p.model }))}
            onModelChange={(v) => setCarForm((p) => ({ ...p, model: v }))}
            onYearChange={(v) => setCarForm((p) => ({ ...p, year: v }))}
            onVinChange={(v) => setCarForm((p) => ({ ...p, vin: v }))}
            onLicensePlateChange={(v) => setCarForm((p) => ({ ...p, license_plate: v }))}
            showVin={!selectedClient}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Комментарий</label>
            <Textarea
              placeholder="Что нужно сделать, детали заявки"
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            />
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

export default OrderCreateDialog;
