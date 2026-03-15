import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import { orderApi } from "../../services/api";
import type { OrderStatus } from "../../services/api";

interface Order {
  _id: string;
  orderNumber?: string;
  userId?: { name?: string; email?: string; phone?: string };
  totalAmount?: number;
  finalAmount?: number;
  orderStatus?: string;
  paymentStatus?: string;
  createdAt?: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function orderBadgeColor(status: string) {
  switch (status) {
    case "delivered":
      return "success";
    case "shipped":
    case "processing":
    case "confirmed":
      return "warning";
    case "cancelled":
      return "error";
    default:
      return "warning";
  }
}

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function Orders() {
  const [items, setItems] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const limit = 10;

  const fetchOrders = () => {
    setLoading(true);
    orderApi
      .list({
        page,
        limit,
        sortBy: "latest",
        ...(statusFilter ? { orderStatus: statusFilter as OrderStatus } : {}),
      })
      .then((res: { data: { success?: boolean; data?: { items?: Order[]; total?: number } } }) => {
        if (res.data.success && res.data.data) {
          const d = res.data.data as { items: Order[]; total: number };
          setItems(d.items ?? []);
          setTotal(d.total ?? 0);
        }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const updateStatus = (id: string, orderStatus: OrderStatus, trackingNumber?: string) => {
    orderApi
      .updateStatus(id, { orderStatus, trackingNumber })
      .then(() => fetchOrders())
      .catch((err: unknown) =>
        alert((err as { message?: string })?.message ?? "Update failed")
      );
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <>
      <PageMeta title="Orders | Admin" description="Manage orders" />
      <PageBreadCrumb pageTitle="Orders" />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            All Orders
          </h2>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <Table className="w-full table-fixed">
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y bg-gray-50/80 dark:bg-gray-800/40">
                <TableRow>
                  <TableCell
                    isHeader
                    className="w-[24%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Order
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[26%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Customer
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[18%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Amount
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[18%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Order Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[14%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Payment
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="px-4 py-2.5 text-left align-middle">
                        <Link
                          to={`/admin/orders/${order._id}`}
                          className="font-medium text-brand-500 hover:underline"
                        >
                          {order.orderNumber ?? order._id}
                        </Link>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {order.userId?.name ?? order.userId?.email ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {formatCurrency(order.finalAmount ?? order.totalAmount ?? 0)}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle">
                        <select
                          value={order.orderStatus ?? "pending"}
                          onChange={(e) =>
                            updateStatus(
                              order._id,
                              e.target.value as OrderStatus
                            )
                          }
                          className="rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle">
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-800 p-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}
