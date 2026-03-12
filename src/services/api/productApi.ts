import api from "../../utils/axios";

const BASE = "/admin/product";

export interface ProductListParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  metalType?: string;
  isActive?: boolean;
  sortBy?: "latest" | "price_asc" | "price_desc" | "name_asc" | "name_desc";
}

export interface ProductFormData {
  name: string;
  slug?: string;
  description?: string;
  categoryId: string;
  metalType?: string;
  metalColor?: string;
  purity?: string;
  goldWeight?: number;
  diamondWeight?: number;
  diamondType?: string;
  makingCharges?: number;
  gstRate?: number;
  tags?: string[] | string;
  images?: string[] | File[];
  isActive?: boolean;
}

export const productApi = {
  list: (params?: ProductListParams) =>
    api.get<{ success: boolean; data: { items: unknown[]; total: number; page: number; limit: number; totalPages: number } }>(BASE, { params }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: unknown }>(`${BASE}/${id}`),

  create: (data: FormData | ProductFormData) => {
    const isFormData = data instanceof FormData;
    return api.post<{ success: boolean; data: unknown }>(BASE, data, {
      headers: isFormData ? undefined : { "Content-Type": "application/json" },
    });
  },

  update: (id: string, data: FormData | Partial<ProductFormData>) => {
    const isFormData = data instanceof FormData;
    return api.put<{ success: boolean; data: unknown }>(`${BASE}/${id}`, data, {
      headers: isFormData ? undefined : { "Content-Type": "application/json" },
    });
  },

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`${BASE}/${id}`),

  reindex: () =>
    api.post<{ success: boolean; message: string; data: { indexed: number; failed: number } }>(`${BASE}/reindex`),
};
