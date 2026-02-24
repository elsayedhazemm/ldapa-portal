"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getProviders, bulkVerify, bulkArchive } from "@/lib/api";

interface Provider {
  id: string;
  name: string;
  organization: string | null;
  service_types: string[];
  city: string;
  verification_status: string;
  last_verified_at: string | null;
  updated_at: string;
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const data = await getProviders({
        search,
        status: statusFilter,
        service_type: serviceFilter,
        page,
        per_page: 20,
      });
      setProviders(data.providers);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [page, statusFilter, serviceFilter]); // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProviders();
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === providers.length) setSelected(new Set());
    else setSelected(new Set(providers.map((p) => p.id)));
  };

  const handleBulkVerify = async () => {
    if (selected.size === 0) return;
    await bulkVerify(Array.from(selected));
    setSelected(new Set());
    fetchProviders();
  };

  const handleBulkArchive = async () => {
    if (selected.size === 0) return;
    await bulkArchive(Array.from(selected));
    setSelected(new Set());
    fetchProviders();
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      verified: "bg-green-100 text-green-800",
      unverified: "bg-yellow-100 text-yellow-800",
      archived: "bg-gray-100 text-gray-600",
    };
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || ""}`}>
        {status}
      </span>
    );
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Providers</h1>
        <Link
          href="/dashboard/providers/new"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          + Add Provider
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search providers..."
            className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Search
          </button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={serviceFilter}
          onChange={(e) => { setServiceFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Services</option>
          <option value="evaluator">Evaluator</option>
          <option value="tutor">Tutor</option>
          <option value="advocate">Advocate</option>
          <option value="therapist">Therapist</option>
          <option value="clinic">Clinic</option>
          <option value="support_group">Support Group</option>
          <option value="nonprofit_org">Nonprofit</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-2.5">
          <span className="text-sm font-medium text-blue-700">{selected.size} selected</span>
          <button onClick={handleBulkVerify} className="text-sm text-green-700 hover:underline">
            Verify Selected
          </button>
          <button onClick={handleBulkArchive} className="text-sm text-gray-600 hover:underline">
            Archive Selected
          </button>
          <button onClick={() => setSelected(new Set())} className="text-sm text-red-600 hover:underline">
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input type="checkbox" checked={selected.size === providers.length && providers.length > 0} onChange={toggleAll} />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Services</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">City</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Last Verified</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : providers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No providers found</td></tr>
            ) : (
              providers.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/providers/${p.id}`} className="font-medium text-blue-600 hover:underline">
                      {p.name}
                    </Link>
                    {p.organization && (
                      <div className="text-xs text-gray-400">{p.organization}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.service_types.map((s) => s.replace(/_/g, " ")).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.city}</td>
                  <td className="px-4 py-3">{statusBadge(p.verification_status)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {p.last_verified_at
                      ? new Date(p.last_verified_at).toLocaleDateString()
                      : "Never"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
