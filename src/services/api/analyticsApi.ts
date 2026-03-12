import api from "../../utils/axios";

const BASE = "/admin/analytics";

export interface DashboardMetrics {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
}

export const analyticsApi = {
  getDashboard: () =>
    api.get<{ success: boolean; data: DashboardMetrics }>(`${BASE}/dashboard`),

  getSales: (params: { startDate: string; endDate: string; groupBy?: string }) =>
    api.get<{ success: boolean; data: unknown }>(`${BASE}/sales`, { params }),

  getTopProducts: (params?: { limit?: number; startDate?: string; endDate?: string }) =>
    api.get<{ success: boolean; data: unknown }>(`${BASE}/products`, { params }),
};
