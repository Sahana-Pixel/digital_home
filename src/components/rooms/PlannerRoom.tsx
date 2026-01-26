"use client";

import type { RoomConfig } from "@/lib/rooms";
import Link from "next/link";

export function PlannerRoom({ room }: { room: RoomConfig }) {
  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <main className="min-h-screen">
      <header
        className="px-6 py-6 rounded-b-2xl"
        style={{
          background: `linear-gradient(135deg, ${room.card} 0%, ${room.muted} 100%)`,
          color: "#0B1220",
        }}
      >
        <div className="max-w-4xl mx-auto flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">
              {room.emoji} {room.name} Room
            </h1>
            <p className="mt-1 text-[#0B1220]/80">{room.tagline}</p>
            <p className="mt-2 text-sm opacity-70">{dateStr}</p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-medium opacity-80 hover:opacity-100 transition-opacity"
            style={{ color: "#0B1220" }}
          >
            ← Dashboard
          </Link>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div
          className="rounded-2xl p-8 text-center"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", color: "#94A3B8" }}
        >
          <p>Nothing here yet.</p>
          <p className="mt-2 text-sm">Plan your days with clarity when you&apos;re ready.</p>
        </div>
      </div>
    </main>
  );
}
