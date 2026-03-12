import { Link } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

interface OrderItem {
  _id: string;
  orderNumber?: string;
  userId?: { name?: string; email?: string; phone?: string };
  totalAmount?: number;
  finalAmount?: number;
  orderStatus?: string;
  paymentStatus?: string;
  createdAt?: string;
}

interface RecentOrdersProps {
  orders?: OrderItem[];
  loading?: boolean;
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

export default function RecentOrders({ orders = [], loading }: RecentOrdersProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Orders
          </h3>
        </div>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        >
          See all
        </Link>
      </div>
      <div className="max-w-full overflow-x-auto">
        {loading ? (
          <div className="py-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Order
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Customer
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Amount
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Status
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No orders yet
                  </TableCell>
                </TableRow>
              ) : (
                (orders as OrderItem[]).map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="py-3">
                      <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {order.orderNumber ?? order._id}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {order.userId?.name ?? order.userId?.email ?? "—"}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {formatCurrency(order.finalAmount ?? order.totalAmount ?? 0)}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        size="sm"
                        color={orderBadgeColor((order.orderStatus ?? "").toLowerCase())}
                      >
                        {order.orderStatus ?? "pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
