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
import { Car, Duplicate, FIELD_LABELS } from "./ClientTypes";

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: { name: string; phone: string; email: string; inn: string; comment: string };
  onFormChange: (form: { name: string; phone: string; email: string; inn: string; comment: string }) => void;
  carForm: Car;
  onCarFormChange: (car: Car) => void;
  onSubmit: () => void;
}

export const CreateClientDialog = ({
  open,
  onOpenChange,
  form,
  onFormChange,
  carForm,
  onCarFormChange,
  onSubmit,
}: CreateClientDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Новый клиент</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">ФИО / Наименование *</label>
          <Input placeholder="Иванов Алексей Сергеевич" value={form.name} onChange={(e) => onFormChange({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Телефон *</label>
            <Input placeholder="+7 (___) ___-__-__" value={form.phone} onChange={(e) => onFormChange({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">ИНН</label>
            <Input placeholder="7700000000" maxLength={12} value={form.inn} onChange={(e) => onFormChange({ ...form, inn: e.target.value.replace(/\D/g, '') })} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email</label>
          <Input placeholder="email@example.com" value={form.email} onChange={(e) => onFormChange({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Комментарий</label>
          <Textarea placeholder="Заметки о клиенте..." rows={2} value={form.comment} onChange={(e) => onFormChange({ ...form, comment: e.target.value })} />
        </div>
        <div className="border-t border-border pt-4">
          <div className="text-sm font-medium text-foreground mb-3">Автомобиль (необязательно)</div>
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
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={onSubmit}>Добавить</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

interface DuplicateDialogProps {
  duplicates: Duplicate[];
  onClose: () => void;
  onForceCreate: () => void;
}

export const DuplicateDialog = ({ duplicates, onClose, onForceCreate }: DuplicateDialogProps) => (
  <Dialog open={duplicates.length > 0} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-amber-600">
          <Icon name="AlertTriangle" size={18} />
          Возможный дубль
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-3 pt-1">
        <p className="text-sm text-muted-foreground">
          Найдены клиенты с совпадающими данными:
        </p>
        <div className="space-y-2">
          {duplicates.map((d, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Icon name="User" size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-foreground">{d.client_name}</div>
                <div className="text-muted-foreground">{d.client_phone}</div>
                <div className="text-amber-700 text-xs mt-0.5">
                  Совпадает: <span className="font-medium">{FIELD_LABELS[d.field]}</span>
                  {d.vin && ` (${d.vin})`}
                  {d.license_plate && ` (${d.license_plate})`}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Отмена
          </Button>
          <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" onClick={onForceCreate}>
            Всё равно создать
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);