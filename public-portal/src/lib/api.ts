const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ProviderCard {
  id: string;
  name: string;
  profession_name: string;
  services: string | null;
  training: string | null;
  city: string | null;
  state_code: string;
  zip_code: string | null;
  price_per_visit: string | null;
  sliding_scale: boolean;
  insurance_accepted: string | null;
  age_range_served: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  credentials: string | null;
  listing_type: string | null;
  grades_offered: string | null;
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
