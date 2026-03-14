import { getToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function authFetch(url: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Auth
export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  return res.json();
}

// Dashboard
export function getDashboardStats(period = "week") {
  return authFetch(`/api/admin/dashboard/stats?period=${period}`);
}

export function getChatVolume(period = "week") {
  return authFetch(`/api/admin/dashboard/chat-volume?period=${period}`);
}

export function getRecentSessions(page = 1, perPage = 20) {
  return authFetch(`/api/admin/dashboard/recent-sessions?page=${page}&per_page=${perPage}`);
}

export function getSession(id: string) {
  return authFetch(`/api/admin/dashboard/sessions/${id}`);
}

// Providers
export function getProviders(params: {
  search?: string;
  status?: string;
  profession?: string;
  city?: string;
  page?: number;
  per_page?: number;
} = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.profession) query.set("profession", params.profession);
  if (params.city) query.set("city", params.city);
  if (params.page) query.set("page", String(params.page));
  if (params.per_page) query.set("per_page", String(params.per_page));
  return authFetch(`/api/admin/providers?${query}`);
}

export function getProvider(id: string) {
  return authFetch(`/api/admin/providers/${id}`);
}

export function createProvider(data: Record<string, unknown>) {
  return authFetch("/api/admin/providers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProvider(id: string, data: Record<string, unknown>) {
  return authFetch(`/api/admin/providers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProvider(id: string) {
  return authFetch(`/api/admin/providers/${id}`, { method: "DELETE" });
}

export function verifyProvider(id: string) {
  return authFetch(`/api/admin/providers/${id}/verify`, { method: "PATCH" });
}

export function archiveProvider(id: string) {
  return authFetch(`/api/admin/providers/${id}/archive`, { method: "PATCH" });
}

export function bulkVerify(ids: string[]) {
  return authFetch("/api/admin/providers/bulk-verify", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

export function bulkArchive(ids: string[]) {
  return authFetch("/api/admin/providers/bulk-archive", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

export async function importPreview(file: File) {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/admin/providers/import/preview`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error("Import preview failed");
  return res.json();
}

export function importConfirm(providers: Record<string, unknown>[]) {
  return authFetch("/api/admin/providers/import/confirm", {
    method: "POST",
    body: JSON.stringify({ providers }),
  });
}
