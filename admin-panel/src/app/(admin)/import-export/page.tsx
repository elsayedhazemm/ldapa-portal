"use client";

import { useState, useRef } from "react";
import { Download, Upload, AlertCircle, CheckCircle, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { importPreview, importConfirm } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ImportExportPage() {
  const [previewData, setPreviewData] = useState<{ valid: Record<string, unknown>[]; warnings: string[]; errors: string[] } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "preview" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    // Direct download from backend
    const token = typeof window !== "undefined" ? localStorage.getItem("ldapa_admin_token") : null;
    window.open(`${API_BASE}/api/admin/providers/export?token=${token}`, "_blank");
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = await importPreview(file);
      setPreviewData(data);
      setImportStatus("preview");
    } catch (e) {
      setErrorMessage("Failed to preview CSV file. Please check the format.");
      setImportStatus("error");
    }
  };

  const handleImport = async () => {
    if (!previewData?.valid?.length) return;
    setIsImporting(true);
    try {
      await importConfirm(previewData.valid);
      setImportStatus("success");
      setTimeout(() => { setImportStatus("idle"); setPreviewData(null); }, 3000);
    } catch (e) {
      setErrorMessage("Failed to import providers.");
      setImportStatus("error");
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancel = () => {
    setImportStatus("idle");
    setPreviewData(null);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Bulk Import/Export</h1>
        <p className="text-gray-600">Import or export provider data in CSV format</p>
      </div>

      {importStatus === "success" && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">Import Successful!</p>
            <p className="text-sm text-green-800">{previewData?.valid?.length || 0} provider(s) imported.</p>
          </div>
        </div>
      )}

      {importStatus === "error" && errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      {/* Export */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Download className="w-5 h-5" />Export Providers
            </h2>
            <p className="text-gray-600 mb-4">Download all provider data as a CSV file. This file can be edited and re-imported.</p>
            <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="w-4 h-4 mr-2" />Export to CSV
            </Button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 max-w-sm">
            <p className="font-semibold mb-2">Export includes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>All provider information</li>
              <li>Verification status</li>
              <li>Contact details</li>
              <li>Service information</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Import */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Upload className="w-5 h-5" />Import Providers
        </h2>
        <p className="text-gray-600 mb-4">Upload a CSV file to add or update multiple providers at once.</p>

        {importStatus === "idle" && (
          <div>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" id="csv-upload" />
            <label htmlFor="csv-upload">
              <Button asChild className="bg-green-600 hover:bg-green-700 text-white cursor-pointer">
                <span><Upload className="w-4 h-4 mr-2" />Select CSV File</span>
              </Button>
            </label>
          </div>
        )}

        {importStatus === "preview" && previewData && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-5 h-5 text-green-600" /><p className="font-semibold text-green-900">Valid Rows</p></div>
                <p className="text-2xl font-bold text-green-700">{previewData.valid.length}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1"><AlertCircle className="w-5 h-5 text-red-600" /><p className="font-semibold text-red-900">Errors</p></div>
                <p className="text-2xl font-bold text-red-700">{previewData.errors.length}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-5 h-5 text-yellow-600" /><p className="font-semibold text-yellow-900">Warnings</p></div>
                <p className="text-2xl font-bold text-yellow-700">{previewData.warnings.length}</p>
              </div>
            </div>

            {previewData.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-semibold text-red-900 mb-2">Errors:</p>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                  {previewData.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCancel}><X className="w-4 h-4 mr-2" />Cancel</Button>
              <Button onClick={handleImport} disabled={previewData.valid.length === 0 || isImporting} className="bg-green-600 hover:bg-green-700 text-white">
                <Upload className="w-4 h-4 mr-2" />{isImporting ? "Importing..." : `Import ${previewData.valid.length} Valid Row(s)`}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">CSV Format Guidelines</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Required columns:</strong> Name, Profession Name</p>
          <p><strong>Optional columns:</strong> City, State Code, ZIP Code, Phone, Email, Website, Services, Training, Price Per Visit, Insurance Accepted, Age Range Served</p>
          <p><strong>Profession types:</strong> Tutor, Health_Professional, Lawyer, School, Advocate</p>
          <p className="pt-2 font-semibold">Tip: Export existing data to see the correct format, then modify and re-import.</p>
        </div>
      </div>
    </div>
  );
}
