import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { userApi } from "../../services/api";

interface User {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  role?: string;
}

export default function Users() {
  const [items, setItems] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<string>("customer");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const limit = 10;

  const fetchUsers = () => {
    setLoading(true);
    userApi
      .list({ page, limit, search: search || undefined, sortBy: "latest" })
      .then((res: any) => {
        if (res.data.success && res.data.data) {
          const d = res.data.data as { items: User[]; total: number };
          setItems(d.items ?? []);
          setTotal(d.total ?? 0);
        }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const openUserDetail = (id: string) => {
    setErrorMessage(null);
    setDetailOpen(true);
    setDetailLoading(true);
    setSelectedUser(null);
    userApi
      .getById(id)
      .then((res: any) => {
        if (res.data.success && res.data.data) {
          const u = res.data.data as Record<string, unknown>;
          const mapped: User = {
            _id: (u._id as string) ?? id,
            name: (u.name as string) ?? "",
            email: (u.email as string) ?? "",
            phone: (u.phone as string) ?? "",
            createdAt: (u.createdAt as string) ?? undefined,
            role: (u.role as string) ?? "customer",
          };
          setSelectedUser(mapped);
          setEditRole(mapped.role ?? "customer");
        } else {
          setErrorMessage("User details not found.");
        }
      })
      .catch((err: unknown) => {
        setErrorMessage(
          (err as { message?: string })?.message ?? "Failed to load user details."
        );
      })
      .finally(() => setDetailLoading(false));
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    setErrorMessage(null);
    userApi
      .update(selectedUser._id, { role: editRole || "customer" })
      .then(() => {
        setDetailOpen(false);
        fetchUsers();
      })
      .catch((err: unknown) => {
        setErrorMessage(
          (err as { message?: string })?.message ?? "Update failed. Please try again."
        );
      })
      .finally(() => setSaving(false));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <>
      <PageMeta title="Users | Admin" description="Manage users" />
      <PageBreadCrumb pageTitle="Users" />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            All Users
          </h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Search
            </button>
          </form>
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
                    className="w-[26%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[32%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Email
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[18%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Phone
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[14%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Role
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[10%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Joined
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
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((u) => (
                    <TableRow
                      key={u._id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/40"
                      onClick={() => openUserDetail(u._id as string)}
                    >
                      <TableCell className="px-4 py-2.5 text-left align-middle font-medium text-gray-800 dark:text-white/90">
                        {u.name ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {u.email ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {u.phone ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {u.role ?? "customer"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                          })
                          : "—"}
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
        isOpen={detailOpen}
        onClose={() => !saving && setDetailOpen(false)}
        className="max-w-lg p-6 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          User details
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          View basic info and update the user&apos;s role.
        </p>
        {detailLoading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
              />
            ))}
          </div>
        ) : selectedUser ? (
          <form onSubmit={handleUpdateUser} className="mt-5 space-y-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Name
              </div>
              <div className="mt-0.5 text-sm text-gray-900 dark:text-white/90">
                {selectedUser.name || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Email
              </div>
              <div className="mt-0.5 text-sm text-gray-900 dark:text-white/90 break-all">
                {selectedUser.email || "—"}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Phone
                </div>
                <div className="mt-0.5 text-sm text-gray-900 dark:text-white/90">
                  {selectedUser.phone || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Joined
                </div>
                <div className="mt-0.5 text-sm text-gray-900 dark:text-white/90">
                  {selectedUser.createdAt
                    ? new Date(selectedUser.createdAt).toLocaleDateString(
                      "en-IN",
                      { year: "numeric", month: "short", day: "2-digit" }
                    )
                    : "—"}
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Role
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            {errorMessage && (
              <p className="text-sm text-error-500">{errorMessage}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setDetailOpen(false)}
                disabled={saving}
              >
                Close
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        ) : (
          <p className="mt-6 text-sm text-error-500">
            {errorMessage ?? "User not found."}
          </p>
        )}
      </Modal>
    </>
  );
}
