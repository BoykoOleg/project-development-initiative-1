import { useState, useEffect } from "react";
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
import Layout from "@/components/Layout";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";

interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  purchase_price: number;
  quantity: number;
  min_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  inn: string;
  address: string;
  notes: string;
  is_active: boolean;
  receipt_count: number;
  total_supplied: number;
}

interface Receipt {
  id: number;
  receipt_number: string;
  supplier_id: number | null;
  supplier_name: string | null;
  document_number: string;
  document_date: string;
  total_amount: number;
  notes: string;
  item_count: number;
  created_at: string;
}

interface ReceiptItem {
  product_id: number;
  quantity: number;
  price: number;
}

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
  const [search, setSearch] = useState("");

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    sku: "", name: "", description: "", category: "", unit: "шт",
    purchase_price: 0, quantity: 0, min_quantity: 0,
  });

  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: "", contact_person: "", phone: "", email: "", inn: "", address: "", notes: "",
  });

  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptForm, setReceiptForm] = useState({
    supplier_id: "", document_number: "", document_date: "", notes: "",
  });
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([{ product_id: 0, quantity: 1, price: 0 }]);

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

  // ========== PRODUCTS ==========
  const openCreateProduct = () => {
    setEditingProduct(null);
    const nextNum = products.length + 1;
    setProductForm({
      sku: String(nextNum).padStart(4, "0"), name: "", description: "", category: "",
      unit: "шт", purchase_price: 0, quantity: 0, min_quantity: 0,
    });
    setProductDialogOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      sku: p.sku, name: p.name, description: p.description, category: p.category,
      unit: p.unit, purchase_price: Number(p.purchase_price), quantity: p.quantity, min_quantity: p.min_quantity,
    });
    setProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.sku.trim() || !productForm.name.trim()) {
      toast.error("Укажите артикул и название");
      return;
    }
    try {
      const body: Record<string, unknown> = editingProduct
        ? { action: "update_product", product_id: editingProduct.id, ...productForm }
        : { action: "create_product", ...productForm };
      const data = await apiPost(body);
      if (data?.error) { toast.error(data.error); return; }
      toast.success(editingProduct ? "Товар обновлён" : "Товар добавлен");
      setProductDialogOpen(false);
      fetchAll();
    } catch {
      toast.error("Ошибка сохранения товара");
    }
  };

  // ========== SUPPLIERS ==========
  const openCreateSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({ name: "", contact_person: "", phone: "", email: "", inn: "", address: "", notes: "" });
    setSupplierDialogOpen(true);
  };

  const openEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierForm({
      name: s.name, contact_person: s.contact_person, phone: s.phone,
      email: s.email, inn: s.inn, address: s.address, notes: s.notes,
    });
    setSupplierDialogOpen(true);
  };

  const handleSaveSupplier = async () => {
    if (!supplierForm.name.trim()) { toast.error("Укажите название поставщика"); return; }
    try {
      const body: Record<string, unknown> = editingSupplier
        ? { action: "update_supplier", supplier_id: editingSupplier.id, ...supplierForm }
        : { action: "create_supplier", ...supplierForm };
      const data = await apiPost(body);
      if (data?.error) { toast.error(data.error); return; }
      toast.success(editingSupplier ? "Поставщик обновлён" : "Поставщик добавлен");
      setSupplierDialogOpen(false);
      fetchAll();
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  // ========== RECEIPTS ==========
  const openCreateReceipt = () => {
    setReceiptForm({ supplier_id: "", document_number: "", document_date: new Date().toISOString().slice(0, 10), notes: "" });
    setReceiptItems([{ product_id: 0, quantity: 1, price: 0 }]);
    setReceiptDialogOpen(true);
  };

  const addReceiptItem = () => {
    setReceiptItems((prev) => [...prev, { product_id: 0, quantity: 1, price: 0 }]);
  };

  const removeReceiptItem = (idx: number) => {
    setReceiptItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateReceiptItem = (idx: number, field: keyof ReceiptItem, value: number) => {
    setReceiptItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleCreateReceipt = async () => {
    const validItems = receiptItems.filter((i) => i.product_id && i.quantity > 0);
    if (validItems.length === 0) { toast.error("Добавьте хотя бы один товар"); return; }
    try {
      const body: Record<string, unknown> = {
        action: "create_receipt",
        supplier_id: receiptForm.supplier_id ? Number(receiptForm.supplier_id) : null,
        document_number: receiptForm.document_number,
        document_date: receiptForm.document_date || null,
        notes: receiptForm.notes,
        items: validItems,
      };
      const data = await apiPost(body);
      if (data?.error) { toast.error(data.error); return; }
      toast.success("Поступление оформлено");
      setReceiptDialogOpen(false);
      fetchAll();
    } catch {
      toast.error("Ошибка оформления поступления");
    }
  };

  const receiptTotal = receiptItems.reduce((s, i) => s + i.quantity * i.price, 0);

  const filteredProducts = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <Layout title="Склад">
      <div className="space-y-6">
        {/* Stats */}
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

        {/* Tabs */}
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
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Поиск по артикулу, названию..." className="pl-9 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={openCreateProduct}>
                <Icon name="Plus" size={16} className="mr-1.5" />
                Добавить товар
              </Button>
            </div>

            {products.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-12 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Package" size={28} className="text-blue-500" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Товаров пока нет</h3>
                <p className="text-sm text-muted-foreground mb-4">Добавьте первый товар в номенклатуру</p>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={openCreateProduct}>
                  <Icon name="Plus" size={16} className="mr-1.5" />
                  Добавить товар
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Артикул</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Наименование</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Категория</th>
                        <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Цена вх.</th>
                        <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Кол-во</th>
                        <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 hidden sm:table-cell">Сумма</th>
                        <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => {
                        const isLow = p.quantity <= p.min_quantity && p.min_quantity > 0;
                        return (
                          <tr
                            key={p.id}
                            className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                            onClick={() => openEditProduct(p)}
                          >
                            <td className="px-5 py-3.5">
                              <span className="text-sm font-mono font-medium text-blue-600">{p.sku}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="text-sm font-medium text-foreground">{p.name}</div>
                              {p.description && (
                                <div className="text-xs text-muted-foreground truncate max-w-[250px]">{p.description}</div>
                              )}
                            </td>
                            <td className="px-5 py-3.5 hidden md:table-cell">
                              {p.category ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  {p.category}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right text-sm">{fmt(Number(p.purchase_price))}</td>
                            <td className="px-5 py-3.5 text-right">
                              <span className={`text-sm font-semibold ${isLow ? "text-red-600" : "text-foreground"}`}>
                                {p.quantity} {p.unit}
                              </span>
                              {isLow && (
                                <div className="text-xs text-red-500">мин. {p.min_quantity}</div>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right text-sm font-medium hidden sm:table-cell">
                              {fmt(Number(p.purchase_price) * p.quantity)}
                            </td>
                            <td className="px-3 py-3.5 text-center">
                              <Button
                                variant="ghost" size="sm" className="h-7 w-7 p-0"
                                onClick={(e) => { e.stopPropagation(); openEditProduct(p); }}
                              >
                                <Icon name="Pencil" size={14} className="text-muted-foreground" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredProducts.length === 0 && search && (
                  <div className="text-center py-8 text-sm text-muted-foreground">Ничего не найдено</div>
                )}
              </div>
            )}
          </div>
        ) : tab === "receipts" ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={openCreateReceipt}>
                <Icon name="FileInput" size={16} className="mr-1.5" />
                Новое поступление
              </Button>
            </div>

            {receipts.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-12 text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="FileInput" size={28} className="text-green-500" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Поступлений пока нет</h3>
                <p className="text-sm text-muted-foreground mb-4">Оформите приход товара на склад</p>
                <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={openCreateReceipt}>
                  <Icon name="FileInput" size={16} className="mr-1.5" />
                  Оформить поступление
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Номер</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Дата</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden sm:table-cell">Поставщик</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Документ</th>
                        <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 hidden sm:table-cell">Позиций</th>
                        <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipts.map((r) => (
                        <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-medium text-green-600">{r.receipt_number}</span>
                          </td>
                          <td className="px-5 py-3.5 text-sm">
                            {r.document_date ? new Date(r.document_date).toLocaleDateString("ru-RU") : new Date(r.created_at).toLocaleDateString("ru-RU")}
                          </td>
                          <td className="px-5 py-3.5 text-sm hidden sm:table-cell">{r.supplier_name || "—"}</td>
                          <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell">{r.document_number || "—"}</td>
                          <td className="px-5 py-3.5 text-sm text-right hidden sm:table-cell">{r.item_count}</td>
                          <td className="px-5 py-3.5 text-sm font-semibold text-right text-green-600">+{fmt(Number(r.total_amount))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : tab === "suppliers" ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={openCreateSupplier}>
                <Icon name="Plus" size={16} className="mr-1.5" />
                Добавить поставщика
              </Button>
            </div>

            {suppliers.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-12 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Truck" size={28} className="text-blue-500" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Поставщиков пока нет</h3>
                <p className="text-sm text-muted-foreground mb-4">Добавьте контрагентов для приёмки товара</p>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={openCreateSupplier}>
                  <Icon name="Plus" size={16} className="mr-1.5" />
                  Добавить поставщика
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white rounded-xl border border-border p-5 space-y-3 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openEditSupplier(s)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Icon name="Truck" size={20} className="text-blue-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{s.name}</div>
                          {s.contact_person && <div className="text-xs text-muted-foreground">{s.contact_person}</div>}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {s.is_active ? "Активен" : "Неактивен"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {s.phone && <span><Icon name="Phone" size={12} className="inline mr-1" />{s.phone}</span>}
                      {s.inn && <span>ИНН: {s.inn}</span>}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">{s.receipt_count} поступлений</span>
                      <span className="text-sm font-semibold">{fmt(Number(s.total_supplied))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Диалог товара */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Карточка товара" : "Новый товар"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Артикул (код) *</label>
                <Input
                  value={productForm.sku}
                  onChange={(e) => setProductForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="0001"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ед. измерения</label>
                <Select value={productForm.unit} onValueChange={(v) => setProductForm((f) => ({ ...f, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="шт">шт</SelectItem>
                    <SelectItem value="м">м</SelectItem>
                    <SelectItem value="м²">м²</SelectItem>
                    <SelectItem value="кг">кг</SelectItem>
                    <SelectItem value="л">л</SelectItem>
                    <SelectItem value="компл">компл</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Наименование *</label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Плёнка защитная PPF 152см"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Описание</label>
              <Input
                value={productForm.description}
                onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Дополнительная информация"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Категория</label>
              <Input
                value={productForm.category}
                onChange={(e) => setProductForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Плёнки, расходники, инструмент..."
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Цена входная</label>
                <Input
                  type="number"
                  value={productForm.purchase_price || ""}
                  onChange={(e) => setProductForm((f) => ({ ...f, purchase_price: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Кол-во</label>
                <Input
                  type="number"
                  value={productForm.quantity || ""}
                  onChange={(e) => setProductForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Мин. остаток</label>
                <Input
                  type="number"
                  value={productForm.min_quantity || ""}
                  onChange={(e) => setProductForm((f) => ({ ...f, min_quantity: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
            </div>

            {editingProduct && (
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <div>Создан: {new Date(editingProduct.created_at).toLocaleDateString("ru-RU")}</div>
                <div>Обновлён: {new Date(editingProduct.updated_at).toLocaleDateString("ru-RU")}</div>
                <div>Стоимость на складе: {fmt(Number(editingProduct.purchase_price) * editingProduct.quantity)}</div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setProductDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleSaveProduct}>
                {editingProduct ? "Сохранить" : "Добавить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог поставщика */}
      <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Редактировать поставщика" : "Новый поставщик"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium">Название компании *</label>
              <Input
                value={supplierForm.name}
                onChange={(e) => setSupplierForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="ООО Плёнки Про"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Контактное лицо</label>
                <Input
                  value={supplierForm.contact_person}
                  onChange={(e) => setSupplierForm((f) => ({ ...f, contact_person: e.target.value }))}
                  placeholder="Иван Петров"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Телефон</label>
                <Input
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="info@supplier.ru"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ИНН</label>
                <Input
                  value={supplierForm.inn}
                  onChange={(e) => setSupplierForm((f) => ({ ...f, inn: e.target.value }))}
                  placeholder="7712345678"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Адрес</label>
              <Input
                value={supplierForm.address}
                onChange={(e) => setSupplierForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="г. Москва, ул. Ленина, 1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Заметки</label>
              <Input
                value={supplierForm.notes}
                onChange={(e) => setSupplierForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Дополнительная информация"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setSupplierDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleSaveSupplier}>
                {editingSupplier ? "Сохранить" : "Добавить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог поступления */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Новое поступление товара</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Поставщик</label>
                <Select value={receiptForm.supplier_id} onValueChange={(v) => setReceiptForm((f) => ({ ...f, supplier_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без поставщика</SelectItem>
                    {suppliers.filter((s) => s.is_active).map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Номер документа</label>
                <Input
                  value={receiptForm.document_number}
                  onChange={(e) => setReceiptForm((f) => ({ ...f, document_number: e.target.value }))}
                  placeholder="УПД-123"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Дата документа</label>
                <Input
                  type="date"
                  value={receiptForm.document_date}
                  onChange={(e) => setReceiptForm((f) => ({ ...f, document_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Товары</label>
                <Button variant="outline" size="sm" onClick={addReceiptItem}>
                  <Icon name="Plus" size={14} className="mr-1" />
                  Добавить строку
                </Button>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Товар</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2 w-20">Кол-во</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2 w-28">Цена</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2 w-28">Сумма</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">
                          <Select
                            value={String(item.product_id || "")}
                            onValueChange={(v) => {
                              const pid = Number(v);
                              updateReceiptItem(idx, "product_id", pid);
                              const prod = products.find((p) => p.id === pid);
                              if (prod) updateReceiptItem(idx, "price", Number(prod.purchase_price));
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Выберите товар" /></SelectTrigger>
                            <SelectContent>
                              {products.filter((p) => p.is_active).map((p) => (
                                <SelectItem key={p.id} value={String(p.id)}>{p.sku} — {p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            className="h-8 text-sm text-right"
                            value={item.quantity || ""}
                            onChange={(e) => updateReceiptItem(idx, "quantity", Number(e.target.value))}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            className="h-8 text-sm text-right"
                            value={item.price || ""}
                            onChange={(e) => updateReceiptItem(idx, "price", Number(e.target.value))}
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-medium">
                          {fmt(item.quantity * item.price)}
                        </td>
                        <td className="px-1 py-2">
                          {receiptItems.length > 1 && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeReceiptItem(idx)}>
                              <Icon name="X" size={14} className="text-red-400" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="bg-green-50 rounded-lg px-4 py-2">
                  <span className="text-sm text-muted-foreground mr-2">Итого:</span>
                  <span className="text-lg font-bold text-green-600">{fmt(receiptTotal)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Примечание</label>
              <Input
                value={receiptForm.notes}
                onChange={(e) => setReceiptForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Необязательно"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setReceiptDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={handleCreateReceipt}>
                <Icon name="FileInput" size={16} className="mr-1.5" />
                Оприходовать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
