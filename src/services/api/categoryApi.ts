import api from "../../utils/axios";

const BASE = "/admin/category";

export interface CategoryListParams {
  page?: number;
  limit?: number;
  parentCategory?: string | null;
  isActive?: boolean;
  includeSubcategories?: boolean;
}

export interface CategoryBody {
  name: string;
  slug?: string;
  description?: string | null;
  parentCategory?: string | null;
  isActive?: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentCategory?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const categoryApi = {
  list: (params?: CategoryListParams) =>
    api.get<{
      success: boolean;
      data: { items: Category[]; total: number; page: number; limit: number; totalPages: number };
    }>(BASE, { params }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: Category }>(`${BASE}/${id}`),

  create: (body: CategoryBody) =>
    api.post<{ success: boolean; data: Category }>(BASE, body, {
      headers: { "Content-Type": "application/json" },
    }),

  update: (id: string, body: Partial<CategoryBody>) =>
    api.put<{ success: boolean; data: Category }>(`${BASE}/${id}`, body, {
      headers: { "Content-Type": "application/json" },
    }),

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`${BASE}/${id}`),
};

