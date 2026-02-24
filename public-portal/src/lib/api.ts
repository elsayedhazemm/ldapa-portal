const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ProviderCard {
  id: string;
  name: string;
  organization: string | null;
  service_types: string[];
  city: string;
  zip_code: string | null;
  cost_tier: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  specializations: string[];
  serves_ages: string[];
  insurance_accepted: boolean;
  accepts_medicaid: boolean;
  cost_notes: string | null;
}

export interface ChatResponse {
  session_id: string;
  response: string;
  providers: ProviderCard[];
  escalate: boolean;
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  sessionId?: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history,
      session_id: sessionId || null,
    }),
  });
  if (!res.ok) throw new Error("Chat request failed");
  return res.json();
}

export async function submitFeedback(
  messageId: string,
  sessionId: string,
  rating: "up" | "down"
): Promise<void> {
  await fetch(`${API_BASE}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message_id: messageId,
      session_id: sessionId,
      rating,
    }),
  });
}
