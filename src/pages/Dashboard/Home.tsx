import { useEffect, useState } from "react";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import { analyticsApi, orderApi } from "../../services/api";
import type { DashboardMetrics } from "../../services/api";

export default function Home() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [orders, setOrders] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    analyticsApi
      .getDashboard()
      .then((res) => {
        if (res.data.success && res.data.data) setMetrics(res.data.data);
      })
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    orderApi
      .list({ limit: 5, sortBy: "latest" })
      .then((res) => {
        if (res.data.success && res.data.data?.items) setOrders(res.data.data.items);
      })
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, []);

  return (
    <>
      <PageMeta
        title="GLEESTAR Admin Dashboard"
        description="Jewellery admin dashboard – orders, revenue, and analytics"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics data={metrics} loading={loading} />

          <MonthlySalesChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders orders={orders} loading={ordersLoading} />
        </div>
      </div>
    </>
  );
}
