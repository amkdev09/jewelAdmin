import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import { couponApi } from "../../services/api";
import { PlusIcon } from "../../icons";

interface Coupon {
  _id: string;
  code?: string;
  discountType?: string;
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  expiryDate?: string;
  usageLimit?: number;
  isActive?: boolean;
}

export default function Coupons() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 50,
    minOrderAmount: 10000,
    maxDiscount: 5000,
    expiryDate: "",
    usageLimit: 100,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = () => {
    setLoading(true);
    couponApi
      .list({ limit: 50 })
      .then((res) => {
        if (res.data.success && res.data.data) {
          const d = res.data.data as { items: Coupon[] };
          setItems(d.items ?? []);
        }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.expiryDate) {
      alert("Code and expiry date are required.");
      return;
    }
    setSubmitting(true);
    couponApi
      .create({
        ...form,
        expiryDate: new Date(form.expiryDate).toISOString(),
      })
      .then(() => {
        setShowForm(false);
        setForm({
          code: "",
          discountType: "percentage",
          discountValue: 50,
          minOrderAmount: 10000,
          maxDiscount: 5000,
          expiryDate: "",
          usageLimit: 100,
          isActive: true,
        });
        fetchCoupons();
      })
      .catch((err) =>
        alert((err as { message?: string })?.message ?? "Create failed")
      )
      .finally(() => setSubmitting(false));
  };

  return (
    <>
      <PageMeta title="Coupons | Admin" description="Manage coupons" />
      <PageBreadCrumb pageTitle="Coupons" />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Coupons
          </h2>
          <Button
            size="sm"
            className="inline-flex items-center gap-2"
            onClick={() => setShowForm(!showForm)}
          >
            <PlusIcon className="size-5" />
            Add Coupon
          </Button>
        </div>
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="border-t border-gray-200 dark:border-gray-800 p-4 sm:p-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <input
              required
              placeholder="Code (e.g. SAVE50)"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <select
              value={form.discountType}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  discountType: e.target.value as "percentage" | "fixed",
                }))
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
            <input
              type="number"
              required
              placeholder="Discount value"
              value={form.discountValue}
              onChange={(e) =>
                setForm((f) => ({ ...f, discountValue: Number(e.target.value) }))
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <input
              type="number"
              placeholder="Min order amount"
              value={form.minOrderAmount}
              onChange={(e) =>
                setForm((f) => ({ ...f, minOrderAmount: Number(e.target.value) }))
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <input
              type="number"
              placeholder="Max discount"
              value={form.maxDiscount}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxDiscount: Number(e.target.value) }))
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <input
              type="datetime-local"
              required
              value={form.expiryDate}
              onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <input
              type="number"
              placeholder="Usage limit"
              value={form.usageLimit}
              onChange={(e) =>
                setForm((f) => ({ ...f, usageLimit: Number(e.target.value) }))
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Creating…" : "Create Coupon"}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
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
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Code
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Discount
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Min / Max
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Expiry
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
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No coupons yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="py-3 font-medium text-gray-800 dark:text-white/90">
                        {c.code}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 dark:text-gray-400">
                        {c.discountType === "percentage"
                          ? `${c.discountValue}%`
                          : `₹${c.discountValue}`}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 dark:text-gray-400">
                        ₹{c.minOrderAmount} / ₹{c.maxDiscount}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 dark:text-gray-400">
                        {c.expiryDate
                          ? new Date(c.expiryDate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          size="sm"
                          color={c.isActive !== false ? "success" : "error"}
                        >
                          {c.isActive !== false ? "Active" : "Inactive"}
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
    </>
  );
}
