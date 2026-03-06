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
import { Car, Client } from "./ClientTypes";

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
}: Props) => (
  <>
    <Dialog open={!!selectedClient && !carDialogOpen && !editCarDialogOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
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
              ) : (
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

export default ClientDetailDialog;
