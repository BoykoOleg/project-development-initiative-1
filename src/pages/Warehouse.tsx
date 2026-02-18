import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";
import WarehouseProductsTab, { Product } from "@/components/warehouse/WarehouseProductsTab";
import WarehouseSuppliersTab, { Supplier } from "@/components/warehouse/WarehouseSuppliersTab";
import WarehouseReceiptsTab, { Receipt } from "@/components/warehouse/WarehouseReceiptsTab";

interface Dashboard {
  total_products: number;
  total_quantity: number;
  total_value: number;
  low_stock: number;
  total_suppliers: number;
  total_receipts: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

const Warehouse = () => {
  const [tab, setTab] = useState<"products" | "suppliers" | "receipts">("products");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  const api = async (params: string) => {
    const url = getApiUrl("warehouse");
    if (!url) return null;
    const res = await fetch(`${url}?${params}`);
    return res.json();
  };

  const apiPost = async (body: Record<string, unknown>) => {
    const url = getApiUrl("warehouse");
    if (!url) return null;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const fetchAll = async () => {
    try {
      const [d, p, s, r] = await Promise.all([
        api("section=dashboard"),
        api("section=products"),
        api("section=suppliers"),
        api("section=receipts"),
      ]);
      if (d) setDashboard(d);
      if (p?.products) setProducts(p.products);
      if (s?.suppliers) setSuppliers(s.suppliers);
      if (r?.receipts) setReceipts(r.receipts);
    } catch {
      toast.error("Ошибка загрузки склада");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSaveProduct = async (form: Record<string, unknown>, editingId?: number) => {
    if (!(form.sku as string)?.trim() || !(form.name as string)?.trim()) {
      toast.error("Укажите артикул и название");
      return;
    }
    try {
      const body: Record<string, unknown> = editingId
        ? { action: "update_product", product_id: editingId, ...form }
        : { action: "create_product", ...form };
      const data = await apiPost(body);
      if (data?.error) { toast.error(data.error); return; }
      toast.success(editingId ? "Товар обновлён" : "Товар добавлен");
      fetchAll();
    } catch {
      toast.error("Ошибка сохранения товара");
    }
  };

  const handleSaveSupplier = async (form: Record<string, unknown>, editingId?: number) => {
    if (!(form.name as string)?.trim()) { toast.error("Укажите название поставщика"); return; }
    try {
      const body: Record<string, unknown> = editingId
        ? { action: "update_supplier", supplier_id: editingId, ...form }
        : { action: "create_supplier", ...form };
      const data = await apiPost(body);
      if (data?.error) { toast.error(data.error); return; }
      toast.success(editingId ? "Поставщик обновлён" : "Поставщик добавлен");
      fetchAll();
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  const handleCreateReceipt = async (payload: { supplier_id: number | null; document_number: string; document_date: string | null; notes: string; items: { product_id: number; quantity: number; price: number }[] }) => {
    if (payload.items.length === 0) { toast.error("Добавьте хотя бы один товар"); return; }
    try {
      const data = await apiPost({ action: "create_receipt", ...payload });
      if (data?.error) { toast.error(data.error); return; }
      toast.success("Поступление оформлено");
      fetchAll();
    } catch {
      toast.error("Ошибка оформления поступления");
    }
  };

  return (
    <Layout title="Склад">
      <div className="space-y-6">
        {dashboard && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Товаров" value={String(dashboard.total_products)} icon="Package" color="blue" />
            <StatCard title="Общее кол-во" value={String(dashboard.total_quantity)} icon="Layers" color="green" />
            <StatCard title="Стоимость склада" value={fmt(dashboard.total_value)} icon="DollarSign" color="purple" />
            <StatCard
              title="Мало на складе"
              value={String(dashboard.low_stock)}
              icon="AlertTriangle"
              color={dashboard.low_stock > 0 ? "orange" : "green"}
            />
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {([
            { key: "products", label: "Номенклатура", icon: "Package" },
            { key: "receipts", label: "Поступления", icon: "FileInput" },
            { key: "suppliers", label: "Поставщики", icon: "Truck" },
          ] as const).map((t) => (
            <Button
              key={t.key}
              variant={tab === t.key ? "default" : "outline"}
              size="sm"
              className={tab === t.key ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
              onClick={() => setTab(t.key)}
            >
              <Icon name={t.icon} size={16} className="mr-1.5" />
              {t.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Загрузка...</div>
        ) : tab === "products" ? (
          <WarehouseProductsTab products={products} onSave={handleSaveProduct} />
        ) : tab === "receipts" ? (
          <WarehouseReceiptsTab receipts={receipts} products={products} suppliers={suppliers} onCreate={handleCreateReceipt} />
        ) : tab === "suppliers" ? (
          <WarehouseSuppliersTab suppliers={suppliers} onSave={handleSaveSupplier} />
        ) : null}
      </div>
    </Layout>
  );
};

const StatCard = ({ title, value, icon, color }: {
  title: string; value: string; icon: string; color: string;
}) => {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-500",
    green: "bg-green-50 text-green-500",
    purple: "bg-purple-50 text-purple-500",
    orange: "bg-orange-50 text-orange-500",
  };
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon name={icon} size={20} />
        </div>
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{title}</div>
    </div>
  );
};

export default Warehouse;
