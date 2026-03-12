import api from "../../utils/axios";

const BASE = "/admin/user";

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
}

export const userApi = {
  list: (params?: UserListParams) =>
    api.get<{
      success: boolean;
      data: { items: unknown[]; total: number; page: number; limit: number; totalPages: number };
    }>(BASE, { params }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: unknown }>(`${BASE}/${id}`),

  update: (id: string, body: Record<string, unknown>) =>
    api.put<{ success: boolean; data: unknown }>(`${BASE}/${id}`, body),
};
