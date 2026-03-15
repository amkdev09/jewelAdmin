import { useEffect, useState } from "react";
import { Link } from "react-router";
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
import { inventoryApi, productApi } from "../../services/api";
import type { InventoryItem } from "../../services/api";
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

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState<{
    productId: string;
    lowStock: string;
  }>({ productId: "", lowStock: "" });
  const [form, setForm] = useState({
    productId: "",
    variantId: "",
    sku: "",
    stockAvailable: 100,
    stockReserved: 0,
    reorderLevel: 10,
    warehouseLocation: "",
  });
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const limit = 10;

  const fetchInventory = () => {
    setLoading(true);
    const params: {
      page: number;
      limit: number;
      productId?: string;
      lowStock?: boolean;
    } = { page, limit };
    if (filters.productId) params.productId = filters.productId;
    if (filters.lowStock === "true") params.lowStock = true;

    inventoryApi
      .list(params)
      .then((res) => {
        if (res.data.success && res.data.data) {
          const d = res.data.data;
          setItems(d.items ?? []);
          setTotal(d.total ?? 0);
        } else {
          setItems([]);
          setTotal(0);
        }
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
        setAlertState({
          variant: "error",
          title: "Error",
          message: "Failed to load inventory.",
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInventory();
  }, [page, filters.productId, filters.lowStock]);

  useEffect(() => {
    productApi
      .list({ page: 1, limit: 50, sortBy: "latest" })
      .then((res: { data: { success?: boolean; data?: { items?: ProductOption[] } } }) => {
        if (res.data.success && res.data.data?.items) {
          setProducts(res.data.data.items);
        }
      })
      .catch(() => setProducts([]));
  }, []);

  const totalPages = Math.ceil(total / limit) || 1;

  const openCreateModal = () => {
    setForm({
      productId: "",
      variantId: "",
      sku: "",
      stockAvailable: 100,
      stockReserved: 0,
      reorderLevel: 10,
      warehouseLocation: "",
    });
    setAlertState(null);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId.trim() || !form.variantId.trim()) {
      setAlertState({
        variant: "warning",
        title: "Validation",
        message: "Product and Variant ID are required.",
      });
      return;
    }
    setSaving(true);
    inventoryApi
      .create({
        productId: form.productId.trim(),
        variantId: form.variantId.trim(),
        sku: form.sku.trim() || undefined,
        stockAvailable: form.stockAvailable,
        stockReserved: form.stockReserved,
        reorderLevel: form.reorderLevel,
        warehouseLocation: form.warehouseLocation.trim() || undefined,
      })
      .then(() => {
        setModalOpen(false);
        fetchInventory();
        setAlertState({
          variant: "success",
          title: "Success",
          message: "Inventory created.",
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
  };

  const handleDelete = (item: InventoryItem) => {
    const label = item.sku ?? item._id;
    if (!window.confirm(`Delete inventory "${label}"? This will remove all associated logs.`)) return;
    setSaving(true);
    inventoryApi
      .delete(item._id)
      .then(() => {
        fetchInventory();
        setAlertState({
          variant: "success",
          title: "Deleted",
          message: "Inventory deleted.",
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

  const productName = (item: InventoryItem) => {
    const p = item.productId;
    if (typeof p === "object" && p?.name) return p.name;
    return p ?? "—";
  };

  const variantDisplay = (item: InventoryItem) => {
    const v = item.variantId;
    if (typeof v === "object" && v !== null) {
      return Object.entries(v)
        .filter(([k]) => !k.startsWith("_"))
        .map(([k, val]) => `${k}: ${String(val)}`)
        .join(", ") || "—";
    }
    return String(v ?? "—");
  };

  const isLowStock = (item: InventoryItem) => {
    const reorder = item.reorderLevel ?? 0;
    const available = item.stockAvailable ?? 0;
    return reorder > 0 && available <= reorder;
  };

  return (
    <>
      <PageMeta title="Inventory | Admin" description="Manage inventory" />
      <PageBreadCrumb pageTitle="Inventory" />
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Inventory
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage stock levels, reorder levels, and warehouse locations.
            </p>
          </div>
          <Button size="sm" onClick={openCreateModal}>
            <span className="inline-flex items-center gap-2">
              <PlusIcon className="size-5 text-white fill-white" />
              Add Inventory
            </span>
          </Button>
        </div>
        <div className="border-t border-gray-100 px-4 pb-4 pt-2 sm:px-6 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
            <select
              value={filters.productId}
              onChange={(e) => {
                setFilters((f) => ({ ...f, productId: e.target.value }));
                setPage(1);
              }}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">All products</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name ?? p._id}
                </option>
              ))}
            </select>
            <select
              value={filters.lowStock}
              onChange={(e) => {
                setFilters((f) => ({ ...f, lowStock: e.target.value }));
                setPage(1);
              }}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">All stock</option>
              <option value="true">Low stock only</option>
            </select>
          </div>
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
                  <TableCell isHeader className="w-[18%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                    Product
                  </TableCell>
                  <TableCell isHeader className="w-[18%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                    Variant
                  </TableCell>
                  <TableCell isHeader className="w-[14%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                    SKU
                  </TableCell>
                  <TableCell isHeader className="w-[10%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                    Available
                  </TableCell>
                  <TableCell isHeader className="w-[10%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                    Reserved
                  </TableCell>
                  <TableCell isHeader className="w-[10%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                    Reorder
                  </TableCell>
                  <TableCell isHeader className="w-[12%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                    Location
                  </TableCell>
                  <TableCell isHeader className="w-[8%] px-4 py-2.5 text-right font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No inventory yet. Click &quot;Add Inventory&quot; to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="px-4 py-2.5 text-left align-middle font-medium text-gray-800 dark:text-white/90">
                        {productName(item)}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400 text-theme-xs">
                        {variantDisplay(item)}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {item.sku ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle">
                        <span
                          className={
                            isLowStock(item)
                              ? "font-medium text-amber-600 dark:text-amber-400"
                              : ""
                          }
                        >
                          {item.stockAvailable ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {item.stockReserved ?? 0}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {item.reorderLevel ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {item.warehouseLocation ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right align-middle">
                        <div className="inline-flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/inventory/${item._id}`}
                            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="View / Edit"
                          >
                            <PencilIcon className="size-5 text-gray-500" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
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

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        className="max-w-xl p-6 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Create Inventory
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Add inventory for a product variant. Product and Variant must exist.
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
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name ?? p._id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Variant ID *
            </label>
            <input
              value={form.variantId}
              onChange={(e) => setForm((f) => ({ ...f, variantId: e.target.value }))}
              placeholder="MongoDB variant _id"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              SKU (optional)
            </label>
            <input
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              placeholder="e.g. GOLD-RING-8-22K-001"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Stock available
              </label>
              <input
                type="number"
                min={0}
                value={form.stockAvailable}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stockAvailable: Number(e.target.value) || 0 }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Stock reserved
              </label>
              <input
                type="number"
                min={0}
                value={form.stockReserved}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stockReserved: Number(e.target.value) || 0 }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Reorder level
              </label>
              <input
                type="number"
                min={0}
                value={form.reorderLevel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reorderLevel: Number(e.target.value) || 0 }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Warehouse location
              </label>
              <input
                value={form.warehouseLocation}
                onChange={(e) =>
                  setForm((f) => ({ ...f, warehouseLocation: e.target.value }))
                }
                placeholder="e.g. Warehouse A"
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
              {saving ? "Creating…" : "Create Inventory"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
