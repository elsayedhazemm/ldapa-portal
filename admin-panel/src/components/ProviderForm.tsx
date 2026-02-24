"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SERVICE_TYPES = ["evaluator", "tutor", "advocate", "therapist", "school_psychologist", "clinic", "support_group", "nonprofit_org"];
const SPECIALIZATIONS = ["dyslexia", "adhd", "dyscalculia", "dysgraphia", "general_ld", "adult_ld", "iep_504", "workplace_accommodations"];
const AGE_GROUPS = ["children", "adolescents", "adults"];
const COST_TIERS = ["free", "sliding_scale", "low_cost", "standard"];

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
    organization: (initialData?.organization as string) || "",
    service_types: (initialData?.service_types as string[]) || [],
    specializations: (initialData?.specializations as string[]) || [],
    serves_ages: (initialData?.serves_ages as string[]) || [],
    address: (initialData?.address as string) || "",
    city: (initialData?.city as string) || "",
    state: (initialData?.state as string) || "PA",
    zip_code: (initialData?.zip_code as string) || "",
    region: (initialData?.region as string) || "",
    cost_tier: (initialData?.cost_tier as string) || "standard",
    insurance_accepted: (initialData?.insurance_accepted as boolean) || false,
    accepts_medicaid: (initialData?.accepts_medicaid as boolean) || false,
    cost_notes: (initialData?.cost_notes as string) || "",
    phone: (initialData?.phone as string) || "",
    email: (initialData?.email as string) || "",
    website: (initialData?.website as string) || "",
    description: (initialData?.description as string) || "",
    staff_notes: (initialData?.staff_notes as string) || "",
    verification_status: (initialData?.verification_status as string) || "unverified",
  });

  const toggleArrayItem = (field: "service_types" | "specializations" | "serves_ages", item: string) => {
    setForm((prev) => {
      const arr = prev[field] as string[];
      return {
        ...prev,
        [field]: arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.city || form.service_types.length === 0) {
      setError("Name, city, and at least one service type are required.");
      return;
    }

    setLoading(true);
    try {
      const submitData: Record<string, unknown> = { ...form };
      if (!submitData.organization) delete submitData.organization;
      await onSubmit(submitData);
      router.push("/dashboard/providers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

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
            <Field label="Organization" value={form.organization} onChange={(v) => setForm({ ...form, organization: v })} />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Service Types *</label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_TYPES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleArrayItem("service_types", s)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      form.service_types.includes(s)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Specializations</label>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleArrayItem("specializations", s)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      form.specializations.includes(s)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Cost Tier *</label>
              <select
                value={form.cost_tier}
                onChange={(e) => setForm({ ...form, cost_tier: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              >
                {COST_TIERS.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.insurance_accepted}
                  onChange={(e) => setForm({ ...form, insurance_accepted: e.target.checked })}
                />
                Accepts Insurance
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.accepts_medicaid}
                  onChange={(e) => setForm({ ...form, accepts_medicaid: e.target.checked })}
                />
                Accepts Medicaid
              </label>
            </div>

            <Field label="Cost Notes" value={form.cost_notes} onChange={(v) => setForm({ ...form, cost_notes: v })} />
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="City *" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              <Field label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="ZIP Code" value={form.zip_code} onChange={(v) => setForm({ ...form, zip_code: v })} />
              <Field label="Region" value={form.region} onChange={(v) => setForm({ ...form, region: v })} />
            </div>

            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
            <Field label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Ages Served</label>
              <div className="flex gap-3">
                {AGE_GROUPS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleArrayItem("serves_ages", a)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      form.serves_ages.includes(a)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              />
            </div>

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
