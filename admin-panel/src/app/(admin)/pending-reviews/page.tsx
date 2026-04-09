"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, AlertTriangle, Eye, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getProviders, verifyProvider, archiveProvider } from "@/lib/api";

interface ApiProvider {
  id: string;
  name: string;
  profession_name: string;
  city: string | null;
  state_code: string;
  verification_status: string;
  created_at: string;
  updated_at: string;
}

export default function PendingReviewsPage() {
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchUnverified = async () => {
    setLoading(true);
    try {
      const data = await getProviders({ status: "unverified", page, per_page: 20 });
      setProviders(data.providers);
      setTotal(data.total);
    } catch (e) {
      console.error("Failed to fetch:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUnverified(); }, [page]);

  const handleVerify = async (id: string) => {
    try {
      await verifyProvider(id);
      fetchUnverified();
    } catch (e) {
      console.error("Failed to verify:", e);
    }
  };

  const handleArchive = async (id: string) => {
    if (confirm("Archive this provider?")) {
      try {
        await archiveProvider(id);
        fetchUnverified();
      } catch (e) {
        console.error("Failed to archive:", e);
      }
    }
  };

  const professionLabel = (name: string) => {
    const labels: Record<string, string> = {
      Tutor: "Tutor", Health_Professional: "Health Professional",
      Lawyer: "Lawyer", School: "School", Advocate: "Advocate",
    };
    return labels[name] || name;
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Pending Reviews</h1>
        <p className="text-gray-600">Review and verify unverified providers ({total} total)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Unverified Providers</p>
              <p className="text-2xl font-semibold text-gray-900">{total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Showing Page</p>
              <p className="text-2xl font-semibold text-gray-900">{page} of {totalPages || 1}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-900">Provider Name</TableHead>
              <TableHead className="font-semibold text-gray-900">Type</TableHead>
              <TableHead className="font-semibold text-gray-900">Location</TableHead>
              <TableHead className="font-semibold text-gray-900">Added</TableHead>
              <TableHead className="font-semibold text-gray-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
            ) : providers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-500">All providers have been reviewed!</p>
                </TableCell>
              </TableRow>
            ) : (
              providers.map((p) => (
                <TableRow key={p.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Link href={`/providers/${p.id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-gray-600">{professionLabel(p.profession_name)}</TableCell>
                  <TableCell className="text-gray-600">
                    {p.city ? `${p.city}, ${p.state_code}` : p.state_code}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {new Date(p.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/providers/${p.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />View
                        </Button>
                      </Link>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleVerify(p.id)}>
                        <CheckCircle className="w-4 h-4 mr-1" />Verify
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-400 text-gray-600" onClick={() => handleArchive(p.id)}>
                        <X className="w-4 h-4 mr-1" />Archive
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Click &quot;View&quot; to see full provider details before verifying. Verified providers become visible to the chat interface.
        </p>
      </div>
    </div>
  );
}
