import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Product } from "@/components/warehouse/WarehouseProductsTab";
import { Supplier } from "@/components/warehouse/WarehouseSuppliersTab";
import ReceiptRow from "@/components/warehouse/ReceiptRow";
import ReceiptFormDialog from "@/components/warehouse/ReceiptFormDialog";

export interface Receipt {
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
  is_paid?: boolean;
  paid_amount?: number;
}

interface ReceiptPayload {
  supplier_id: number | null;
  document_number: string;
  document_date: string | null;
  notes: string;
  items: { product_id: number; quantity: number; price: number }[];
}

interface Props {
  receipts: Receipt[];
  products: Product[];
  suppliers: Supplier[];
  onCreate: (payload: ReceiptPayload) => Promise<void>;
}

const emptyForm = {
  supplier_id: "",
  document_number: "",
  document_date: new Date().toISOString().slice(0, 10),
  notes: "",
};

const emptyItems = [{ product_id: 0, quantity: 1, price: 0 }];

const WarehouseReceiptsTab = ({ receipts, products, suppliers, onCreate }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const openCreate = () => {
    setFormKey((k) => k + 1);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={openCreate}>
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
            <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={openCreate}>
              <Icon name="FileInput" size={16} className="mr-1.5" />
              Оформить поступление
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {receipts.map((r) => (
              <ReceiptRow key={r.id} receipt={r} />
            ))}
          </div>
        )}
      </div>

      <ReceiptFormDialog
        key={formKey}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        products={products}
        suppliers={suppliers}
        onCreate={onCreate}
        initialForm={emptyForm}
        initialItems={emptyItems}
      />
    </>
  );
};

export default WarehouseReceiptsTab;
