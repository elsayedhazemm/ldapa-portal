"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { sendChatMessage, submitFeedback, type ChatMessage, type ProviderCard } from "@/lib/api";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  providers?: ProviderCard[];
  escalate?: boolean;
  feedback?: "up" | "down" | null;
}

function CostBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    free: "bg-green-100 text-green-800",
    sliding_scale: "bg-blue-100 text-blue-800",
    low_cost: "bg-yellow-100 text-yellow-800",
    standard: "bg-gray-100 text-gray-800",
  };
  const labels: Record<string, string> = {
    free: "Free",
    sliding_scale: "Sliding Scale",
    low_cost: "Low Cost",
    standard: "Standard",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[tier] || colors.standard}`}>
      {labels[tier] || tier}
    </span>
  );
}

function ProviderCardComponent({ provider }: { provider: ProviderCard }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="my-2 rounded-lg border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start justify-between p-4 text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{provider.name}</span>
            <CostBadge tier={provider.cost_tier} />
          </div>
          <div className="mt-1 text-sm text-gray-500">
            {provider.service_types.map((s) => s.replace(/_/g, " ")).join(", ")} — {provider.city}
          </div>
        </div>
        <svg
          className={`ml-2 h-5 w-5 flex-shrink-0 text-gray-400 transition ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 text-sm">
          {provider.organization && (
            <p className="text-gray-600"><span className="font-medium">Organization:</span> {provider.organization}</p>
          )}
          {provider.description && (
            <p className="mt-2 text-gray-600">{provider.description}</p>
          )}
          {provider.specializations.length > 0 && (
            <p className="mt-2 text-gray-600">
              <span className="font-medium">Specializations:</span>{" "}
              {provider.specializations.map((s) => s.replace(/_/g, " ")).join(", ")}
            </p>
          )}
          {provider.serves_ages.length > 0 && (
            <p className="mt-1 text-gray-600">
              <span className="font-medium">Ages served:</span>{" "}
              {provider.serves_ages.join(", ")}
            </p>
          )}
          {(provider.insurance_accepted || provider.accepts_medicaid) && (
            <p className="mt-1 text-gray-600">
              {provider.insurance_accepted && <span className="mr-3">Accepts insurance</span>}
              {provider.accepts_medicaid && <span>Accepts Medicaid</span>}
            </p>
          )}
          {provider.cost_notes && (
            <p className="mt-1 text-gray-600"><span className="font-medium">Cost details:</span> {provider.cost_notes}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-3">
            {provider.phone && (
              <a href={`tel:${provider.phone}`} className="text-blue-600 hover:underline">
                {provider.phone}
              </a>
            )}
            {provider.website && (
              <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Website
              </a>
            )}
            {provider.email && (
              <a href={`mailto:${provider.email}`} className="text-blue-600 hover:underline">
                Email
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EscalationCard() {
  return (
    <div className="my-3 rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <h4 className="font-semibold text-amber-900">Contact LDA OF PA Directly</h4>
          <p className="mt-1 text-sm text-amber-800">
            This is something best handled by a person — here&apos;s how to reach LDA OF PA directly.
          </p>
          <div className="mt-3 space-y-1 text-sm">
            <p><span className="font-medium">Phone:</span> (412) 555-1234</p>
            <p><span className="font-medium">Email:</span>{" "}
              <a href="mailto:info@ldapa.org" className="text-blue-600 hover:underline">info@ldapa.org</a>
            </p>
            <p><span className="font-medium">Hours:</span> Mon-Fri 9am-5pm ET</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackThumbs({
  messageId,
  sessionId,
  currentFeedback,
  onFeedback,
}: {
  messageId: string;
  sessionId: string;
  currentFeedback: "up" | "down" | null;
  onFeedback: (rating: "up" | "down") => void;
}) {
  const handleClick = async (rating: "up" | "down") => {
    onFeedback(rating);
    try {
      await submitFeedback(messageId, sessionId, rating);
    } catch {
      // Silently fail — feedback is non-critical
    }
  };

  return (
    <div className="mt-1 flex items-center gap-1">
      <button
        onClick={() => handleClick("up")}
        className={`rounded p-1 text-sm transition ${
          currentFeedback === "up"
            ? "bg-green-100 text-green-700"
            : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        }`}
        title="Helpful"
      >
        👍
      </button>
      <button
        onClick={() => handleClick("down")}
        className={`rounded p-1 text-sm transition ${
          currentFeedback === "down"
            ? "bg-red-100 text-red-700"
            : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        }`}
        title="Not helpful"
      >
        👎
      </button>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialPromptHandled = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = useCallback(async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    if (!messageText) setInput("");

    const userMsg: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendChatMessage(text, history, sessionId || undefined);
      setSessionId(response.session_id);

      const assistantMsg: DisplayMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.response,
        providers: response.providers,
        escalate: response.escalate,
        feedback: null,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: DisplayMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or contact LDA OF PA directly at info@ldapa.org.",
        feedback: null,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, sessionId]);

  // Handle quick-start prompt from URL
  useEffect(() => {
    if (initialPromptHandled.current) return;
    const prompt = searchParams.get("prompt");
    if (prompt) {
      initialPromptHandled.current = true;
      handleSend(prompt);
    }
  }, [searchParams, handleSend]);

  const handleReset = () => {
    setMessages([]);
    setSessionId(null);
    setInput("");
    inputRef.current?.focus();
  };

  const handleFeedback = (messageId: string, rating: "up" | "down") => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: rating } : m))
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            L
          </div>
          <span className="text-lg font-bold text-gray-900">LDA OF PA</span>
        </Link>
        <button
          onClick={handleReset}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Start Over
        </button>
      </header>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl">
          {messages.length === 0 && !isLoading && (
            <div className="py-20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
                <span className="text-3xl">💬</span>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                Welcome to LDA OF PA Chat
              </h2>
              <p className="mx-auto max-w-md text-gray-500">
                Ask me anything about learning disabilities, evaluations, IEPs,
                or finding support providers in Pennsylvania.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-800 shadow-sm border border-gray-100"
                }`}
              >
                <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                  {msg.content}
                </div>
                {msg.providers && msg.providers.length > 0 && (
                  <div className="mt-3">
                    {msg.providers.map((p) => (
                      <ProviderCardComponent key={p.id} provider={p} />
                    ))}
                  </div>
                )}
                {msg.escalate && <EscalationCard />}
                {msg.role === "assistant" && sessionId && (
                  <FeedbackThumbs
                    messageId={msg.id}
                    sessionId={sessionId}
                    currentFeedback={msg.feedback || null}
                    onFeedback={(rating) => handleFeedback(msg.id, rating)}
                  />
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="mb-4 flex justify-start">
              <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-1.5">
        <p className="text-center text-[11px] text-gray-400">
          This tool provides general information only. It does not diagnose conditions or provide legal or medical advice.
        </p>
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-[15px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
