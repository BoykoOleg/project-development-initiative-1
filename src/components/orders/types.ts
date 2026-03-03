export interface Car {
  id: number;
  brand: string;
  model: string;
  year: string;
  vin: string;
  license_plate?: string;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  cars: Car[];
}

export interface Order {
  id: number;
  number: string;
  date: string;
  client: string;
  client_id?: number;
  phone: string;
  car: string;
  service: string;
  status: "new" | "contacted" | "approved" | "rejected";
  comment: string;
}

export const statusConfig: Record<string, { label: string; className: string }> = {
  new: { label: "Новая", className: "bg-purple-100 text-purple-700" },
  contacted: { label: "Связались", className: "bg-blue-100 text-blue-700" },
  approved: { label: "Одобрена", className: "bg-green-100 text-green-700" },
  rejected: { label: "Отклонена", className: "bg-red-100 text-red-700" },
};
