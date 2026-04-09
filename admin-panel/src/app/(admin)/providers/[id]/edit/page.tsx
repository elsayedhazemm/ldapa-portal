"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, FileCheck, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getProvider, updateProvider, verifyProvider } from "@/lib/api";

export default function EditProviderPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    profession_name: "Tutor",
    services: "",
    training: "",
    credentials: "",
    license: "",
    city: "",
    state_code: "PA",
    zip_code: "",
    address: "",
    age_range_served: "",
    grades_offered: "",
    price_per_visit: "",
    sliding_scale: false,
    insurance_accepted: "",
    ld_adhd_specialty: false,
    learning_difference_support: false,
    adhd_support: false,
    phone: "",
    email: "",
    website: "",
    staff_notes: "",
  });

  useEffect(() => {
    async function fetchProvider() {
      try {
        const data = await getProvider(id);
        setFormData({
          name: data.name || "",
          profession_name: data.profession_name || "Tutor",
          services: data.services || "",
          training: data.training || "",
          credentials: data.credentials || "",
          license: data.license || "",
          city: data.city || "",
          state_code: data.state_code || "PA",
          zip_code: data.zip_code || "",
          address: data.address || "",
          age_range_served: data.age_range_served || "",
          grades_offered: data.grades_offered || "",
          price_per_visit: data.price_per_visit || "",
          sliding_scale: data.sliding_scale || false,
          insurance_accepted: data.insurance_accepted || "",
          ld_adhd_specialty: data.ld_adhd_specialty || false,
          learning_difference_support: data.learning_difference_support || false,
          adhd_support: data.adhd_support || false,
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          staff_notes: data.staff_notes || "",
        });
      } catch (e) {
        console.error("Failed to fetch provider:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchProvider();
  }, [id]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Provider name is required";
    if (!formData.profession_name) newErrors.profession_name = "Profession type is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (andVerify: boolean = false) => {
    if (!validate()) { setSaveStatus("error"); return; }
    setSaveStatus("saving");
    try {
      await updateProvider(id, formData);
      if (andVerify) {
        await verifyProvider(id);
      }
      setSaveStatus("success");
      setTimeout(() => router.push(`/providers/${id}`), 1000);
    } catch (e) {
      console.error("Failed to save:", e);
      setSaveStatus("error");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 text-lg">Loading provider...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/providers/${id}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          Back to Provider Detail
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">Edit Provider</h1>
        <p className="text-gray-600 mt-2">
          Fields marked with <span className="text-red-600">*</span> are required
        </p>
      </div>

      {/* Status Messages */}
      {saveStatus === "success" && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">Success!</p>
            <p className="text-sm text-green-800">Provider saved successfully. Redirecting...</p>
          </div>
        </div>
      )}
      {saveStatus === "error" && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-800">Please fix the errors below before saving.</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Provider Name <span className="text-red-600">*</span></Label>
              <Input id="name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} className={`mt-1 ${errors.name ? "border-red-500" : ""}`} />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="profession">Profession Type <span className="text-red-600">*</span></Label>
              <Select value={formData.profession_name} onValueChange={(v) => handleChange("profession_name", v)}>
                <SelectTrigger id="profession" className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tutor">Tutor</SelectItem>
                  <SelectItem value="Health_Professional">Health Professional</SelectItem>
                  <SelectItem value="Lawyer">Lawyer</SelectItem>
                  <SelectItem value="School">School</SelectItem>
                  <SelectItem value="Advocate">Advocate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="credentials">Credentials / License</Label>
              <Input id="credentials" value={formData.credentials} onChange={(e) => handleChange("credentials", e.target.value)} className="mt-1" placeholder="e.g., PSY-12345" />
            </div>
          </div>
        </div>

        {/* Services & Training */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Services & Training</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="services">Services</Label>
              <Input id="services" value={formData.services} onChange={(e) => handleChange("services", e.target.value)} className="mt-1" placeholder="e.g., Therapist, Counselor" />
            </div>
            <div>
              <Label htmlFor="training">Training / Methodology</Label>
              <Input id="training" value={formData.training} onChange={(e) => handleChange("training", e.target.value)} className="mt-1" placeholder="e.g., Orton-Gillingham, Wilson Language" />
            </div>
            <div>
              <Label htmlFor="age_range">Ages Served</Label>
              <Input id="age_range" value={formData.age_range_served} onChange={(e) => handleChange("age_range_served", e.target.value)} className="mt-1" placeholder="e.g., Children, Adolescents, Adults" />
            </div>
            <div>
              <Label htmlFor="grades">Grades Offered (schools only)</Label>
              <Input id="grades" value={formData.grades_offered} onChange={(e) => handleChange("grades_offered", e.target.value)} className="mt-1" placeholder="e.g., Grades 1-8" />
            </div>
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-gray-700">Specialty Flags</p>
              <div className="flex items-center gap-3">
                <Checkbox id="ld_adhd" checked={formData.ld_adhd_specialty} onCheckedChange={(c) => handleChange("ld_adhd_specialty", c as boolean)} />
                <Label htmlFor="ld_adhd" className="cursor-pointer">LD/ADHD Specialty</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="ld_support" checked={formData.learning_difference_support} onCheckedChange={(c) => handleChange("learning_difference_support", c as boolean)} />
                <Label htmlFor="ld_support" className="cursor-pointer">Learning Difference Support</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="adhd_support" checked={formData.adhd_support} onCheckedChange={(c) => handleChange("adhd_support", c as boolean)} />
                <Label htmlFor="adhd_support" className="cursor-pointer">ADHD Support</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} className="mt-1" placeholder="e.g., Philadelphia" />
            </div>
            <div>
              <Label htmlFor="zip">ZIP Code</Label>
              <Input id="zip" value={formData.zip_code} onChange={(e) => handleChange("zip_code", e.target.value)} className="mt-1" placeholder="e.g., 19103" />
            </div>
          </div>
        </div>

        {/* Cost & Insurance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cost & Insurance</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="price">Price Per Visit</Label>
              <Input id="price" value={formData.price_per_visit} onChange={(e) => handleChange("price_per_visit", e.target.value)} className="mt-1" placeholder="e.g., $150 - $250" />
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="sliding_scale" checked={formData.sliding_scale} onCheckedChange={(c) => handleChange("sliding_scale", c as boolean)} />
              <Label htmlFor="sliding_scale" className="cursor-pointer">Sliding scale available</Label>
            </div>
            <div>
              <Label htmlFor="insurance">Insurance Accepted</Label>
              <Input id="insurance" value={formData.insurance_accepted} onChange={(e) => handleChange("insurance_accepted", e.target.value)} className="mt-1" placeholder="e.g., Aetna, Cigna, Highmark" />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" value={formData.website} onChange={(e) => handleChange("website", e.target.value)} className="mt-1" placeholder="https://example.com" />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Internal Notes</h2>
          <Textarea value={formData.staff_notes} onChange={(e) => handleChange("staff_notes", e.target.value)} rows={3} placeholder="Internal notes (not visible to users)" />
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold text-blue-900">About Provider Visibility</p>
            <p className="text-sm text-blue-800 mt-1">Use &quot;Save &amp; Verify&quot; to make this provider visible to the chat interface, or just save to keep current status.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 bg-white rounded-lg p-6">
          <Button variant="outline" onClick={() => router.push(`/providers/${id}`)} disabled={saveStatus === "saving"}>
            Cancel
          </Button>
          <Button onClick={() => handleSave(false)} disabled={saveStatus === "saving"} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="w-4 h-4 mr-2" />
            {saveStatus === "saving" ? "Saving..." : "Save Provider"}
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saveStatus === "saving"} className="bg-green-600 hover:bg-green-700 text-white">
            <FileCheck className="w-4 h-4 mr-2" />Save & Verify
          </Button>
        </div>
      </div>
    </div>
  );
}
