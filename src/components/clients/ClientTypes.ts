export interface Car {
  id?: number;
  brand: string;
  model: string;
  year: string;
  vin: string;
  license_plate?: string;
}

export interface Client {
  id?: number;
  name: string;
  phone: string;
  email: string;
  comment: string;
  cars: Car[];
  created_at?: string;
}

export interface Duplicate {
  field: "phone" | "name" | "vin" | "license_plate";
  client_id: number;
  client_name: string;
  client_phone: string;
  vin?: string;
  license_plate?: string;
}

export const FIELD_LABELS: Record<string, string> = {
  phone: "телефон",
  name: "ФИО",
  vin: "VIN",
  license_plate: "гос. номер",
};
