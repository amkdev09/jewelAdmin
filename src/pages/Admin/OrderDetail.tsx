import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import { orderApi } from "../../services/api";
import type { OrderStatus } from "../../services/api";

interface OrderDetailType {
  _id: string;
  orderNumber?: string;
  userId?: { name?: string; email?: string; phone?: string };
  items?: unknown[];
  totalAmount?: number;
  discountAmount?: number;
  finalAmount?: number;
  orderStatus?: string;
  paymentStatus?: string;
  trackingNumber?: string;
  createdAt?: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("pending");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    orderApi
      .getById(id)
      .then((res: { data: { success?: boolean; data?: unknown } }) => {
        if (res.data.success && res.data.data) {
          const o = res.data.data as OrderDetailType;
          setOrder(o);
          setOrderStatus((o.orderStatus as OrderStatus) ?? "pending");
          setTrackingNumber(o.trackingNumber ?? "");
        }
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    orderApi
      .updateStatus(id, { orderStatus, trackingNumber: trackingNumber || undefined })
      .then(() => {
        if (order) setOrder({ ...order, orderStatus, trackingNumber });
        alert("Order status updated.");
      })
      .catch((err: unknown) =>
        alert((err as { message?: string })?.message ?? "Update failed")
      )
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="mt-6 h-32 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <>
        <PageBreadCrumb pageTitle="Order" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-gray-500 dark:text-gray-400">Order not found.</p>
          <Link to="/admin/orders" className="mt-4 inline-block text-brand-500 hover:underline">
            Back to Orders
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title={`Order ${order.orderNumber ?? order._id} | Admin`} description="Order details" />
      <PageBreadCrumb pageTitle={`Order ${order.orderNumber ?? order._id}`} />
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {order.orderNumber ?? order._id}
            </h2>
            <Link to="/admin/orders">
              <Button size="sm" className="bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700">
                Back to Orders
              </Button>
            </Link>
          </div>
          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Customer</dt>
              <dd className="font-medium text-gray-800 dark:text-white/90">
                {order.userId?.name ?? "—"}
              </dd>
              <dd className="text-sm text-gray-500 dark:text-gray-400">
                {order.userId?.email ?? "—"}
              </dd>
              <dd className="text-sm text-gray-500 dark:text-gray-400">
                {order.userId?.phone ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Amount</dt>
              <dd className="font-medium text-gray-800 dark:text-white/90">
                {formatCurrency(order.finalAmount ?? order.totalAmount ?? 0)}
              </dd>
              {order.discountAmount != null && order.discountAmount > 0 && (
                <dd className="text-sm text-gray-500 dark:text-gray-400">
                  Discount: {formatCurrency(order.discountAmount)}
                </dd>
              )}
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Order status</dt>
              <dd>
                <Badge
                  size="sm"
                  color={
                    order.orderStatus === "delivered"
                      ? "success"
                      : order.orderStatus === "cancelled"
                      ? "error"
                      : "warning"
                  }
                >
                  {order.orderStatus ?? "pending"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Payment status</dt>
              <dd>
                <Badge
                  size="sm"
                  color={
                    order.paymentStatus === "paid"
                      ? "success"
                      : order.paymentStatus === "failed"
                      ? "error"
                      : "warning"
                  }
                >
                  {order.paymentStatus ?? "pending"}
                </Badge>
              </dd>
            </div>
            {order.createdAt && (
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Date</dt>
                <dd className="text-gray-800 dark:text-white/90">
                  {new Date(order.createdAt).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <form
          onSubmit={handleUpdateStatus}
          className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Update status
          </h3>
          <div className="mt-4 flex flex-wrap gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Order status
              </label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tracking number
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Optional"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Updating…" : "Update"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
