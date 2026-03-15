import api from "../../utils/axios";

const BASE = "/admin/inventory";

export interface InventoryListParams {
  page?: number;
  limit?: number;
  productId?: string;
  variantId?: string;
  lowStock?: boolean;
}

export interface CreateInventoryBody {
  productId: string;
  variantId: string;
  sku?: string;
  stockAvailable?: number;
  stockReserved?: number;
  reorderLevel?: number;
  warehouseLocation?: string;
}

export interface UpdateInventoryBody {
  stockAvailable?: number;
  reorderLevel?: number;
  warehouseLocation?: string;
  notes?: string;
}

export interface AddStockBody {
  quantity: number;
  reason: string;
  notes?: string;
}

export interface RemoveStockBody {
  quantity: number;
  reason: string;
  notes?: string;
}

export interface InventoryItem {
  _id: string;
  productId: string | { _id: string; name?: string; slug?: string };
  variantId: string | Record<string, unknown>;
  sku?: string;
  stockAvailable?: number;
  stockReserved?: number;
  reorderLevel?: number;
  warehouseLocation?: string;
  lastRestocked?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryHistoryItem {
  _id: string;
  changeType?: string;
  quantity?: number;
  description?: string;
  previousStockAvailable?: number;
  newStockAvailable?: number;
  createdAt?: string;
}

export const inventoryApi = {
  list: (params?: InventoryListParams) =>
    api.get<{
      success: boolean;
      data: {
        items: InventoryItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(BASE, { params }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: InventoryItem }>(`${BASE}/${id}`),

  create: (body: CreateInventoryBody) =>
    api.post<{ success: boolean; data: InventoryItem }>(BASE, body, {
      headers: { "Content-Type": "application/json" },
    }),

  update: (id: string, body: UpdateInventoryBody) =>
    api.put<{ success: boolean; data: InventoryItem }>(`${BASE}/${id}`, body, {
      headers: { "Content-Type": "application/json" },
    }),

  delete: (id: string) =>
    api.delete<{ success: boolean; message?: string }>(`${BASE}/${id}`),

  addStock: (id: string, body: AddStockBody) =>
    api.post<{ success: boolean; data: InventoryItem }>(
      `${BASE}/${id}/add-stock`,
      body,
      { headers: { "Content-Type": "application/json" } }
    ),

  removeStock: (id: string, body: RemoveStockBody) =>
    api.post<{ success: boolean; data: InventoryItem }>(
      `${BASE}/${id}/remove-stock`,
      body,
      { headers: { "Content-Type": "application/json" } }
    ),

  getHistory: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<{
      success: boolean;
      data: {
        items: InventoryHistoryItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`${BASE}/${id}/history`, { params }),
};
