"use client";

import { useState, useEffect } from "react";
import { FileText, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getRecentSessions, getSession } from "@/lib/api";

interface SessionSummary {
  id: string;
  started_at: string;
  message_count: number;
  user_location: { city?: string; zip?: string } | null;
  escalated: boolean;
  avg_rating: number | null;
}

export default function AuditLogPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      setLoading(true);
      try {
        const data = await getRecentSessions(page, 20);
        setSessions(data.sessions);
        setTotal(data.total);
      } catch (e) {
        console.error("Failed to fetch sessions:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, [page]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="w-8 h-8" aria-hidden="true" />Activity Log
        </h1>
        <p className="text-gray-600">View chat sessions and user engagement ({total} total sessions)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Total Sessions</p>
          <p className="text-2xl font-semibold text-gray-900">{total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Escalated</p>
          <p className="text-2xl font-semibold text-red-700">{sessions.filter((s) => s.escalated).length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">This Page</p>
          <p className="text-2xl font-semibold text-gray-900">{sessions.length} sessions</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-900">Date & Time</TableHead>
              <TableHead className="font-semibold text-gray-900">Session ID</TableHead>
              <TableHead className="font-semibold text-gray-900">Messages</TableHead>
              <TableHead className="font-semibold text-gray-900">Location</TableHead>
              <TableHead className="font-semibold text-gray-900">Rating</TableHead>
              <TableHead className="font-semibold text-gray-900">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
            ) : sessions.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No sessions found.</TableCell></TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.id} className="hover:bg-gray-50">
                  <TableCell className="text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{new Date(session.started_at).toLocaleDateString()}</p>
                      <p className="text-gray-500">{new Date(session.started_at).toLocaleTimeString()}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono text-gray-600">
                    {session.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{session.message_count}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {session.user_location
                      ? [session.user_location.city, session.user_location.zip].filter(Boolean).join(", ") || "Unknown"
                      : "Not provided"}
                  </TableCell>
                  <TableCell>
                    {session.avg_rating !== null ? (
                      <span className="text-sm font-medium text-gray-700">{session.avg_rating}/5</span>
                    ) : (
                      <span className="text-sm text-gray-400">No rating</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {session.escalated ? (
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Escalated</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Normal</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages} ({total} total)
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50">
              Previous
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>About Activity Log:</strong> This log shows all chat sessions with the LDA of PA assistant. Escalated sessions indicate a user may need immediate human support.
        </p>
      </div>
    </div>
  );
}
