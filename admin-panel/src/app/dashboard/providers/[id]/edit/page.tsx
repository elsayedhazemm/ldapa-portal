"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ProviderForm from "@/components/ProviderForm";
import { getProvider, updateProvider } from "@/lib/api";

export default function EditProviderPage() {
  const params = useParams();
  const [provider, setProvider] = useState<Record<string, unknown> | null>(null);
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

  return (
    <ProviderForm
      title="Edit Provider"
      initialData={provider}
      onSubmit={async (data) => {
        await updateProvider(params.id as string, data);
      }}
    />
  );
}
