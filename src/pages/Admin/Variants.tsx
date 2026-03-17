import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import Alert from "../../components/ui/alert/Alert";
import { variantApi, productApi } from "../../services/api";
import type { Variant } from "../../services/api";
import { PencilIcon, TrashBinIcon, PlusIcon } from "../../icons";

type AlertVariant = "success" | "error" | "warning" | "info";
interface AlertState {
  variant: AlertVariant;
  title: string;
  message: string;
}

interface ProductOption {
  _id: string;
  name?: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function Variants() {
  const [items, setItems] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [form, setForm] = useState({
    productId: "",
    ringSize: "",
    purity: "",
    metalColor: "",
    priceAdjustment: 0,
  });
  const [alertState, setAlertState] = useState<AlertState | null>(null);

  const fetchVariants = () => {
    if (!selectedProductId) {
      setItems([]);
      return;
    }
    setLoading(true);
    variantApi
      .listByProduct(selectedProductId)
      .then((res: { data: { success?: boolean; data?: Variant[] } }) => {
        if (res.data.success && res.data.data) {
          setItems(Array.isArray(res.data.data) ? res.data.data : []);
        } else {
          setItems([]);
        }
      })
      .catch(() => {
        setItems([]);
        setAlertState({
          variant: "error",
          title: "Error",
          message: "Failed to load variants.",
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVariants();
  }, [selectedProductId]);

  useEffect(() => {
    productApi
      .list({ page: 1, limit: 50, sortBy: "latest" })
      .then((res: any) => {
        if (res.data.success && res.data.data?.items) {
          setProducts(res.data.data.items);
        }
      })
      .catch(() => setProducts([]));
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      productId: selectedProductId || "",
      ringSize: "",
      purity: "",
      metalColor: "",
      priceAdjustment: 0,
    });
    setAlertState(null);
    setModalOpen(true);
  };

  const openEditModal = (variant: Variant) => {
    setEditingId(variant._id);
    setForm({
      productId: typeof variant.productId === "string" ? variant.productId : "",
      ringSize: variant.ringSize ?? "",
      purity: variant.purity ?? "",
      metalColor: variant.metalColor ?? "",
      priceAdjustment: variant.priceAdjustment ?? 0,
    });
    setAlertState(null);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId.trim()) {
      setAlertState({
        variant: "warning",
        title: "Validation",
        message: "Please select a product.",
      });
      return;
    }
    setSaving(true);
    if (editingId) {
      variantApi
        .update(editingId, {
          ringSize: form.ringSize.trim() || undefined,
          purity: form.purity.trim() || undefined,
          metalColor: form.metalColor.trim() || undefined,
          priceAdjustment: form.priceAdjustment,
        })
        .then(() => {
          setModalOpen(false);
          fetchVariants();
          setAlertState({
            variant: "success",
            title: "Success",
            message: "Variant updated.",
          });
        })
        .catch((err: unknown) => {
          setAlertState({
            variant: "error",
            title: "Error",
            message: (err as { message?: string })?.message ?? "Update failed.",
          });
        })
        .finally(() => setSaving(false));
    } else {
      variantApi
        .create({
          productId: form.productId.trim(),
          ringSize: form.ringSize.trim() || undefined,
          purity: form.purity.trim() || undefined,
          metalColor: form.metalColor.trim() || undefined,
          priceAdjustment: form.priceAdjustment,
        })
        .then(() => {
          setModalOpen(false);
          fetchVariants();
          setAlertState({
            variant: "success",
            title: "Success",
            message: "Variant created. Inventory entry created automatically if needed.",
          });
        })
        .catch((err: unknown) => {
          setAlertState({
            variant: "error",
            title: "Error",
            message: (err as { message?: string })?.message ?? "Create failed.",
          });
        })
        .finally(() => setSaving(false));
    }
  };

  const handleDelete = (variant: Variant) => {
    const label = [variant.ringSize, variant.purity, variant.metalColor]
      .filter(Boolean)
      .join(" / ") || variant._id;
    if (
      !window.confirm(
        `Delete variant "${label}"? This will also delete the associated inventory entry.`
      )
    ) {
      return;
    }
    setSaving(true);
    variantApi
      .delete(variant._id)
      .then(() => {
        fetchVariants();
        setAlertState({
          variant: "success",
          title: "Deleted",
          message: "Variant deleted.",
        });
      })
      .catch((err: unknown) => {
        setAlertState({
          variant: "error",
          title: "Error",
          message: (err as { message?: string })?.message ?? "Delete failed.",
        });
      })
      .finally(() => setSaving(false));
  };

  const inventoryDisplay = (variant: Variant) => {
    const inv = variant.inventoryId;
    if (!inv) return "—";
    if (typeof inv === "object") {
      const parts = [];
      if (inv.sku) parts.push(inv.sku);
      if (inv.stockAvailable != null) parts.push(`Stock: ${inv.stockAvailable}`);
      return parts.length ? parts.join(" · ") : "—";
    }
    return String(inv);
  };

  return (
    <>
      <PageMeta title="Variants | Admin" description="Manage product variants" />
      <PageBreadCrumb pageTitle="Variants" />
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
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Product Variants
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage ring size, purity, metal color, and price adjustments per product.
            </p>
          </div>
          <Button
            size="sm"
            onClick={openCreateModal}
            disabled={!selectedProductId}
            title={!selectedProductId ? "Select a product first" : undefined}
          >
            <span className="inline-flex items-center gap-2">
              <PlusIcon className="size-5 text-white fill-white" />
              Add Variant
            </span>
          </Button>
        </div>
        <div className="border-t border-gray-100 px-4 pb-4 pt-2 sm:px-6 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Product:
            </span>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white min-w-[200px]"
            >
              <option value="">Select a product</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name ?? p._id}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          {!selectedProductId ? (
            <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
              Select a product to view and manage its variants.
            </div>
          ) : loading ? (
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
                    className="w-[14%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Ring size
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[14%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Purity
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[14%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Metal color
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[18%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Price adjustment
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[24%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Inventory
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[16%] px-4 py-2.5 text-right font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No variants for this product. Click &quot;Add Variant&quot; to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((v) => (
                    <TableRow key={v._id}>
                      <TableCell className="px-4 py-2.5 text-left align-middle font-medium text-gray-800 dark:text-white/90">
                        {v.ringSize ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {v.purity ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {v.metalColor ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {v.priceAdjustment != null
                          ? formatCurrency(v.priceAdjustment)
                          : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400 text-theme-xs">
                        {inventoryDisplay(v)}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right align-middle">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(v)}
                            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Edit"
                          >
                            <PencilIcon className="size-5 text-gray-500" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(v)}
                            className="rounded-lg p-2 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete"
                            disabled={saving}
                          >
                            <TrashBinIcon className="size-5 text-red-500" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        className="max-w-xl p-6 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {editingId ? "Edit Variant" : "Create Variant"}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {editingId
            ? "Update ring size, purity, metal color, or price adjustment."
            : "Variants must be unique per product (ringSize + purity + metalColor). Inventory is created automatically."}
        </p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Product *
            </label>
            <select
              value={form.productId}
              onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
              required
              disabled={!!editingId}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white disabled:opacity-70"
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name ?? p._id}
                </option>
              ))}
            </select>
            {editingId && (
              <p className="mt-1 text-xs text-gray-500">Product cannot be changed when editing.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Ring size
              </label>
              <input
                value={form.ringSize}
                onChange={(e) => setForm((f) => ({ ...f, ringSize: e.target.value }))}
                placeholder="e.g. 8"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Purity
              </label>
              <input
                value={form.purity}
                onChange={(e) => setForm((f) => ({ ...f, purity: e.target.value }))}
                placeholder="e.g. 22k"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Metal color
              </label>
              <input
                value={form.metalColor}
                onChange={(e) => setForm((f) => ({ ...f, metalColor: e.target.value }))}
                placeholder="e.g. yellow"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Price adjustment (₹)
              </label>
              <input
                type="number"
                min={0}
                value={form.priceAdjustment || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    priceAdjustment: Number(e.target.value) || 0,
                  }))
                }
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving
                ? "Saving…"
                : editingId
                  ? "Save changes"
                  : "Create Variant"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
