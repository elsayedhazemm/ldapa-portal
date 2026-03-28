"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProvider, verifyProvider, archiveProvider, deleteProvider } from "@/lib/api";

interface Provider {
  id: string;
  name: string;
  profession_name: string;
  listing_type: string | null;
  services: string | null;
  training: string | null;
  credentials: string | null;
  license: string | null;
  address: string | null;
  city: string | null;
  state: string;
  state_code: string;
  zip_code: string | null;
  age_range_served: string | null;
  grades_offered: string | null;
  price_per_visit: string | null;
  sliding_scale: boolean;
  insurance_accepted: string | null;
  ld_adhd_specialty: boolean;
  learning_difference_support: boolean;
  adhd_support: boolean;
  student_body_type: string | null;
  total_size: string | null;
  religion: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  profile_url: string | null;
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
          <p className="text-gray-500">{provider.profession_name.replace(/_/g, " ")}</p>
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
          <InfoRow label="Profession" value={provider.profession_name.replace(/_/g, " ")} />
          {provider.listing_type && <InfoRow label="Listing Type" value={provider.listing_type} />}
          {provider.services && <InfoRow label="Services" value={provider.services.replace(/=>/g, " \u2192 ").replace(/,/g, ", ")} />}
          {provider.training && <InfoRow label="Training" value={provider.training} />}
          {provider.credentials && <InfoRow label="Credentials" value={provider.credentials} />}
          {provider.license && <InfoRow label="License" value={provider.license} />}
          {provider.age_range_served && <InfoRow label="Ages Served" value={provider.age_range_served} />}
          {provider.price_per_visit && <InfoRow label="Price Per Visit" value={provider.price_per_visit} />}
          <InfoRow label="Sliding Scale" value={provider.sliding_scale ? "Yes" : "No"} />
          {provider.insurance_accepted && <InfoRow label="Insurance" value={provider.insurance_accepted} />}
          <InfoRow label="LD/ADHD Specialty" value={provider.ld_adhd_specialty ? "Yes" : "No"} />
          {provider.grades_offered && <InfoRow label="Grades Offered" value={provider.grades_offered} />}
          {provider.student_body_type && <InfoRow label="Student Body" value={provider.student_body_type} />}
          {provider.total_size && <InfoRow label="Total Size" value={provider.total_size} />}
          {provider.religion && <InfoRow label="Religion" value={provider.religion} />}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Contact & Location</h2>
            {provider.address && <InfoRow label="Address" value={provider.address} />}
            <InfoRow label="Location" value={`${provider.city || ""}, ${provider.state_code} ${provider.zip_code || ""}`} />
            {provider.phone && <InfoRow label="Phone" value={provider.phone} />}
            {provider.email && <InfoRow label="Email" value={provider.email} />}
            {provider.website && <InfoRow label="Website" value={provider.website} />}
            {provider.profile_url && <InfoRow label="Profile URL" value={provider.profile_url} />}
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
