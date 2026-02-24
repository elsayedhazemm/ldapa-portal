"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProvider, verifyProvider, archiveProvider, deleteProvider } from "@/lib/api";

interface Provider {
  id: string;
  name: string;
  organization: string | null;
  service_types: string[];
  specializations: string[];
  serves_ages: string[];
  address: string | null;
  city: string;
  state: string;
  zip_code: string | null;
  region: string | null;
  cost_tier: string;
  insurance_accepted: boolean;
  accepts_medicaid: boolean;
  cost_notes: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  verification_status: string;
  last_verified_at: string | null;
  staff_notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      getProvider(params.id as string)
        .then(setProvider)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;
  if (!provider) return <div className="p-6 text-gray-400">Provider not found</div>;

  const handleVerify = async () => {
    const updated = await verifyProvider(provider.id);
    setProvider(updated);
  };

  const handleArchive = async () => {
    const updated = await archiveProvider(provider.id);
    setProvider(updated);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this provider?")) return;
    await deleteProvider(provider.id);
    router.push("/dashboard/providers");
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      verified: "bg-green-100 text-green-800",
      unverified: "bg-yellow-100 text-yellow-800",
      archived: "bg-gray-100 text-gray-600",
    };
    return (
      <span className={`rounded-full px-3 py-1 text-sm font-medium ${styles[status] || ""}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/dashboard/providers" className="text-sm text-blue-600 hover:underline">
            &larr; Back to Providers
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{provider.name}</h1>
          {provider.organization && (
            <p className="text-gray-500">{provider.organization}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {statusBadge(provider.verification_status)}
          <Link
            href={`/dashboard/providers/${provider.id}/edit`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Edit
          </Link>
          {provider.verification_status !== "verified" && (
            <button onClick={handleVerify} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
              Verify
            </button>
          )}
          {provider.verification_status !== "archived" && (
            <button onClick={handleArchive} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Archive
            </button>
          )}
          <button onClick={handleDelete} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Details</h2>
          <InfoRow label="Service Types" value={provider.service_types.map((s) => s.replace(/_/g, " ")).join(", ")} />
          <InfoRow label="Specializations" value={provider.specializations.map((s) => s.replace(/_/g, " ")).join(", ") || "—"} />
          <InfoRow label="Ages Served" value={provider.serves_ages.join(", ") || "—"} />
          <InfoRow label="Cost Tier" value={provider.cost_tier.replace(/_/g, " ")} />
          <InfoRow label="Insurance" value={provider.insurance_accepted ? "Yes" : "No"} />
          <InfoRow label="Medicaid" value={provider.accepts_medicaid ? "Yes" : "No"} />
          {provider.cost_notes && <InfoRow label="Cost Notes" value={provider.cost_notes} />}
          {provider.description && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="text-xs font-medium text-gray-400 mb-1">Description</p>
              <p className="text-sm text-gray-600">{provider.description}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Contact & Location</h2>
            {provider.address && <InfoRow label="Address" value={provider.address} />}
            <InfoRow label="City" value={`${provider.city}, ${provider.state} ${provider.zip_code || ""}`} />
            {provider.region && <InfoRow label="Region" value={provider.region} />}
            {provider.phone && <InfoRow label="Phone" value={provider.phone} />}
            {provider.email && <InfoRow label="Email" value={provider.email} />}
            {provider.website && <InfoRow label="Website" value={provider.website} />}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Metadata</h2>
            <InfoRow label="Created" value={new Date(provider.created_at).toLocaleDateString()} />
            <InfoRow label="Updated" value={new Date(provider.updated_at).toLocaleDateString()} />
            <InfoRow label="Last Verified" value={provider.last_verified_at ? new Date(provider.last_verified_at).toLocaleDateString() : "Never"} />
            {provider.staff_notes && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-400 mb-1">Staff Notes</p>
                <p className="text-sm text-gray-600">{provider.staff_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 text-right max-w-[60%]">{value}</span>
    </div>
  );
}
