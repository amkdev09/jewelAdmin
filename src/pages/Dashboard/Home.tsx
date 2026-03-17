import { useEffect, useState } from "react";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import PageMeta from "../../components/common/PageMeta";
import { analyticsApi } from "../../services/api";
import type { DashboardMetrics } from "../../services/api";

export default function Home() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState<
    { name?: string; totalSold?: number; totalRevenue?: number }[]
  >([]);
  const [topLoading, setTopLoading] = useState(true);

  useEffect(() => {
    analyticsApi
      .getDashboard()
      .then((res: { data: { success?: boolean; data?: DashboardMetrics } }) => {
        if (res.data.success && res.data.data) setMetrics(res.data.data);
      })
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    analyticsApi
      .getTopProducts({ limit: 10 })
      .then((res: { data: { success?: boolean; data?: unknown } }) => {
        if (res.data.success && Array.isArray(res.data.data)) {
          setTopProducts(
            (res.data.data as { name?: string; totalSold?: number; totalRevenue?: number }[]) ?? []
          );
        } else {
          setTopProducts([]);
        }
      })
      .catch(() => setTopProducts([]))
      .finally(() => setTopLoading(false));
  }, []);

  return (
    <>
      <PageMeta
        title="GLEESTAR Admin Dashboard"
        description="Jewellery admin dashboard – orders, revenue, and analytics"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6">
          <EcommerceMetrics data={metrics} loading={loading} />
          <MonthlySalesChart />
        </div>
        <div className="col-span-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
                Top Selling Products
              </h2>
            </div>
            {topLoading ? (
              <div className="mt-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
                  />
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                No top products to display yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {topProducts.map((p, index) => (
                  <div
                    key={`${p.name ?? "product"}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5 text-sm dark:border-gray-800"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-gray-800 dark:text-white/90">
                        {p.name ?? "Unnamed product"}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Sold: {p.totalSold ?? 0}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white/90">
                        {p.totalRevenue != null
                          ? new Intl.NumberFormat("en-IN", {
                              style: "currency",
                              currency: "INR",
                              maximumFractionDigits: 0,
                            }).format(p.totalRevenue)
                          : "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
