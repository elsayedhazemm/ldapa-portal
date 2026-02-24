"use client";

import { useState, useEffect } from "react";
import { getDashboardStats, getChatVolume } from "@/lib/api";

interface Stats {
  total_providers: number;
  verified: number;
  unverified: number;
  archived: number;
  chat_sessions: number;
  avg_feedback: number;
  top_themes: string[];
}

interface VolumePoint {
  date: string;
  count: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [volume, setVolume] = useState<VolumePoint[]>([]);
  const [period, setPeriod] = useState("week");

  useEffect(() => {
    getDashboardStats(period).then(setStats).catch(console.error);
    getChatVolume(period).then((d) => setVolume(d.data || [])).catch(console.error);
  }, [period]);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Stat Cards */}
      {stats && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Providers" value={stats.total_providers} sub={`${stats.verified} verified`} color="blue" />
          <StatCard label="Unverified" value={stats.unverified} sub="Needs review" color="yellow" />
          <StatCard label="Chat Sessions" value={stats.chat_sessions} sub={`${period === "week" ? "This week" : period === "month" ? "This month" : "All time"}`} color="green" />
          <StatCard label="Avg Feedback" value={`${stats.avg_feedback.toFixed(1)}/5`} sub={stats.avg_feedback >= 4 ? "Good" : "Needs improvement"} color="purple" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chat Volume */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Chat Volume</h2>
          {volume.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No chat data yet</p>
          ) : (
            <div className="flex h-48 items-end gap-1">
              {volume.map((v) => {
                const max = Math.max(...volume.map((x) => x.count), 1);
                const height = (v.count / max) * 100;
                return (
                  <div key={v.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs text-gray-500">{v.count}</span>
                    <div
                      className="w-full rounded-t bg-blue-500"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="text-[10px] text-gray-400">
                      {new Date(v.date).toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Themes */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Top Query Themes</h2>
          {stats?.top_themes && stats.top_themes.length > 0 ? (
            <ul className="space-y-3">
              {stats.top_themes.map((theme, i) => (
                <li key={theme} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700 capitalize">{theme}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No themes detected yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: {
  label: string;
  value: number | string;
  sub: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    yellow: "bg-yellow-50 text-yellow-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-1 text-sm text-gray-500">{label}</div>
      <div className={`text-2xl font-bold ${colors[color]?.split(" ")[1] || "text-gray-900"}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-gray-400">{sub}</div>
    </div>
  );
}
