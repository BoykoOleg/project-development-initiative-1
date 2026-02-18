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

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [carDialogOpen, setCarDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", comment: "" });
  const [carForm, setCarForm] = useState<Car>({ brand: "", model: "", year: "", vin: "" });

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
    setCarForm({ brand: "", model: "", year: "", vin: "" });
    setDialogOpen(true);
  };

  const handleCreateClient = async () => {
    if (!form.name || !form.phone) {
      toast.error("Заполните имя и телефон");
      return;
    }
    try {
      const url = getApiUrl("clients");
      if (!url) { toast.error("Бэкенд не подключён"); return; }

      const payload: Record<string, unknown> = { action: "create_client", ...form };
      if (carForm.brand.trim() && carForm.model.trim()) {
        payload.car = { ...carForm };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.client) {
        setClients([data.client, ...clients]);
        toast.success("Клиент добавлен");
      }
    } catch {
      toast.error("Ошибка при создании клиента");
    }
    setForm({ name: "", phone: "", email: "", comment: "" });
    setCarForm({ brand: "", model: "", year: "", vin: "" });
    setDialogOpen(false);
  };

  const openAddCarDialog = () => {
    setCarForm({ brand: "", model: "", year: "", vin: "" });
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
    setCarForm({ brand: "", model: "", year: "", vin: "" });
    setCarDialogOpen(false);
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
              onBrandChange={(v) => setCarForm((p) => ({ ...p, brand: v, model: v !== p.brand ? "" : p.model }))}
              onModelChange={(v) => setCarForm((p) => ({ ...p, model: v }))}
              onYearChange={(v) => setCarForm((p) => ({ ...p, year: v }))}
              onVinChange={(v) => setCarForm((p) => ({ ...p, vin: v }))}
            />

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleCreateClient}>Добавить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedClient && !carDialogOpen} onOpenChange={() => setSelectedClient(null)}>
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
                              {car.vin && (
                                <div className="text-xs text-muted-foreground mt-1 font-mono">
                                  VIN: {car.vin}
                                </div>
                              )}
                            </div>
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
              onBrandChange={(v) => setCarForm((p) => ({ ...p, brand: v, model: v !== p.brand ? "" : p.model }))}
              onModelChange={(v) => setCarForm((p) => ({ ...p, model: v }))}
              onYearChange={(v) => setCarForm((p) => ({ ...p, year: v }))}
              onVinChange={(v) => setCarForm((p) => ({ ...p, vin: v }))}
            />
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setCarDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleAddCar}>Добавить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Clients;