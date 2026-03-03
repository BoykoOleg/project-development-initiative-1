import { useState, useEffect } from "react";
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
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";
import CarFields from "@/components/CarFields";

interface Car {
  id?: number;
  brand: string;
  model: string;
  year: string;
  vin: string;
  license_plate?: string;
}

interface Client {
  id?: number;
  name: string;
  phone: string;
  email: string;
  comment: string;
  cars: Car[];
  created_at?: string;
}

interface Duplicate {
  field: "phone" | "name" | "vin" | "license_plate";
  client_id: number;
  client_name: string;
  client_phone: string;
  vin?: string;
  license_plate?: string;
}

const FIELD_LABELS: Record<string, string> = {
  phone: "телефон",
  name: "ФИО",
  vin: "VIN",
  license_plate: "гос. номер",
};

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [carDialogOpen, setCarDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", comment: "" });
  const [carForm, setCarForm] = useState<Car>({ brand: "", model: "", year: "", vin: "", license_plate: "" });
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);
  const [editCarDialogOpen, setEditCarDialogOpen] = useState(false);
  const [editCarForm, setEditCarForm] = useState<Car>({ brand: "", model: "", year: "", vin: "", license_plate: "" });
  const [editCarId, setEditCarId] = useState<number | null>(null);

  const fetchClients = async () => {
    try {
      const url = getApiUrl("clients");
      if (!url) { setLoading(false); return; }
      const res = await fetch(url);
      const data = await res.json();
      if (data.clients) setClients(data.clients);
    } catch {
      toast.error("Не удалось загрузить клиентов");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const openCreateDialog = () => {
    setForm({ name: "", phone: "", email: "", comment: "" });
    setCarForm({ brand: "", model: "", year: "", vin: "", license_plate: "" });
    setDialogOpen(true);
  };

  const doCreateClient = async (payload: Record<string, unknown>) => {
    const url = getApiUrl("clients");
    if (!url) { toast.error("Бэкенд не подключён"); return; }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.status === 409 && data.duplicates) {
      setDuplicates(data.duplicates);
      setPendingPayload(payload);
      return;
    }
    if (data.client) {
      setClients([data.client, ...clients]);
      toast.success("Клиент добавлен");
      setForm({ name: "", phone: "", email: "", comment: "" });
      setCarForm({ brand: "", model: "", year: "", vin: "", license_plate: "" });
      setDialogOpen(false);
    }
  };

  const handleCreateClient = async () => {
    if (!form.name || !form.phone) {
      toast.error("Заполните имя и телефон");
      return;
    }
    try {
      const payload: Record<string, unknown> = { action: "create_client", ...form };
      if (carForm.brand.trim() && carForm.model.trim()) {
        payload.car = { ...carForm };
      }
      await doCreateClient(payload);
    } catch {
      toast.error("Ошибка при создании клиента");
    }
  };

  const handleForceCreate = async () => {
    if (!pendingPayload) return;
    try {
      await doCreateClient({ ...pendingPayload, force: true });
    } catch {
      toast.error("Ошибка при создании клиента");
    }
    setDuplicates([]);
    setPendingPayload(null);
  };

  const openAddCarDialog = () => {
    setCarForm({ brand: "", model: "", year: "", vin: "", license_plate: "" });
    setCarDialogOpen(true);
  };

  const handleAddCar = async () => {
    if (!carForm.brand || !carForm.model || !selectedClient?.id) {
      toast.error("Заполните марку и модель");
      return;
    }
    try {
      const url = getApiUrl("clients");
      if (!url) { toast.error("Бэкенд не подключён"); return; }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_car", client_id: selectedClient.id, ...carForm }),
      });
      const data = await res.json();
      if (data.car) {
        const updated = clients.map((c) =>
          c.id === selectedClient.id ? { ...c, cars: [...c.cars, data.car] } : c
        );
        setClients(updated);
        const updatedClient = updated.find((c) => c.id === selectedClient.id);
        if (updatedClient) setSelectedClient(updatedClient);
        toast.success("Автомобиль добавлен");
      }
    } catch {
      toast.error("Ошибка при добавлении авто");
    }
    setCarForm({ brand: "", model: "", year: "", vin: "", license_plate: "" });
    setCarDialogOpen(false);
  };

  const openEditCarDialog = (car: Car) => {
    setEditCarId(car.id ?? null);
    setEditCarForm({ brand: car.brand, model: car.model, year: car.year, vin: car.vin, license_plate: car.license_plate ?? "" });
    setEditCarDialogOpen(true);
  };

  const handleUpdateCar = async () => {
    if (!editCarForm.brand || !editCarForm.model || !editCarId) {
      toast.error("Заполните марку и модель");
      return;
    }
    try {
      const url = getApiUrl("clients");
      if (!url) { toast.error("Бэкенд не подключён"); return; }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_car", car_id: editCarId, ...editCarForm }),
      });
      const data = await res.json();
      if (data.car) {
        const updated = clients.map((c) =>
          c.id === selectedClient?.id
            ? { ...c, cars: c.cars.map((car) => car.id === editCarId ? data.car : car) }
            : c
        );
        setClients(updated);
        const updatedClient = updated.find((c) => c.id === selectedClient?.id);
        if (updatedClient) setSelectedClient(updatedClient);
        toast.success("Автомобиль обновлён");
        setEditCarDialogOpen(false);
      }
    } catch {
      toast.error("Ошибка при обновлении авто");
    }
  };

  const handleDeleteCar = async (carId: number) => {
    if (!selectedClient?.id) return;
    try {
      const url = getApiUrl("clients");
      if (!url) return;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_car", car_id: carId }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = clients.map((c) =>
          c.id === selectedClient.id ? { ...c, cars: c.cars.filter((car) => car.id !== carId) } : c
        );
        setClients(updated);
        const updatedClient = updated.find((c) => c.id === selectedClient.id);
        if (updatedClient) setSelectedClient(updatedClient);
        toast.success("Автомобиль удалён");
      }
    } catch {
      toast.error("Ошибка при удалении авто");
    }
  };

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.cars.some((car) => car.vin.toLowerCase().includes(q) || `${car.brand} ${car.model}`.toLowerCase().includes(q))
    );
  });

  return (
    <Layout
      title="Клиенты"
      actions={
        <>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white hidden sm:flex" onClick={openCreateDialog}>
            <Icon name="Plus" size={16} className="mr-1.5" />
            Новый клиент
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white sm:hidden" size="sm" onClick={openCreateDialog}>
            <Icon name="Plus" size={16} />
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Поиск по имени, телефону, авто или VIN..." className="pl-9 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Загрузка...</div>
        ) : clients.length === 0 && !search ? (
          <div className="bg-white rounded-xl border border-border shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Users" size={28} className="text-blue-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Клиентов пока нет</h3>
            <p className="text-sm text-muted-foreground mb-4">Добавьте первого клиента, чтобы начать работу</p>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={openCreateDialog}>
              <Icon name="Plus" size={16} className="mr-1.5" />
              Добавить клиента
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedClient(client)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-blue-600">
                      {client.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">{client.name}</div>
                    <div className="text-sm text-muted-foreground">{client.phone}</div>
                  </div>
                </div>
                {client.cars.length > 0 ? (
                  <div className="space-y-1.5">
                    {client.cars.map((car, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Icon name="Car" size={14} className="text-muted-foreground shrink-0" />
                        <span className="text-foreground truncate">{car.brand} {car.model} {car.year}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Нет автомобилей</div>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
                Клиенты не найдены
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Новый клиент</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">ФИО *</label>
              <Input placeholder="Иванов Алексей Сергеевич" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Телефон *</label>
                <Input placeholder="+7 (___) ___-__-__" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input placeholder="email@example.com" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Комментарий</label>
              <Textarea placeholder="Заметка о клиенте" value={form.comment} onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))} rows={2} />
            </div>

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
            />

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleCreateClient}>Добавить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedClient && !carDialogOpen && !editCarDialogOpen} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedClient.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
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
                    <Button size="sm" variant="outline" onClick={openAddCarDialog}>
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
                                onClick={() => openEditCarDialog(car)}
                              >
                                <Icon name="Pencil" size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                onClick={() => car.id && handleDeleteCar(car.id)}
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={carDialogOpen} onOpenChange={setCarDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Добавить автомобиль</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
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
            />
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setCarDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleAddCar}>Добавить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editCarDialogOpen} onOpenChange={setEditCarDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать автомобиль</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <CarFields
              brand={editCarForm.brand}
              model={editCarForm.model}
              year={editCarForm.year}
              vin={editCarForm.vin}
              licensePlate={editCarForm.license_plate}
              onBrandChange={(v) => setEditCarForm((p) => ({ ...p, brand: v, model: v !== p.brand ? "" : p.model }))}
              onModelChange={(v) => setEditCarForm((p) => ({ ...p, model: v }))}
              onYearChange={(v) => setEditCarForm((p) => ({ ...p, year: v }))}
              onVinChange={(v) => setEditCarForm((p) => ({ ...p, vin: v }))}
              onLicensePlateChange={(v) => setEditCarForm((p) => ({ ...p, license_plate: v }))}
            />
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditCarDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleUpdateCar}>Сохранить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={duplicates.length > 0} onOpenChange={() => { setDuplicates([]); setPendingPayload(null); }}>
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
              <Button variant="outline" className="flex-1" onClick={() => { setDuplicates([]); setPendingPayload(null); }}>
                Отмена
              </Button>
              <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" onClick={handleForceCreate}>
                Всё равно создать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Clients;