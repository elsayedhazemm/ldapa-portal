"use client";

import ProviderForm from "@/components/ProviderForm";
import { createProvider } from "@/lib/api";

export default function NewProviderPage() {
  return (
    <ProviderForm
      title="Add Provider"
      onSubmit={async (data) => {
        await createProvider(data);
      }}
    />
  );
}
