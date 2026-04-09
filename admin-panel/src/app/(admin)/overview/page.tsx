"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, CheckCircle, Clock, AlertTriangle, Plus, Eye, FileDown, Activity, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDashboardStats, getRecentSessions } from "@/lib/api";

interface Stats {
  total_providers: number;
  verified: number;
  unverified: number;
  archived: number;
  chat_sessions: number;
  avg_feedback: number;
  top_themes: string[];
}

interface Session {
  id: string;
  started_at: string;
  message_count: number;
  user_location: { city?: string; zip?: string } | null;
  escalated: boolean;
  avg_rating: number | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, sessionsData] = await Promise.all([
          getDashboardStats("week"),
          getRecentSessions(1, 5),
        ]);
        setStats(statsData);
        setSessions(sessionsData.sessions || []);
      } catch (e) {
        console.error("Failed to fetch dashboard data:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = stats
    ? [
        {
          label: "Total Providers",
          value: stats.total_providers.toLocaleString(),
          icon: Users,
          color: "bg-[#92A7C3]/10 text-[#17789C] border-[#92A7C3]/30",
          iconBg: "bg-gradient-to-br from-[#17789C] to-[#2d7a9e]",
          change: `${stats.verified} verified`,
          changeColor: "text-[#17789C]",
        },
        {
          label: "Verified Providers",
          value: stats.verified.toLocaleString(),
          icon: CheckCircle,
          color: "bg-[#C57B7D]/10 text-[#C57B7D] border-[#C57B7D]/30",
          iconBg: "bg-gradient-to-br from-[#C57B7D] to-[#d99396]",
          change: stats.total_providers > 0 ? `${Math.round((stats.verified / stats.total_providers) * 100)}% of total` : "0%",
          changeColor: "text-[#C57B7D]",
        },
        {
          label: "Unverified",
          value: stats.unverified.toLocaleString(),
          icon: Clock,
          color: "bg-[#A9A850]/10 text-[#A9A850] border-[#A9A850]/30",
          iconBg: "bg-gradient-to-br from-[#A9A850] to-[#8b8a42]",
          change: stats.unverified > 0 ? "Needs attention" : "All clear",
          changeColor: "text-[#A9A850]",
        },
        {
          label: "Chat Sessions",
          value: stats.chat_sessions.toLocaleString(),
          icon: MessageSquare,
          color: "bg-[#5A5870]/10 text-[#5A5870] border-[#5A5870]/30",
          iconBg: "bg-gradient-to-br from-[#5A5870] to-[#454356]",
          change: "Last 7 days",
          changeColor: "text-[#5A5870]",
        },
      ]
    : [];

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-[#92A7C3]/5 to-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#17789C] to-[#2d7a9e] rounded-xl flex items-center justify-center shadow-lg shadow-[#17789C]/30">
                <Activity className="w-7 h-7 text-white" aria-hidden="true" />
              </div>
              Dashboard
            </h1>
            <p className="text-slate-600 text-lg">Welcome back! Here&apos;s an overview of your provider directory.</p>
          </div>
          <Link href="/providers/new">
            <Button className="bg-gradient-to-r from-[#17789C] to-[#2d7a9e] hover:from-[#0f5470] hover:to-[#17789C] text-white shadow-lg shadow-[#17789C]/30 px-6 py-6">
              <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
              Add Provider
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-slate-100 p-6 shadow-sm animate-pulse">
              <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4" />
              <div className="h-8 bg-slate-200 rounded w-16 mb-2" />
              <div className="h-4 bg-slate-100 rounded w-24" />
            </div>
          ))
        ) : (
          statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`bg-white rounded-2xl border-2 p-6 shadow-sm hover:shadow-md transition-all duration-200 ${stat.color}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
                <p className="text-sm font-semibold text-slate-600 mb-2">{stat.label}</p>
                <p className={`text-xs font-medium ${stat.changeColor}`}>{stat.change}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/providers/new">
              <Button className="w-full bg-gradient-to-r from-[#17789C] to-[#2d7a9e] hover:from-[#0f5470] hover:to-[#17789C] text-white shadow-sm h-12">
                <Plus className="w-4 h-4 mr-2" />
                Add Provider
              </Button>
            </Link>
            <Link href="/pending-reviews">
              <Button variant="outline" className="w-full border-2 hover:border-[#A9A850] hover:bg-[#A9A850]/5 hover:text-[#A9A850] h-12">
                <Clock className="w-4 h-4 mr-2" />
                Review Queue
              </Button>
            </Link>
            <Link href="/import-export">
              <Button variant="outline" className="w-full border-2 hover:border-[#17789C] hover:bg-[#17789C]/5 hover:text-[#17789C] h-12">
                <FileDown className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </Link>
            <Link href="/providers">
              <Button variant="outline" className="w-full border-2 hover:border-[#5A5870] hover:bg-[#5A5870]/5 hover:text-[#5A5870] h-12">
                <Eye className="w-4 h-4 mr-2" />
                View All
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Chat Sessions */}
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Chat Sessions</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 py-2 animate-pulse">
                  <div className="w-8 h-8 bg-slate-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-32 mb-1" />
                    <div className="h-3 bg-slate-100 rounded w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No chat sessions yet</p>
          ) : (
            <ul className="space-y-3">
              {sessions.map((session) => (
                <li key={session.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#17789C]/10 to-[#92A7C3]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4 text-[#17789C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {session.message_count} messages
                      {session.escalated && <span className="text-red-600 ml-2 text-xs font-medium">ESCALATED</span>}
                    </p>
                    <p className="text-sm text-slate-600 truncate">
                      {session.user_location
                        ? `From ${[session.user_location.city, session.user_location.zip].filter(Boolean).join(", ")}`
                        : "Location not provided"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(session.started_at).toLocaleDateString()} · {new Date(session.started_at).toLocaleTimeString()}
                      {session.avg_rating !== null && ` · Rating: ${session.avg_rating}/5`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
