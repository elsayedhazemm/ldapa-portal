"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PROFESSION_TYPES = ["Tutor", "Health_Professional", "Lawyer", "School", "Advocate"];

interface ProviderFormProps {
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  title: string;
}

export default function ProviderForm({ initialData, onSubmit, title }: ProviderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: (initialData?.name as string) || "",
    profession_name: (initialData?.profession_name as string) || "Tutor",
    listing_type: (initialData?.listing_type as string) || "Individual",
    services: (initialData?.services as string) || "",
    training: (initialData?.training as string) || "",
    credentials: (initialData?.credentials as string) || "",
    license: (initialData?.license as string) || "",
    address: (initialData?.address as string) || "",
    city: (initialData?.city as string) || "",
    state: (initialData?.state as string) || "PA",
    state_code: (initialData?.state_code as string) || "PA",
    zip_code: (initialData?.zip_code as string) || "",
    age_range_served: (initialData?.age_range_served as string) || "",
    price_per_visit: (initialData?.price_per_visit as string) || "",
    sliding_scale: (initialData?.sliding_scale as boolean) || false,
    insurance_accepted: (initialData?.insurance_accepted as string) || "",
    ld_adhd_specialty: (initialData?.ld_adhd_specialty as boolean) || false,
    learning_difference_support: (initialData?.learning_difference_support as boolean) || false,
    adhd_support: (initialData?.adhd_support as boolean) || false,
    phone: (initialData?.phone as string) || "",
    email: (initialData?.email as string) || "",
    website: (initialData?.website as string) || "",
    grades_offered: (initialData?.grades_offered as string) || "",
    student_body_type: (initialData?.student_body_type as string) || "",
    total_size: (initialData?.total_size as string) || "",
    religion: (initialData?.religion as string) || "",
    staff_notes: (initialData?.staff_notes as string) || "",
    verification_status: (initialData?.verification_status as string) || "unverified",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.profession_name) {
      setError("Name and profession type are required.");
      return;
    }

    setLoading(true);
    try {
      const submitData: Record<string, unknown> = { ...form };
      // Clean empty strings to null
      for (const key of Object.keys(submitData)) {
        if (submitData[key] === "") submitData[key] = null;
      }
      submitData.name = form.name; // ensure name is not null
      submitData.profession_name = form.profession_name;
      await onSubmit(submitData);
      router.push("/dashboard/providers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const isSchool = form.profession_name === "School";

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{title}</h1>
      <form onSubmit={handleSubmit} className="max-w-4xl">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column */}
          <div className="space-y-4">
            <Field label="Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Profession Type *</label>
              <select
                value={form.profession_name}
                onChange={(e) => setForm({ ...form, profession_name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              >
                {PROFESSION_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Listing Type</label>
              <select
                value={form.listing_type}
                onChange={(e) => setForm({ ...form, listing_type: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              >
                <option value="Individual">Individual</option>
                <option value="Company">Company</option>
              </select>
            </div>

            <Field label="Services" value={form.services} onChange={(v) => setForm({ ...form, services: v })} />
            <Field label="Training / Methodology" value={form.training} onChange={(v) => setForm({ ...form, training: v })} />
            <Field label="Credentials" value={form.credentials} onChange={(v) => setForm({ ...form, credentials: v })} />
            <Field label="License" value={form.license} onChange={(v) => setForm({ ...form, license: v })} />

            <Field label="Age Range Served" value={form.age_range_served} onChange={(v) => setForm({ ...form, age_range_served: v })} />
            <Field label="Price Per Visit" value={form.price_per_visit} onChange={(v) => setForm({ ...form, price_per_visit: v })} />
            <Field label="Insurance Accepted" value={form.insurance_accepted} onChange={(v) => setForm({ ...form, insurance_accepted: v })} />

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.sliding_scale} onChange={(e) => setForm({ ...form, sliding_scale: e.target.checked })} />
                Sliding Scale
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.ld_adhd_specialty} onChange={(e) => setForm({ ...form, ld_adhd_specialty: e.target.checked })} />
                LD/ADHD Specialty
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.learning_difference_support} onChange={(e) => setForm({ ...form, learning_difference_support: e.target.checked })} />
                LD Support
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.adhd_support} onChange={(e) => setForm({ ...form, adhd_support: e.target.checked })} />
                ADHD Support
              </label>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              <Field label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="State Code" value={form.state_code} onChange={(v) => setForm({ ...form, state_code: v })} />
              <Field label="ZIP Code" value={form.zip_code} onChange={(v) => setForm({ ...form, zip_code: v })} />
            </div>

            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
            <Field label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />

            {isSchool && (
              <>
                <Field label="Grades Offered" value={form.grades_offered} onChange={(v) => setForm({ ...form, grades_offered: v })} />
                <Field label="Student Body Type" value={form.student_body_type} onChange={(v) => setForm({ ...form, student_body_type: v })} />
                <Field label="Total Size" value={form.total_size} onChange={(v) => setForm({ ...form, total_size: v })} />
                <Field label="Religion" value={form.religion} onChange={(v) => setForm({ ...form, religion: v })} />
              </>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Staff Notes (internal)</label>
              <textarea
                value={form.staff_notes}
                onChange={(e) => setForm({ ...form, staff_notes: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              />
            </div>

            {initialData && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Verification Status</label>
                <select
                  value={form.verification_status}
                  onChange={(e) => setForm({ ...form, verification_status: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                >
                  <option value="unverified">Unverified</option>
                  <option value="verified">Verified</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Provider"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}
