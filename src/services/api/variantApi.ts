import api from "../../utils/axios";

const BASE = "/admin/variant";

export interface CreateVariantBody {
  productId: string;
  ringSize?: string;
  purity?: string;
  metalColor?: string;
  priceAdjustment?: number;
}

export interface UpdateVariantBody {
  ringSize?: string;
  purity?: string;
  metalColor?: string;
  priceAdjustment?: number;
}

export interface VariantInventoryRef {
  _id?: string;
  stockAvailable?: number;
  sku?: string;
}

export interface Variant {
  _id: string;
  productId: string;
  ringSize?: string;
  purity?: string;
  metalColor?: string;
  priceAdjustment?: number;
  inventoryId?: string | VariantInventoryRef;
  createdAt?: string;
  updatedAt?: string;
}

export const variantApi = {
  listByProduct: (productId: string) =>
    api.get<{ success: boolean; data: Variant[] }>(
      `${BASE}/product/${productId}`
    ),

  getById: (id: string) =>
    api.get<{ success: boolean; data: Variant }>(`${BASE}/${id}`),

  create: (body: CreateVariantBody) =>
    api.post<{ success: boolean; data: Variant }>(BASE, body, {
      headers: { "Content-Type": "application/json" },
    }),

  update: (id: string, body: UpdateVariantBody) =>
    api.put<{ success: boolean; data: Variant }>(`${BASE}/${id}`, body, {
      headers: { "Content-Type": "application/json" },
    }),

  delete: (id: string) =>
    api.delete<{ success: boolean; message?: string }>(`${BASE}/${id}`),
};
