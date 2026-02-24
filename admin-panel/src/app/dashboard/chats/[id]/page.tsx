"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/api";

interface Message {
  id: string;
  role: string;
  content: string;
  providers_shown: string;
  created_at: string;
}

interface Feedback {
  id: string;
  message_id: string;
  rating: string;
  created_at: string;
}

interface SessionData {
  session: {
    id: string;
    started_at: string;
    last_message_at: string;
    message_count: number;
    user_location: { city?: string; zip?: string } | null;
    escalated: number;
  };
  messages: Message[];
  feedback: Feedback[];
}

export default function SessionDetailPage() {
  const params = useParams();
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      getSession(params.id as string)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;
  if (!data) return <div className="p-6 text-gray-400">Session not found</div>;

  const feedbackMap = new Map(data.feedback.map((f) => [f.message_id, f.rating]));

  return (
    <div className="p-6">
      <Link href="/dashboard/chats" className="text-sm text-blue-600 hover:underline">
        &larr; Back to Chat Review
      </Link>

      <div className="mt-2 mb-6 flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Session Transcript</h1>
        {data.session.escalated ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">Escalated</span>
        ) : null}
      </div>

      <div className="mb-6 flex gap-6 text-sm text-gray-500">
        <span>Started: {new Date(data.session.started_at).toLocaleString()}</span>
        <span>{data.session.message_count} messages</span>
        {data.session.user_location && (
          <span>Location: {typeof data.session.user_location === 'object' ? JSON.stringify(data.session.user_location) : data.session.user_location}</span>
        )}
      </div>

      <div className="max-w-3xl space-y-4">
        {data.messages.map((msg) => {
          const feedback = feedbackMap.get(msg.id);
          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 bg-white text-gray-800"
                }`}
              >
                <div className="mb-1 text-[10px] opacity-60">
                  {msg.role === "user" ? "User" : "Assistant"} — {new Date(msg.created_at).toLocaleTimeString()}
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                {feedback && (
                  <div className="mt-2 text-xs">
                    {feedback === "up" ? "👍 Helpful" : "👎 Not helpful"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
