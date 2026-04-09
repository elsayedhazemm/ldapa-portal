"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Mail, Phone, Globe, MapPin, DollarSign, Calendar,
  Flag, Edit, CheckCircle, User, AlertTriangle, Archive,
  Eye, EyeOff, Clock, Shield, Users, FileText, Trash2, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getProvider, verifyProvider, archiveProvider, deleteProvider, updateProvider } from "@/lib/api";

interface ApiProvider {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  listing_type: string | null;
  profession_name: string;
  services: string | null;
  training: string | null;
  credentials: string | null;
  license: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  state_code: string;
  zip_code: string | null;
  lat: number | null;
  lon: number | null;
  age_range_served: string | null;
  grades_offered: string | null;
  price_per_visit: string | null;
  sliding_scale: boolean;
  insurance_accepted: string | null;
  ld_adhd_specialty: boolean;
  learning_difference_support: boolean;
  adhd_support: boolean;
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
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [provider, setProvider] = useState<ApiProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffNotes, setStaffNotes] = useState("");

  useEffect(() => {
    async function fetchProvider() {
      try {
        const data = await getProvider(id);
        setProvider(data);
        setStaffNotes(data.staff_notes || "");
      } catch (e) {
        console.error("Failed to fetch provider:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchProvider();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 text-lg">Loading provider...</p>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Provider not found</p>
          <Button onClick={() => router.push("/providers")} className="mt-4">Back to Directory</Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string; icon: typeof CheckCircle }> = {
      verified: { className: "bg-green-100 text-green-800 border-green-200", label: "Verified", icon: CheckCircle },
      unverified: { className: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Unverified", icon: Clock },
      archived: { className: "bg-gray-100 text-gray-800 border-gray-200", label: "Archived", icon: Archive },
    };
    const variant = variants[status] || variants.unverified;
    const Icon = variant.icon;
    return (
      <Badge className={`${variant.className} border text-base px-3 py-1 flex items-center gap-1.5 w-fit`} variant="outline">
        <Icon className="w-4 h-4" aria-hidden="true" />
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

  const handleMarkVerified = async () => {
    try {
      await verifyProvider(id);
      setProvider((prev) => prev ? { ...prev, verification_status: "verified", last_verified_at: new Date().toISOString() } : null);
      alert("Provider marked as verified!");
    } catch (e) {
      console.error("Failed to verify:", e);
      alert("Failed to verify provider.");
    }
  };

  const handleArchive = async () => {
    if (confirm("Are you sure you want to archive this provider?")) {
      try {
        await archiveProvider(id);
        setProvider((prev) => prev ? { ...prev, verification_status: "archived" } : null);
        alert("Provider archived.");
      } catch (e) {
        console.error("Failed to archive:", e);
        alert("Failed to archive provider.");
      }
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to permanently delete "${provider.name}"? This action cannot be undone.`)) {
      try {
        await deleteProvider(id);
        alert(`Provider "${provider.name}" deleted.`);
        router.push("/providers");
      } catch (e) {
        console.error("Failed to delete:", e);
        alert("Failed to delete provider.");
      }
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updateProvider(id, { staff_notes: staffNotes });
      setProvider((prev) => prev ? { ...prev, staff_notes: staffNotes } : null);
      alert("Notes saved.");
    } catch (e) {
      console.error("Failed to save notes:", e);
      alert("Failed to save notes.");
    }
  };

  const isVisible = provider.verification_status === "verified";

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/providers" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          Back to Provider Directory
        </Link>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">{provider.name}</h1>
            <p className="text-lg text-gray-600">{professionLabel(provider.profession_name)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(provider.verification_status)}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push(`/providers/${id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" aria-hidden="true" />Edit Provider
              </Button>
            </div>
          </div>
        </div>

        {!isVisible && provider.verification_status !== "archived" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3 mb-4">
            <EyeOff className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-yellow-900">Not Visible to Chat Interface</p>
              <p className="text-sm text-yellow-800 mt-1">This provider is not currently visible to families using the chat. Verify to make them discoverable.</p>
            </div>
          </div>
        )}

        {isVisible && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 mb-4">
            <Eye className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-green-900">Visible to Chat Interface</p>
              <p className="text-sm text-green-800 mt-1">This provider is currently discoverable by families using the chat.</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Provider Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" aria-hidden="true" />Provider Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Profession Type</p>
                  <p className="text-base text-gray-900">{professionLabel(provider.profession_name)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Location</p>
                  <p className="text-base text-gray-900">
                    {[provider.city, provider.state_code, provider.zip_code].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Cost</p>
                  <p className="text-base text-gray-900">{provider.price_per_visit || "Contact for pricing"}</p>
                  {provider.sliding_scale && <p className="text-sm text-green-700 font-medium">Sliding scale available</p>}
                </div>
              </div>
              {provider.credentials && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Credentials</p>
                  <p className="text-base text-gray-900">{provider.credentials}</p>
                </div>
              )}
              {provider.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
                    <a href={`tel:${provider.phone}`} className="text-base text-blue-600 hover:text-blue-800">{provider.phone}</a>
                  </div>
                </div>
              )}
              {provider.email && (
                <div className="flex items-start gap-2">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                    <a href={`mailto:${provider.email}`} className="text-base text-blue-600 hover:text-blue-800 break-all">{provider.email}</a>
                  </div>
                </div>
              )}
              {provider.website && (
                <div className="flex items-start gap-2 md:col-span-2">
                  <Globe className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Website</p>
                    <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-base text-blue-600 hover:text-blue-800 break-all">{provider.website}</a>
                  </div>
                </div>
              )}
              {provider.services && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500 mb-1">Services</p>
                  <p className="text-base text-gray-900">{provider.services}</p>
                </div>
              )}
              {provider.training && (
                <div className="md:col-span-2 flex items-start gap-2">
                  <BookOpen className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Training / Methodology</p>
                    <p className="text-base text-gray-900">{provider.training}</p>
                  </div>
                </div>
              )}
              {provider.age_range_served && (
                <div className="md:col-span-2 flex items-start gap-2">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Ages Served</p>
                    <p className="text-base text-gray-900">{provider.age_range_served}</p>
                  </div>
                </div>
              )}
              {provider.insurance_accepted && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500 mb-1">Insurance Accepted</p>
                  <p className="text-base text-gray-900">{provider.insurance_accepted}</p>
                </div>
              )}
              {provider.grades_offered && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500 mb-1">Grades Offered</p>
                  <p className="text-base text-gray-900">{provider.grades_offered}</p>
                </div>
              )}
              {/* Specialty flags */}
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-2">Specialty Flags</p>
                <div className="flex flex-wrap gap-2">
                  {provider.ld_adhd_specialty && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">LD/ADHD Specialty</Badge>}
                  {provider.learning_difference_support && <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Learning Difference Support</Badge>}
                  {provider.adhd_support && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">ADHD Support</Badge>}
                  {!provider.ld_adhd_specialty && !provider.learning_difference_support && !provider.adhd_support && (
                    <span className="text-sm text-gray-400">None set</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Verification Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" aria-hidden="true" />Verification Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                <p className="text-base text-gray-900 capitalize">{provider.verification_status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Last Verified</p>
                <p className="text-base text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {provider.last_verified_at ? new Date(provider.last_verified_at).toLocaleDateString() : "Never"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Created</p>
                <p className="text-base text-gray-900">{new Date(provider.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Last Updated</p>
                <p className="text-base text-gray-900">{new Date(provider.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Internal Staff Notes */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <Label htmlFor="staff-notes" className="text-xl font-semibold text-gray-900 mb-4 block flex items-center gap-2">
              <FileText className="w-5 h-5" />Internal Staff Notes
            </Label>
            <p className="text-sm text-gray-600 mb-3">These notes are for internal use only and are not visible to end users or the chat interface.</p>
            <Textarea id="staff-notes" value={staffNotes} onChange={(e) => setStaffNotes(e.target.value)} rows={4} className="mb-3" placeholder="Add internal notes about this provider..." />
            <Button variant="outline" size="sm" onClick={handleSaveNotes}>Save Notes</Button>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white justify-start" onClick={handleMarkVerified}>
                <CheckCircle className="w-4 h-4 mr-2" />Mark as Verified
              </Button>
              <Button variant="outline" className="w-full border-gray-600 text-gray-700 hover:bg-gray-50 justify-start" onClick={handleArchive}>
                <Archive className="w-4 h-4 mr-2" />Archive Provider
              </Button>
              <Button variant="outline" className="w-full border-red-600 text-red-700 hover:bg-red-50 justify-start" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />Delete Provider
              </Button>
            </div>
          </div>

          {!isVisible && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />Action Required
              </h4>
              <p className="text-sm text-yellow-800">This provider is not currently visible to the chat interface. Verify their information to make them discoverable to families.</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">About Verification</h4>
            <p className="text-sm text-blue-800">Providers should be re-verified periodically to ensure information accuracy for families using the chat interface.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
