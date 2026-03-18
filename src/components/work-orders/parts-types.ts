import { PartItem } from "@/components/work-orders/types";

export type { PartItem };

export const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

export interface Product {
  id: number;
  sku: string;
  name: string;
  purchase_price: number;
  quantity: number;
  unit: string;
}

export interface AddPartPayload {
  product_id?: number;
  name: string;
  qty: number;
  price: number;
  purchase_price: number;
}

export interface AiPart {
  name: string;
  sku: string;
  category: string;
  qty: number;
  comment: string;
  selected: boolean;
  price: number;
  purchase_price: number;
  stockMatch?: Product | null;
}

export const emptyAddForm = { product_id: undefined as number | undefined, name: "", qty: 1, price: 0, purchase_price: 0 };

export function matchStock(aiPart: { name: string; sku: string }, products: Product[]): Product | null {
  const nameLow = aiPart.name.toLowerCase().trim();
  const skuLow = aiPart.sku.toLowerCase().trim();

  if (skuLow) {
    const bysku = products.find((p) => p.sku.toLowerCase().trim() === skuLow);
    if (bysku) return bysku;
    const byskuPartial = products.find((p) => p.sku.toLowerCase().includes(skuLow) || skuLow.includes(p.sku.toLowerCase()));
    if (byskuPartial) return byskuPartial;
  }

  if (nameLow.length >= 4) {
    const byName = products.find((p) => p.name.toLowerCase().includes(nameLow) || nameLow.includes(p.name.toLowerCase()));
    if (byName) return byName;

    const words = nameLow.split(/\s+/).filter((w) => w.length >= 4);
    if (words.length >= 2) {
      const byWords = products.find((p) => {
        const pLow = p.name.toLowerCase();
        return words.filter((w) => pLow.includes(w)).length >= Math.min(2, Math.floor(words.length * 0.6));
      });
      if (byWords) return byWords;
    }
  }

  return null;
}
