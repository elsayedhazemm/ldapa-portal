"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getRecentSessions } from "@/lib/api";

interface Session {
  id: string;
  started_at: string;
  message_count: number;
  user_location: { city?: string; zip?: string } | null;
  escalated: boolean;
  avg_rating: number | null;
}

export default function ChatsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getRecentSessions(page, 20)
      .then((data) => {
        setSessions(data.sessions);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Chat Review</h1>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : sessions.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <div className="text-4xl mb-2">💬</div>
          <p>No chat sessions yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/chats/${s.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(s.started_at).toLocaleString()}
                    </span>
                    {s.escalated && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Escalated
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span>{s.message_count} messages</span>
                    {s.user_location?.city && <span>📍 {s.user_location.city}</span>}
                    {s.avg_rating !== null && <span>⭐ {s.avg_rating.toFixed(1)}/5</span>}
                  </div>
                </div>
                <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">{total} total sessions</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50">
                  Previous
                </button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50">
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
