import api from "../../utils/axios";

const BASE = "/admin/order";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed";

export interface OrderListParams {
  page?: number;
  limit?: number;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  userId?: string;
  sortBy?: "latest" | "amount_asc" | "amount_desc";
}

export interface UpdateOrderStatusBody {
  orderStatus?: OrderStatus;
  trackingNumber?: string;
}

export const orderApi = {
  list: (params?: OrderListParams) =>
    api.get<{
      success: boolean;
      data: {
        items: unknown[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(BASE, { params }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: unknown }>(`${BASE}/${id}`),

  updateStatus: (id: string, body: UpdateOrderStatusBody) =>
    api.put<{ success: boolean; data: unknown }>(`${BASE}/${id}/status`, body),
};
