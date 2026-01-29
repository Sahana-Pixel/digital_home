"use client";

import { useEffect, useState } from "react";
import type { RoomConfig } from "@/lib/rooms";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { ArrowLeft, CheckCircle2, Circle, MoreHorizontal } from "lucide-react";

type CollegeTask = {
  title: string;
  done: boolean;
  due?: string; // yyyy-mm-dd
};

type HealthTask = {
  title: string;
  value: boolean | null;
  lastUpdatedDate: string | null;
};

function getTodayDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ReflectionRoom({ room }: { room: RoomConfig }) {
  const { user } = useAuth();
  const [period, setPeriod] = useState<"Today" | "This Week" | "This Month">("Today");
  const [pendingTasks, setPendingTasks] = useState<
    { roomName: string; title: string }[]
  >([]);
  const [stats, setStats] = useState({ done: 0, notDone: 0 });
  const [loading, setLoading] = useState(true);

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  useEffect(() => {
    if (!user) return;

    const loadReflection = async () => {
      try {
        let done = 0;
        let notDone = 0;
        const pending: { roomName: string; title: string }[] = [];
        const today = getTodayDate();

        /* STUDY + COLLEGE
           Only TODAY’s tasks are considered
           Yesterday’s pending tasks are ignored */
        for (const r of ["study", "college"]) {
          const snap = await getDocs(
            collection(db, "users", user.uid, "rooms", r, "tasks")
          );

          snap.forEach((doc) => {
            const t = doc.data() as CollegeTask;

            // reset logic: ignore old tasks
            if (t.due && t.due !== today) return;

            if (t.done) {
              done++;
            } else {
              notDone++;
              pending.push({
                roomName: r.charAt(0).toUpperCase() + r.slice(1),
                title: t.title,
              });
            }
          });
        }

        /* HEALTH
           Daily habit resets automatically
           Only TODAY’s value is considered */
        const healthSnap = await getDocs(
          collection(db, "users", user.uid, "rooms", "health", "tasks")
        );

        healthSnap.forEach((doc) => {
          const t = doc.data() as HealthTask;

          if (t.lastUpdatedDate === today && t.value === true) {
            done++;
          } else {
            notDone++;
            pending.push({
              roomName: "Health",
              title: t.title,
            });
          }
        });

        setStats({ done, notDone });
        setPendingTasks(pending);
      } catch (err) {
        console.error("[ReflectionRoom] Failed to load reflection:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReflection();
  }, [user]);

  const total = stats.done + stats.notDone || 1;
  const donePct = (stats.done / total) * 100;
  const notDonePct = (stats.notDone / total) * 100;

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center bg-[#1C1917]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E7E5E4] border-t-transparent" />
        <p className="text-[#E7E5E4] text-xs uppercase tracking-widest opacity-80">Reflecting...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#1C1917] text-[#E7E5E4] w-full selection:bg-[#FB929E]/30 selection:text-[#E7E5E4]">
      {/* Subtle Warm Ambient Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background: `
            radial-gradient(circle at 50% 0%, ${room.card}30 0%, transparent 60%),
            radial-gradient(circle at 10% 90%, ${room.accent}15 0%, transparent 40%)
          `
        }}
      />

      {/* Header */}
      <header className="relative z-10 px-6 py-8 md:py-12 border-b border-[#E7E5E4]/[0.05] backdrop-blur-md sticky top-0 bg-[#1C1917]/80">
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/dashboard"
                className="p-2 -ml-2 rounded-full hover:bg-[#E7E5E4]/5 text-[#A8A29E] hover:text-[#E7E5E4] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="h-4 w-[1px] bg-[#E7E5E4]/10" />
              <span className="text-sm font-medium tracking-widest uppercase text-[#A8A29E] opacity-70">Reflection</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-light tracking-wide text-[#FAE8E0] flex items-center gap-3">
              <span className="opacity-90">{room.emoji}</span>
              {room.name}
            </h1>
            <p className="text-[#A8A29E] text-sm font-light tracking-wide max-w-md leading-relaxed">
              {room.tagline} • <span className="text-[#D6D3D1]">{dateStr}</span>
            </p>
          </div>

          <div className="hidden md:block">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center opacity-90 transition-transform hover:scale-105"
              style={{ background: `${room.accent}25`, border: `1px solid ${room.accent}10` }}
            >
              <MoreHorizontal className="w-5 h-5" style={{ color: room.card }} />
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12 space-y-10">

        {/* Period Selector - Warm Soft Pills */}
        <div className="flex justify-center">
          <div className="flex gap-1 p-1 bg-[#292524] rounded-full border border-[#E7E5E4]/[0.05] shadow-inner">
            {(["Today", "This Week", "This Month"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-6 py-2 rounded-full text-xs font-medium tracking-wide transition-all duration-300 ${period === p
                  ? "bg-[#44403C] text-[#F5F5F4] shadow-md border border-[#E7E5E4]/10"
                  : "text-[#78716C] hover:text-[#A8A29E] hover:bg-[#E7E5E4]/[0.03]"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid gap-8">

          {/* Journal Card: Balance */}
          <section
            className="rounded-2xl p-8 border backdrop-blur-md transition-all duration-500 hover:border-[#E7E5E4]/10 hover:shadow-2xl hover:shadow-[#000000]/20"
            style={{
              backgroundColor: "rgba(41, 37, 36, 0.4)", // Warmer dark background
              borderColor: "rgba(231, 229, 228, 0.06)"
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-light tracking-wide text-[#F5F5F4]">Daily Balance</h3>
              <span className="text-xs font-medium text-[#78716C] uppercase tracking-wider">Overview</span>
            </div>

            <div className="relative h-2 w-full rounded-full bg-[#292524] overflow-hidden mb-4 shadow-inner">
              <div
                className="absolute left-0 top-0 h-full transition-all duration-1000 ease-out"
                style={{ width: `${donePct}%`, background: room.card, opacity: 0.9 }}
              />
              <div
                className="absolute top-0 h-full transition-all duration-1000 ease-out"
                style={{ left: `${donePct}%`, width: `${notDonePct}%`, background: '#57534E' }} // Warm gray progress
              />
            </div>

            <div className="flex justify-between items-center text-sm font-light">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: room.card }} />
                <span className="text-[#A8A29E]">Completed <span className="text-[#E7E5E4] ml-1">{stats.done}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#57534E]" />
                <span className="text-[#A8A29E]">Pending <span className="text-[#E7E5E4] ml-1">{stats.notDone}</span></span>
              </div>
            </div>
          </section>

          {/* Journal Card: Thoughts / Pending */}
          <section
            className="rounded-2xl p-8 border backdrop-blur-md min-h-[200px] transition-all duration-500 hover:border-[#E7E5E4]/10"
            style={{
              backgroundColor: "rgba(41, 37, 36, 0.4)",
              borderColor: "rgba(231, 229, 228, 0.06)"
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-light tracking-wide text-[#F5F5F4]">Unfinished Business</h3>
              <span className="text-xs font-medium text-[#78716C] uppercase tracking-wider">Open Loops</span>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 opacity-70">
                <div className="p-4 rounded-full border border-dashed border-[#A8A29E]/30 bg-[#292524]/50">
                  <CheckCircle2 className="w-6 h-6 text-[#A8A29E]" />
                </div>
                <p className="text-[#A8A29E] font-light max-w-xs mx-auto">
                  Your mind is clear. <br /> "Fresh start. Everything is aligned today."
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {pendingTasks.map((t, i) => (
                  <li
                    key={i}
                    className="group flex items-center justify-between py-3 px-4 rounded-lg hover:bg-[#E7E5E4]/[0.05] transition-colors border-b border-transparent hover:border-[#E7E5E4]/[0.02]"
                  >
                    <div className="flex items-center gap-3">
                      <Circle className="w-4 h-4 text-[#78716C] group-hover:text-[#D6D3D1] transition-colors" strokeWidth={1.5} />
                      <span className="text-[#D6D3D1] font-light group-hover:text-[#F5F5F4] transition-colors">{t.title}</span>
                    </div>
                    <span className="text-xs text-[#57534E] font-medium uppercase tracking-wider group-hover:text-[#A8A29E] transition-colors">
                      {t.roomName}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Insight Snippet */}
          <div className="text-center py-8 opacity-70 hover:opacity-100 transition-opacity duration-500">
            <p className="italic font-serif text-xl tracking-wide text-[#A8A29E] selection:bg-[#FB929E]/20">
              {stats.notDone === 0
                ? "“Stillness is the key to clarity.”"
                : "“Today is still open. One step is enough.”"}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
