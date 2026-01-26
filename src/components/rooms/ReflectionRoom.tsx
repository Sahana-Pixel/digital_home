"use client";

import { useEffect, useState } from "react";
import type { RoomConfig } from "@/lib/rooms";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

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

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
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
      }
    };

    loadReflection();
  }, [user]);

  const total = stats.done + stats.notDone || 1;
  const donePct = (stats.done / total) * 100;
  const notDonePct = (stats.notDone / total) * 100;

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

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Period tabs */}
        <div className="flex gap-2">
          {(["Today", "This Week", "This Month"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                period === p ? "opacity-100" : "opacity-60 hover:opacity-80"
              }`}
              style={{
                backgroundColor: period === p ? room.accent : "rgba(148,163,184,0.2)",
                color: period === p ? "#0B1220" : "#94A3B8",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Overall Progress */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)" }}
        >
          <h3 className="text-sm font-medium text-[#94A3B8] mb-3">
            Today’s Balance
          </h3>
          <div className="h-4 w-full rounded-full overflow-hidden bg-[#1E293B] flex">
            <div style={{ width: `${donePct}%`, background: room.accent }} />
            <div style={{ width: `${notDonePct}%`, background: "#EF4444" }} />
          </div>
          <div className="flex justify-between text-xs mt-2 text-[#94A3B8]">
            <span>Done: {stats.done}</span>
            <span>Pending: {stats.notDone}</span>
          </div>
        </div>

        {/* Pending Tasks */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)" }}
        >
          <h3 className="text-sm font-medium text-[#94A3B8] mb-4">
            Pending Today
          </h3>

          {pendingTasks.length === 0 ? (
            <p className="text-[#F1F5F9] italic">
              Fresh start. Everything is clear today.
            </p>
          ) : (
            <ul className="space-y-3">
              {pendingTasks.map((t, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-[#F1F5F9]"
                >
                  <span>{t.title}</span>
                  <span className="text-[#94A3B8] text-sm">{t.roomName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Reflection */}
        <div
          className="rounded-2xl p-5 text-center"
          style={{
            backgroundColor: `${room.accent}20`,
            border: `1px solid ${room.accent}40`,
          }}
        >
          <h3 className="text-sm font-medium mb-2" style={{ color: room.accent }}>
            Reflection
          </h3>
          <p className="text-[#F1F5F9]">
            {stats.notDone === 0
              ? "Clean slate today — strong alignment."
              : "Today is still open. One step is enough."}
          </p>
        </div>
      </div>
    </main>
  );
}
