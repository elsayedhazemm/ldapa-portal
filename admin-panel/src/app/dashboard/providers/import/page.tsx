"use client";

import { useState, useRef } from "react";
import { importPreview, importConfirm } from "@/lib/api";

interface ParsedProvider {
  name: string;
  profession_name: string;
  city: string | null;
  [key: string]: unknown;
}

export default function ImportPage() {
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [valid, setValid] = useState<ParsedProvider[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const result = await importPreview(file);
      setValid(result.valid || []);
      setWarnings(result.warnings || []);
      setErrors(result.errors || []);
      setStep("preview");
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Upload failed"]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await importConfirm(valid);
      setImportResult(result);
      setStep("done");
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Import failed"]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("upload");
    setFile(null);
    setValid([]);
    setWarnings([]);
    setErrors([]);
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Bulk Import Providers</h1>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-4">
        {["Upload", "Preview", "Done"].map((label, i) => {
          const stepNames = ["upload", "preview", "done"];
          const current = stepNames.indexOf(step);
          const isActive = i <= current;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                isActive ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {i + 1}
              </div>
              <span className={`text-sm ${isActive ? "font-medium text-gray-900" : "text-gray-400"}`}>{label}</span>
              {i < 2 && <div className="mx-2 h-px w-8 bg-gray-300" />}
            </div>
          );
        })}
      </div>

      {step === "upload" && (
        <div className="max-w-lg">
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <div className="text-4xl mb-3">&#128196;</div>
              <p className="text-sm font-medium text-gray-700">
                {file ? file.name : "Click to upload CSV file"}
              </p>
              <p className="mt-1 text-xs text-gray-400">LDA of PA directory export CSV format</p>
            </label>
          </div>
          {file && (
            <button
              onClick={handleUpload}
              disabled={loading}
              className="mt-4 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Preview Import"}
            </button>
          )}
          <div className="mt-6 rounded-lg bg-gray-50 p-4 text-xs text-gray-500">
            <p className="font-medium mb-1">Supported format:</p>
            <p>LDA of PA directory CSV export with columns: first_name, last_name, profession_name, address1, state_code, zip_code, services, training, phone_number, Email, website, etc.</p>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div>
          {errors.length > 0 && (
            <div className="mb-4 rounded-lg bg-red-50 p-4">
              <h3 className="text-sm font-medium text-red-800">Errors ({errors.length})</h3>
              <ul className="mt-1 text-xs text-red-700 space-y-1 max-h-40 overflow-y-auto">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="mb-4 rounded-lg bg-yellow-50 p-4">
              <h3 className="text-sm font-medium text-yellow-800">Warnings ({warnings.length})</h3>
              <ul className="mt-1 text-xs text-yellow-700 space-y-1 max-h-40 overflow-y-auto">
                {warnings.slice(0, 20).map((w, i) => <li key={i}>{w}</li>)}
                {warnings.length > 20 && <li>... and {warnings.length - 20} more</li>}
              </ul>
            </div>
          )}

          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
            {valid.length} provider(s) ready to import
          </div>

          {valid.length > 0 && (
            <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Type</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">City</th>
                  </tr>
                </thead>
                <tbody>
                  {valid.slice(0, 50).map((p, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-4 py-2 text-gray-900">{p.name}</td>
                      <td className="px-4 py-2 text-gray-600">{(p.profession_name || "").replace(/_/g, " ")}</td>
                      <td className="px-4 py-2 text-gray-600">{p.city || "—"}</td>
                    </tr>
                  ))}
                  {valid.length > 50 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-center text-gray-400 text-xs">
                        ... and {valid.length - 50} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              disabled={loading || valid.length === 0}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Importing..." : `Import ${valid.length} Providers`}
            </button>
            <button onClick={reset} className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === "done" && importResult && (
        <div className="max-w-lg text-center py-12">
          <div className="text-5xl mb-4">&#9989;</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Import Complete</h2>
          <p className="text-gray-600 mb-6">
            {importResult.imported} providers imported, {importResult.skipped} skipped.
          </p>
          <button onClick={reset} className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
            Import More
          </button>
        </div>
      )}
    </div>
  );
}
