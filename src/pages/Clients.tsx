import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";
import { useResizableColumns } from "@/hooks/useResizableColumns";
import { Car, Client, Duplicate } from "@/components/clients/ClientTypes";
import ClientsTable from "@/components/clients/ClientsTable";
import { CreateClientDialog, DuplicateDialog } from "@/components/clients/ClientDialogs";
import ClientDetailDialog from "@/components/clients/ClientDetailDialog";

const Clients = () => {
  const { widths: colWidths, onMouseDown: onColMouseDown } = useResizableColumns([220, 140, 200, 200]);
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
  const [editClientMode, setEditClientMode] = useState(false);
  const [editClientForm, setEditClientForm] = useState({ name: "", phone: "", email: "", comment: "" });

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

  const openEditClientMode = () => {
    if (!selectedClient) return;
    setEditClientForm({
      name: selectedClient.name,
      phone: selectedClient.phone,
      email: selectedClient.email,
      comment: selectedClient.comment,
    });
    setEditClientMode(true);
  };

  const handleUpdateClient = async () => {
    if (!editClientForm.name || !editClientForm.phone || !selectedClient?.id) {
      toast.error("Заполните имя и телефон");
      return;
    }
    try {
      const url = getApiUrl("clients");
      if (!url) { toast.error("Бэкенд не подключён"); return; }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_client", client_id: selectedClient.id, ...editClientForm }),
      });
      const data = await res.json();
      if (data.client) {
        const updated = clients.map((c) =>
          c.id === selectedClient.id ? { ...c, ...data.client } : c
        );
        setClients(updated);
        const updatedClient = updated.find((c) => c.id === selectedClient.id);
        if (updatedClient) setSelectedClient(updatedClient);
        setEditClientMode(false);
        toast.success("Клиент обновлён");
      }
    } catch {
      toast.error("Ошибка при обновлении клиента");
    }
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

  const handleDeleteClient = async (clientId: number) => {
    try {
      const url = getApiUrl("clients");
      if (!url) return;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", client_id: clientId }),
      });
      const data = await res.json();
      if (data.success) {
        setClients(clients.filter((c) => c.id !== clientId));
        setSelectedClient(null);
        setEditClientMode(false);
        toast.success("Клиент удалён");
      } else {
        toast.error(data.error || "Ошибка при удалении");
      }
    } catch {
      toast.error("Ошибка при удалении клиента");
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

        <ClientsTable
          clients={clients}
          filtered={filtered}
          loading={loading}
          colWidths={colWidths}
          onColMouseDown={onColMouseDown}
          onSelectClient={setSelectedClient}
          onOpenCreate={openCreateDialog}
        />
      </div>

      <CreateClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        onFormChange={setForm}
        carForm={carForm}
        onCarFormChange={setCarForm}
        onSubmit={handleCreateClient}
      />

      <DuplicateDialog
        duplicates={duplicates}
        onClose={() => { setDuplicates([]); setPendingPayload(null); }}
        onForceCreate={handleForceCreate}
      />

      <ClientDetailDialog
        selectedClient={selectedClient}
        editClientMode={editClientMode}
        editClientForm={editClientForm}
        onEditClientFormChange={setEditClientForm}
        onOpenEditClientMode={openEditClientMode}
        onUpdateClient={handleUpdateClient}
        onCancelEdit={() => setEditClientMode(false)}
        onClose={() => { setSelectedClient(null); setEditClientMode(false); }}
        carDialogOpen={carDialogOpen}
        onCarDialogOpenChange={setCarDialogOpen}
        carForm={carForm}
        onCarFormChange={setCarForm}
        onAddCar={handleAddCar}
        onOpenAddCarDialog={openAddCarDialog}
        editCarDialogOpen={editCarDialogOpen}
        onEditCarDialogOpenChange={setEditCarDialogOpen}
        editCarForm={editCarForm}
        onEditCarFormChange={setEditCarForm}
        onUpdateCar={handleUpdateCar}
        onOpenEditCarDialog={openEditCarDialog}
        onDeleteCar={handleDeleteCar}
        onDeleteClient={handleDeleteClient}
      />
    </Layout>
  );
};

export default Clients;