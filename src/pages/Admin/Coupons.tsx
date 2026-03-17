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
import { Modal } from "../../components/ui/modal";
import Alert from "../../components/ui/alert/Alert";
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

type AlertVariant = "success" | "error" | "warning" | "info";
interface AlertState {
  variant: AlertVariant;
  title: string;
  message: string;
}

export default function Coupons() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
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
  const [alertState, setAlertState] = useState<AlertState | null>(null);

  const fetchCoupons = () => {
    setLoading(true);
    couponApi
      .list({ limit: 50 })
      .then((res: any) => {
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
    setAlertState(null);
    if (!form.code.trim() || !form.expiryDate) {
      setAlertState({
        variant: "warning",
        title: "Validation",
        message: "Code and expiry date are required.",
      });
      return;
    }
    setSubmitting(true);
    couponApi
      .create({
        ...form,
        expiryDate: new Date(form.expiryDate).toISOString(),
      })
      .then(() => {
        setModalOpen(false);
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
        setAlertState({
          variant: "success",
          title: "Success",
          message: "Coupon created.",
        });
      })
      .catch((err: unknown) => {
        setAlertState({
          variant: "error",
          title: "Error",
          message: (err as { message?: string })?.message ?? "Create failed",
        });
      })
      .finally(() => setSubmitting(false));
  };

  const openModal = () => {
    setAlertState(null);
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
    setModalOpen(true);
  };

  return (
    <>
      <PageMeta title="Coupons | Admin" description="Manage coupons" />
      <PageBreadCrumb pageTitle="Coupons" />
      {alertState && (
        <div className="relative mb-4">
          <Alert
            variant={alertState.variant}
            title={alertState.title}
            message={alertState.message}
          />
          <button
            type="button"
            onClick={() => setAlertState(null)}
            className="absolute right-3 top-3 rounded p-1 text-gray-500 hover:bg-gray-200/80 hover:text-gray-700 dark:hover:bg-gray-700/80 dark:hover:text-gray-300"
            aria-label="Dismiss"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Coupons
          </h2>
          <Button
            size="sm"
            className="inline-flex items-center gap-2"
            onClick={openModal}
          >
            <PlusIcon className="size-5 text-white fill-white" />
            Add Coupon
          </Button>
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
                    className="w-[22%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Code
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[18%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Discount
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[24%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Min / Max
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[22%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Expiry
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[14%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
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
                      className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No coupons yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="px-4 py-2.5 text-left align-middle font-medium text-gray-800 dark:text-white/90">
                        {c.code}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {c.discountType === "percentage"
                          ? `${c.discountValue}%`
                          : `₹${c.discountValue}`}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        ₹{c.minOrderAmount} / ₹{c.maxDiscount}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {c.expiryDate
                          ? new Date(c.expiryDate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle">
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
        <Modal
          isOpen={modalOpen}
          onClose={() => !submitting && setModalOpen(false)}
          className="max-w-3xl p-6 shadow-xl"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Create Coupon
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure code, discount, limits, expiry and status for this coupon.
          </p>
          <form
            onSubmit={handleCreate}
            className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Code *
              </label>
              <input
                required
                placeholder="Code (e.g. SAVE50)"
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-white/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Discount type *
              </label>
              <select
                value={form.discountType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    discountType: e.target.value as "percentage" | "fixed",
                  }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Discount value *
              </label>
              <input
                type="number"
                required
                min={0}
                placeholder="Discount value"
                value={form.discountValue}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    discountValue: Number(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Min order amount
              </label>
              <input
                type="number"
                min={0}
                placeholder="Min order amount"
                value={form.minOrderAmount}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    minOrderAmount: Number(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Max discount
              </label>
              <input
                type="number"
                min={0}
                placeholder="Max discount"
                value={form.maxDiscount}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    maxDiscount: Number(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Expiry date &amp; time *
              </label>
              <input
                type="datetime-local"
                required
                value={form.expiryDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiryDate: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Usage limit
              </label>
              <input
                type="number"
                min={1}
                placeholder="Usage limit"
                value={form.usageLimit}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    usageLimit: Number(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="coupon-active"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <label
                htmlFor="coupon-active"
                className="text-sm font-medium text-gray-700 dark:text-gray-400"
              >
                Active
              </label>
            </div>
            <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Creating…" : "Create Coupon"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
