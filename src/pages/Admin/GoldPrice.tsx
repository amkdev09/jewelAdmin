import { useEffect, useState } from "react";
import Button from "../../components/ui/button/Button";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import { goldPriceApi } from "../../services/api";

export default function GoldPrice() {
  const [purity, setPurity] = useState("22k");
  const [pricePerGram, setPricePerGram] = useState("");
  const [latest, setLatest] = useState<{ purity?: string; pricePerGram?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchLatest = () => {
    setFetching(true);
    goldPriceApi
      .getLatest(purity)
      .then((res: { data: { success?: boolean; data?: unknown } }) => {
        if (res.data.success && res.data.data) {
          setLatest(res.data.data as { purity?: string; pricePerGram?: number });
          const p = (res.data.data as { pricePerGram?: number }).pricePerGram;
          if (p != null) setPricePerGram(String(p));
        } else {
          setLatest(null);
        }
      })
      .catch(() => setLatest(null))
      .finally(() => setFetching(false));
  };

  useEffect(() => {
    fetchLatest();
  }, [purity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(pricePerGram);
    if (!Number.isFinite(value) || value <= 0) {
      alert("Enter a valid price per gram.");
      return;
    }
    setLoading(true);
    goldPriceApi
      .createOrUpdate({ purity, pricePerGram: value, source: "admin" })
      .then(() => {
        fetchLatest();
        alert("Gold price updated.");
      })
      .catch((err: { message?: string }) =>
        alert((err as { message?: string })?.message ?? "Update failed")
      )
      .finally(() => setLoading(false));
  };

  return (
    <>
      <PageMeta title="Gold Price | Admin" description="Set gold price per gram" />
      <PageBreadCrumb pageTitle="Gold Price" />
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Gold Price (per gram)
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Set the latest gold price by purity. Used for product pricing.
        </p>

        {fetching && !latest ? (
          <div className="mt-6 h-24 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ) : (
          <div className="mt-6 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Current price ({purity}):{" "}
              <span className="font-semibold text-gray-800 dark:text-white/90">
                {latest?.pricePerGram != null
                  ? `₹${latest.pricePerGram.toLocaleString()} / gram`
                  : "Not set"}
              </span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Purity
            </label>
            <select
              value={purity}
              onChange={(e) => setPurity(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="24k">24k</option>
              <option value="22k">22k</option>
              <option value="18k">18k</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Price per gram (₹)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={pricePerGram}
              onChange={(e) => setPricePerGram(e.target.value)}
              placeholder="e.g. 5500"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Updating…" : "Update Price"}
          </Button>
        </form>
      </div>
    </>
  );
}
