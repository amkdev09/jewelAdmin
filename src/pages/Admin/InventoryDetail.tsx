import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router";
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
import Alert from "../../components/ui/alert/Alert";
import { inventoryApi } from "../../services/api";
import type { InventoryItem, InventoryHistoryItem } from "../../services/api";

type AlertVariant = "success" | "error" | "warning" | "info";
interface AlertState {
  variant: AlertVariant;
  title: string;
  message: string;
}

export default function InventoryDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const fromProductId = (location.state as { fromProductId?: string } | null)?.fromProductId;
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<InventoryHistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [saving, setSaving] = useState(false);
  const [alertState, setAlertState] = useState<AlertState | null>(null);

  const [updateForm, setUpdateForm] = useState({
    stockAvailable: 0,
    reorderLevel: 0,
    warehouseLocation: "",
    notes: "",
  });
  const [addStockForm, setAddStockForm] = useState({
    quantity: 0,
    reason: "restock",
    notes: "",
  });
  const [removeStockForm, setRemoveStockForm] = useState({
    quantity: 0,
    reason: "damaged",
    notes: "",
  });

  const historyLimit = 10;

  const fetchItem = () => {
    if (!id) return;
    setLoading(true);
    inventoryApi
      .getById(id)
      .then((res: { data: { success: boolean; data: InventoryItem } }) => {
        if (res.data.success && res.data.data) {
          const inv = res.data.data;
          setItem(inv);
          setUpdateForm({
            stockAvailable: inv.stockAvailable ?? 0,
            reorderLevel: inv.reorderLevel ?? 0,
            warehouseLocation: inv.warehouseLocation ?? "",
            notes: "",
          });
        } else {
          setItem(null);
        }
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  };

  const fetchHistory = () => {
    if (!id) return;
    inventoryApi
      .getHistory(id, { page: historyPage, limit: historyLimit })
      .then((res: { data: { success: boolean; data: { items: InventoryHistoryItem[]; total: number } } }) => {
        if (res.data.success && res.data.data) {
          const d = res.data.data;
          setHistory(d.items ?? []);
          setHistoryTotal(d.total ?? 0);
        }
      })
      .catch(() => setHistory([]));
  };

  useEffect(() => {
    fetchItem();
  }, [id]);

  useEffect(() => {
    if (id) fetchHistory();
  }, [id, historyPage]);

  const productName = () => {
    if (!item) return "—";
    const p = item.productId;
    if (typeof p === "object" && p?.name) return p.name;
    return String(p ?? "—");
  };

  const variantDisplay = () => {
    if (!item) return "—";
    const v = item.variantId;
    if (typeof v === "object" && v !== null) {
      return Object.entries(v)
        .filter(([k]) => !k.startsWith("_"))
        .map(([k, val]) => `${k}: ${String(val)}`)
        .join(", ");
    }
    return String(v ?? "—");
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    inventoryApi
      .update(id, {
        stockAvailable: updateForm.stockAvailable,
        reorderLevel: updateForm.reorderLevel,
        warehouseLocation: updateForm.warehouseLocation.trim() || undefined,
        notes: updateForm.notes.trim() || undefined,
      })
      .then((res: { data: { success: boolean; data: InventoryItem } }) => {
        if (res.data.success && res.data.data) setItem(res.data.data);
        setAlertState({
          variant: "success",
          title: "Updated",
          message: "Inventory updated.",
        });
        fetchHistory();
      })
      .catch((err: unknown) => {
        setAlertState({
          variant: "error",
          title: "Error",
          message: (err as { message?: string })?.message ?? "Update failed.",
        });
      })
      .finally(() => setSaving(false));
  };

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || addStockForm.quantity <= 0) return;
    setSaving(true);
    inventoryApi
      .addStock(id, {
        quantity: addStockForm.quantity,
        reason: addStockForm.reason,
        notes: addStockForm.notes.trim() || undefined,
      })
      .then((res: { data: { success: boolean; data: InventoryItem } }) => {
        if (res.data.success && res.data.data) setItem(res.data.data);
        setAddStockForm((f) => ({ ...f, quantity: 0, notes: "" }));
        setAlertState({
          variant: "success",
          title: "Stock added",
          message: `${addStockForm.quantity} units added.`,
        });
        fetchHistory();
      })
      .catch((err: unknown) => {
        setAlertState({
          variant: "error",
          title: "Error",
          message: (err as { message?: string })?.message ?? "Add stock failed.",
        });
      })
      .finally(() => setSaving(false));
  };

  const handleRemoveStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || removeStockForm.quantity <= 0) return;
    const available = item?.stockAvailable ?? 0;
    if (removeStockForm.quantity > available) {
      setAlertState({
        variant: "warning",
        title: "Insufficient stock",
        message: `Only ${available} available.`,
      });
      return;
    }
    setSaving(true);
    inventoryApi
      .removeStock(id, {
        quantity: removeStockForm.quantity,
        reason: removeStockForm.reason,
        notes: removeStockForm.notes.trim() || undefined,
      })
      .then((res: { data: { success: boolean; data: InventoryItem } }) => {
        if (res.data.success && res.data.data) setItem(res.data.data);
        setRemoveStockForm((f) => ({ ...f, quantity: 0, notes: "" }));
        setAlertState({
          variant: "success",
          title: "Stock removed",
          message: `${removeStockForm.quantity} units removed.`,
        });
        fetchHistory();
      })
      .catch((err: unknown) => {
        setAlertState({
          variant: "error",
          title: "Error",
          message: (err as { message?: string })?.message ?? "Remove stock failed.",
        });
      })
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

  if (!item) {
    return (
      <>
        <PageBreadCrumb pageTitle="Inventory" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-gray-500 dark:text-gray-400">Inventory not found.</p>
          <Link
            to="/admin/inventory"
            className="mt-4 inline-block text-brand-500 hover:underline"
          >
            Back to Inventory
          </Link>
        </div>
      </>
    );
  }

  const isLowStock =
    (item.reorderLevel ?? 0) > 0 &&
    (item.stockAvailable ?? 0) <= (item.reorderLevel ?? 0);
  const historyTotalPages = Math.ceil(historyTotal / historyLimit) || 1;

  return (
    <>
      <PageMeta
        title={`Inventory ${item.sku ?? item._id} | Admin`}
        description="Inventory details"
      />
      <PageBreadCrumb pageTitle={item.sku ?? "Inventory"} />
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
            className="absolute right-3 top-3 rounded p-1 text-gray-500 hover:bg-gray-200/80"
            aria-label="Dismiss"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {item.sku ?? productName()}
            </h2>
            <div className="flex items-center gap-2">
              {fromProductId && (
                <Link to={`/admin/products/${fromProductId}`}>
                  <Button size="sm" className="bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700">
                    Back to Product
                  </Button>
                </Link>
              )}
              <Link to="/admin/inventory">
                <Button size="sm" variant="outline">
                  All Inventory
                </Button>
              </Link>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Product</dt>
              <dd className="font-medium text-gray-800 dark:text-white/90">{productName()}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Variant</dt>
              <dd className="text-gray-800 dark:text-white/90 text-theme-xs">{variantDisplay()}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">SKU</dt>
              <dd className="text-gray-800 dark:text-white/90">{item.sku ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Stock available</dt>
              <dd className="flex items-center gap-2">
                <span
                  className={
                    isLowStock
                      ? "font-medium text-amber-600 dark:text-amber-400"
                      : "font-medium text-gray-800 dark:text-white/90"
                  }
                >
                  {item.stockAvailable ?? 0}
                </span>
                {isLowStock && (
                  <Badge size="sm" color="warning">
                    Low stock
                  </Badge>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Stock reserved</dt>
              <dd className="text-gray-800 dark:text-white/90">{item.stockReserved ?? 0}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Reorder level</dt>
              <dd className="text-gray-800 dark:text-white/90">{item.reorderLevel ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Warehouse</dt>
              <dd className="text-gray-800 dark:text-white/90">
                {item.warehouseLocation ?? "—"}
              </dd>
            </div>
            {item.lastRestocked && (
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Last restocked</dt>
                <dd className="text-gray-800 dark:text-white/90">
                  {new Date(item.lastRestocked).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <form
          onSubmit={handleUpdate}
          className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Update inventory
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Stock available
              </label>
              <input
                type="number"
                min={0}
                value={updateForm.stockAvailable}
                onChange={(e) =>
                  setUpdateForm((f) => ({
                    ...f,
                    stockAvailable: Number(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reorder level
              </label>
              <input
                type="number"
                min={0}
                value={updateForm.reorderLevel}
                onChange={(e) =>
                  setUpdateForm((f) => ({
                    ...f,
                    reorderLevel: Number(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Warehouse location
              </label>
              <input
                type="text"
                value={updateForm.warehouseLocation}
                onChange={(e) =>
                  setUpdateForm((f) => ({ ...f, warehouseLocation: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes
              </label>
              <input
                type="text"
                value={updateForm.notes}
                onChange={(e) => setUpdateForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Updating…" : "Update"}
            </Button>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleAddStock}
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Add stock
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  value={addStockForm.quantity || ""}
                  onChange={(e) =>
                    setAddStockForm((f) => ({
                      ...f,
                      quantity: Number(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reason
                </label>
                <select
                  value={addStockForm.reason}
                  onChange={(e) =>
                    setAddStockForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="restock">Restock</option>
                  <option value="return">Return</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <input
                  type="text"
                  value={addStockForm.notes}
                  onChange={(e) =>
                    setAddStockForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Optional"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <Button type="submit" size="sm" disabled={saving || addStockForm.quantity <= 0}>
                {saving ? "Adding…" : "Add stock"}
              </Button>
            </div>
          </form>

          <form
            onSubmit={handleRemoveStock}
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Remove stock
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantity (max {item.stockAvailable ?? 0})
                </label>
                <input
                  type="number"
                  min={1}
                  max={item.stockAvailable ?? 0}
                  value={removeStockForm.quantity || ""}
                  onChange={(e) =>
                    setRemoveStockForm((f) => ({
                      ...f,
                      quantity: Number(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reason
                </label>
                <select
                  value={removeStockForm.reason}
                  onChange={(e) =>
                    setRemoveStockForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="damaged">Damaged</option>
                  <option value="sold">Sold</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <input
                  type="text"
                  value={removeStockForm.notes}
                  onChange={(e) =>
                    setRemoveStockForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Optional"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={
                  saving ||
                  removeStockForm.quantity <= 0 ||
                  removeStockForm.quantity > (item.stockAvailable ?? 0)
                }
              >
                {saving ? "Removing…" : "Remove stock"}
              </Button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Inventory history
          </h3>
          <div className="mt-4 overflow-x-auto">
            {history.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No history yet.
              </p>
            ) : (
              <>
                <Table className="w-full">
                  <TableHeader className="border-gray-100 dark:border-gray-800 border-y bg-gray-50/80 dark:bg-gray-800/40">
                    <TableRow>
                      <TableCell isHeader className="px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                        Type
                      </TableCell>
                      <TableCell isHeader className="px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                        Quantity
                      </TableCell>
                      <TableCell isHeader className="px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                        Description
                      </TableCell>
                      <TableCell isHeader className="px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                        Previous → New
                      </TableCell>
                      <TableCell isHeader className="px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                        Date
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {history.map((h) => (
                      <TableRow key={h._id}>
                        <TableCell className="px-4 py-2.5 text-left align-middle text-gray-800 dark:text-white/90">
                          {h.changeType ?? "—"}
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                          {h.quantity ?? "—"}
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400 text-theme-xs">
                          {h.description ?? "—"}
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                          {h.previousStockAvailable ?? "—"} → {h.newStockAvailable ?? "—"}
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400 text-theme-xs">
                          {h.createdAt
                            ? new Date(h.createdAt).toLocaleString()
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {historyTotalPages > 1 && (
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPage <= 1}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-500">
                      Page {historyPage} of {historyTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setHistoryPage((p) => Math.min(historyTotalPages, p + 1))
                      }
                      disabled={historyPage >= historyTotalPages}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
