"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Plus, ArrowUpDown, X, FileQuestion, Edit, Trash2, Filter,
  Users as UsersIcon, MapPin, DollarSign, Shield, UserPlus,
  CheckCircle, Clock, AlertTriangle, Info, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getProviders, deleteProvider } from "@/lib/api";

interface ApiProvider {
  id: string;
  name: string;
  profession_name: string;
  city: string | null;
  state_code: string;
  zip_code: string | null;
  price_per_visit: string | null;
  sliding_scale: boolean;
  insurance_accepted: string | null;
  verification_status: string;
  last_verified_at: string | null;
  updated_at: string;
  services: string | null;
  training: string | null;
  credentials: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  age_range_served: string | null;
}

export default function ProviderDirectoryPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [professionFilter, setProfessionFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProviders({
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        profession: professionFilter !== "all" ? professionFilter : undefined,
        city: cityFilter || undefined,
        page: currentPage,
        per_page: itemsPerPage,
      });
      setProviders(data.providers);
      setTotal(data.total);
    } catch (e) {
      console.error("Failed to fetch providers:", e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, professionFilter, cityFilter, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  };

  const handleDelete = async (providerId: string, providerName: string) => {
    if (confirm(`Are you sure you want to delete "${providerName}"? This action cannot be undone.`)) {
      try {
        await deleteProvider(providerId);
        fetchData();
      } catch (e) {
        console.error("Failed to delete provider:", e);
        alert("Failed to delete provider. Please try again.");
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setProfessionFilter("all");
    setCityFilter("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery !== "" || statusFilter !== "all" || professionFilter !== "all" || cityFilter !== "";

  const totalPages = Math.ceil(total / itemsPerPage);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string; Icon: typeof CheckCircle }> = {
      verified: {
        className: "bg-green-100 text-green-800 border-green-200",
        label: "Verified", Icon: CheckCircle,
      },
      unverified: {
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        label: "Unverified", Icon: Clock,
      },
      archived: {
        className: "bg-gray-100 text-gray-600 border-gray-200",
        label: "Archived", Icon: X,
      },
    };
    const variant = variants[status] || variants.unverified;
    return (
      <Badge className={`${variant.className} border-2`} variant="outline">
        {variant.label}
      </Badge>
    );
  };

  const professionLabel = (name: string) => {
    const labels: Record<string, string> = {
      Tutor: "Tutor",
      Health_Professional: "Health Professional",
      Lawyer: "Lawyer",
      School: "School",
      Advocate: "Advocate",
    };
    return labels[name] || name;
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-[#92A7C3]/5 to-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#17789C] to-[#2d7a9e] rounded-xl flex items-center justify-center shadow-lg shadow-[#17789C]/30">
              <UsersIcon className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
            Provider Directory
          </h1>
          <div className="text-sm text-slate-500 font-medium">
            {total.toLocaleString()} providers total
          </div>
        </div>

        {/* Status Legend */}
        <div className="bg-white border-2 border-slate-100 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-teal-600" aria-hidden="true" />
            Provider Status Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div><p className="text-xs font-bold text-green-800">Verified</p><p className="text-xs text-green-700">Provider verified & visible to chat</p></div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div><p className="text-xs font-bold text-yellow-800">Unverified</p><p className="text-xs text-yellow-700">Awaiting verification</p></div>
            </div>
            <div className="flex items-start gap-2">
              <X className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
              <div><p className="text-xs font-bold text-gray-800">Archived</p><p className="text-xs text-gray-700">No longer active</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border-2 border-slate-100 p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#17789C]" aria-hidden="true" />
              <Input
                type="search"
                placeholder="Search by name, services, or training..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-slate-200 focus:border-[#17789C] focus:ring-[#17789C]"
              />
            </div>
            <Button type="submit" variant="outline" className="border-2">Search</Button>
          </form>
          <Link href="/providers/new">
            <Button className="bg-gradient-to-r from-[#17789C] to-[#2d7a9e] hover:from-[#0f5470] hover:to-[#17789C] text-white shadow-lg shadow-[#17789C]/30 px-6 h-11">
              <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
              Add New Provider
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
              <Filter className="w-4 h-4 text-[#17789C]" aria-hidden="true" />
              Profession Type
            </label>
            <Select value={professionFilter} onValueChange={(v) => { setProfessionFilter(v); setCurrentPage(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="Tutor">Tutor</SelectItem>
                <SelectItem value="Health_Professional">Health Professional</SelectItem>
                <SelectItem value="Lawyer">Lawyer</SelectItem>
                <SelectItem value="School">School</SelectItem>
                <SelectItem value="Advocate">Advocate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-[#17789C]" aria-hidden="true" />
              City
            </label>
            <Input
              type="text"
              placeholder="Filter by city..."
              value={cityFilter}
              onChange={(e) => { setCityFilter(e.target.value); setCurrentPage(1); }}
              className="border-2 border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
              <Shield className="w-4 h-4 text-[#17789C]" aria-hidden="true" />
              Verification Status
            </label>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {providers.length} of {total} providers
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" aria-hidden="true" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Provider Table */}
      <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
              <TableHead className="font-bold text-slate-900 py-4">Provider Name</TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Type</TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Location</TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Cost</TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Status</TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Last Verified</TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-gray-400">
                  Loading providers...
                </TableCell>
              </TableRow>
            ) : providers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center shadow-inner">
                      {hasActiveFilters ? (
                        <Search className="w-10 h-10 text-amber-600" aria-hidden="true" />
                      ) : (
                        <FileQuestion className="w-10 h-10 text-slate-400" aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-900">
                        {hasActiveFilters ? "No providers found" : "No providers yet"}
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        {hasActiveFilters ? "Try adjusting your filters or search query" : "Get started by adding your first provider"}
                      </p>
                    </div>
                    {hasActiveFilters ? (
                      <Button variant="outline" onClick={clearFilters} className="mt-2">
                        <X className="w-4 h-4 mr-2" />Clear Filters
                      </Button>
                    ) : (
                      <Link href="/providers/new">
                        <Button className="mt-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white">
                          <Plus className="w-4 h-4 mr-2" />Add New Provider
                        </Button>
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              providers.map((provider) => (
                <TableRow key={provider.id} className="hover:bg-gradient-to-r hover:from-teal-50/30 hover:to-cyan-50/30 transition-all duration-150 border-b border-slate-100">
                  <TableCell className="py-4">
                    <Link href={`/providers/${provider.id}`} className="font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-colors">
                      {provider.name}
                    </Link>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-slate-700 font-medium">{professionLabel(provider.profession_name)}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" aria-hidden="true" />
                      <div>
                        <div className="text-slate-900 font-medium">
                          {provider.city ? `${provider.city}, ${provider.state_code}` : provider.state_code}
                        </div>
                        {provider.zip_code && <div className="text-sm text-slate-500">{provider.zip_code}</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-slate-400" aria-hidden="true" />
                      <span className="text-slate-700 font-medium">
                        {provider.price_per_visit || "Contact"}
                      </span>
                    </div>
                    {provider.sliding_scale && (
                      <span className="text-xs text-green-700 font-medium">Sliding scale</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4">{getStatusBadge(provider.verification_status)}</TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-slate-400" aria-hidden="true" />
                      <span className="text-slate-700">
                        {provider.last_verified_at
                          ? new Date(provider.last_verified_at).toLocaleDateString()
                          : "Never"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/providers/${provider.id}`}>
                        <Button variant="outline" size="sm" className="border-2 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 transition-all">
                          <Eye className="w-4 h-4 mr-1" />View
                        </Button>
                      </Link>
                      <Link href={`/providers/${provider.id}/edit`}>
                        <Button variant="outline" size="sm" className="border-2 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm"
                        onClick={() => handleDelete(provider.id, provider.name)}
                        className="border-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-400 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 bg-white rounded-xl border-2 border-slate-100 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 font-medium">
              Showing <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, total)}</span> of{" "}
              <span className="font-bold text-slate-900">{total.toLocaleString()}</span> providers
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="border-2 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50">
                Previous
              </Button>
              <span className="text-sm text-slate-600 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="border-2 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50">
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
