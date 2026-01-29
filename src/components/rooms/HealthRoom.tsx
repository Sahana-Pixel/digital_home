"use client";

import { useState, useEffect, useMemo } from "react";
import type { RoomConfig } from "@/lib/rooms";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Heart,
  Activity,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface HealthTask {
  id: string;
  title: string;
  value: boolean | null;
  lastUpdatedDate: string | null;
  history: Record<string, boolean>;
}

function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLastNDates(n: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
}

export function HealthRoom({ room }: { room: RoomConfig }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<HealthTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadTasks = async () => {
      try {
        const tasksRef = collection(db, "users", user.uid, "rooms", "health", "tasks");
        const snapshot = await getDocs(tasksRef);
        const today = getTodayDate();

        const loaded: HealthTask[] = snapshot.docs.map((snap) => {
          const data = snap.data() as any;
          const lastUpdatedDate: string | null = data.lastUpdatedDate || null;
          let value: boolean | null = data.value ?? null;

          // Reset daily
          if (lastUpdatedDate !== today) value = null;

          return {
            id: snap.id,
            title: data.title || "",
            value,
            lastUpdatedDate,
            history: (data.history as Record<string, boolean>) || {},
          };
        });

        setTasks(loaded);
      } catch (err) {
        console.error("[HealthRoom] Failed to load tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [user]);

  const setHabit = async (taskId: string, v: boolean) => {
    if (!user) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const today = getTodayDate();
    const newHistory = { ...(task.history || {}), [today]: v };
    const updatedTask = { ...task, value: v, lastUpdatedDate: today, history: newHistory };

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

    try {
      const taskRef = doc(db, "users", user.uid, "rooms", "health", "tasks", taskId);
      await updateDoc(taskRef, { value: v, lastUpdatedDate: today, history: newHistory });
    } catch (err) {
      console.error("[HealthRoom] Failed to update task:", err);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
    }
  };

  // Add Task with input field
  const handleAddTask = async () => {
    if (!user || !newTaskTitle.trim()) return;

    const newTaskData = {
      title: newTaskTitle.trim(),
      value: null as boolean | null,
      lastUpdatedDate: null as string | null,
      history: {} as Record<string, boolean>,
      createdAt: serverTimestamp(),
    };

    try {
      const tasksRef = collection(db, "users", user.uid, "rooms", "health", "tasks");
      const docRef = await addDoc(tasksRef, newTaskData);

      setTasks((prev) => [
        ...prev,
        { id: docRef.id, title: newTaskData.title, value: null, lastUpdatedDate: null, history: {} },
      ]);
      setNewTaskTitle("");
    } catch (err) {
      console.error("[HealthRoom] Failed to add task:", err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    if (!user) return;
    try {
      const taskRef = doc(db, "users", user.uid, "rooms", "health", "tasks", id);
      await deleteDoc(taskRef);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("[HealthRoom] Failed to delete task:", err);
    }
  };

  const trendData = useMemo(() => {
    const days = getLastNDates(10);
    return days.map((date) => {
      let yes = 0;
      let no = 0;
      tasks.forEach((t) => {
        const v = t.history?.[date];
        if (v === true) yes += 1;
        else if (v === false) no += 1;
      });
      const total = yes + no;
      if (total === 0) return { height: 10, positive: true, empty: true };
      const ratio = Math.abs(yes - no) / total;
      const height = 20 + ratio * 80;
      const positive = yes >= no; // default to positive if equal
      return { height, positive, empty: false };
    });
  }, [tasks]);

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center bg-[#020804]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#A8DF8E] border-t-transparent" />
        <p className="text-[#A8DF8E] text-xs uppercase tracking-widest opacity-80">Breathe In...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#020804] text-[#F0FDF4] selection:bg-[#A8DF8E]/30 relative overflow-hidden">
      {/* Subtle Organic Bloom Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-[#A8DF8E]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[0%] right-[0%] w-[500px] h-[500px] bg-[#377D71]/10 rounded-full blur-[100px]" />
      </div>

      {/* 1. Header Section */}
      <header className="px-6 py-8 md:py-12 border-b border-white/[0.03] bg-[#020804]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 text-sm text-[#86EFAC]/70 hover:text-[#86EFAC] transition-colors"
            >
              <div className="p-1.5 rounded-full bg-[#A8DF8E]/10 border border-[#A8DF8E]/10 group-hover:bg-[#A8DF8E]/20 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span>Dashboard</span>
            </Link>

            <div className="text-xs font-medium text-[#86EFAC]/50 tracking-wider uppercase">
              {dateStr}
            </div>
          </div>

          <div className="flex items-start gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-[#A8DF8E] blur-xl opacity-20 rounded-full" />
              <div className="relative p-4 rounded-full bg-[#14532D]/30 border border-[#A8DF8E]/20 shadow-[0_0_30px_-5px_rgba(168,223,142,0.1)]">
                <span className="text-3xl relative z-10">{room.emoji}</span>
              </div>
            </div>
            <div className="pt-1">
              <h1 className="text-3xl md:text-5xl font-serif text-[#F0FDF4] tracking-tight">{room.name}</h1>
              <p className="text-[#86EFAC]/60 text-base mt-2 font-light leading-relaxed max-w-lg">
                &ldquo;{room.tagline}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12 relative z-10">

        {/* Tasks Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif text-[#F0FDF4]">Daily Habits</h2>
          </div>

          {/* Add Task Input */}
          <div className="bg-[#14532D]/20 rounded-2xl p-2 pl-5 border border-[#A8DF8E]/10 flex gap-4 items-center focus-within:bg-[#14532D]/30 focus-within:border-[#A8DF8E]/30 transition-all">
            <div className="h-2 w-2 rounded-full bg-[#A8DF8E] animate-pulse" />
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              placeholder="Cultivate a new habit..."
              className="flex-1 bg-transparent py-4 text-[#F0FDF4] placeholder:text-[#86EFAC]/30 outline-none font-light tracking-wide text-lg"
            />
            <button
              type="button"
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim()}
              className="p-3 mr-1 rounded-xl bg-[#A8DF8E]/10 text-[#A8DF8E] hover:bg-[#A8DF8E] hover:text-[#064E3B] transition-all disabled:opacity-0"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* List */}
          {tasks.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
              <Heart className="w-12 h-12 mb-4 stroke-1" />
              <p className="font-light text-lg">Your wellness journey begins with one step.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className="group bg-[#064E3B]/10 hover:bg-[#064E3B]/20 rounded-[1.5rem] p-6 border border-[#A8DF8E]/5 hover:border-[#A8DF8E]/10 transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-1.5 w-1.5 rounded-full ${t.value === true ? "bg-[#4ade80]" : t.value === false ? "bg-red-400" : "bg-white/10"}`} />
                    <span className={`text-lg font-light tracking-wide ${t.value !== null ? "text-[#F0FDF4]" : "text-[#F0FDF4]/90"}`}>
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      onClick={() => setHabit(t.id, true)}
                      className={`
                                        h-10 px-5 rounded-full flex items-center gap-2 transition-all duration-300 border
                                        ${t.value === true
                          ? "bg-[#4ade80]/20 border-[#4ade80]/50 text-[#4ade80]"
                          : "bg-transparent border-white/5 text-[#86EFAC]/40 hover:bg-[#4ade80]/10 hover:text-[#4ade80] hover:border-[#4ade80]/30"
                        }
                                    `}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Done</span>
                    </button>

                    <button
                      onClick={() => setHabit(t.id, false)}
                      className={`
                                        h-10 px-5 rounded-full flex items-center gap-2 transition-all duration-300 border
                                        ${t.value === false
                          ? "bg-red-500/20 border-red-500/50 text-red-400"
                          : "bg-transparent border-white/5 text-[#86EFAC]/40 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                        }
                                    `}
                    >
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Skip</span>
                    </button>

                    <div className="w-[1px] h-6 bg-white/5 mx-2" />

                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="p-2 rounded-full text-[#F87171] opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-[#F87171]/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Trend Section (Hero) */}
        <section className="bg-[#052e16]/30 backdrop-blur-sm rounded-[2rem] p-8 border border-[#A8DF8E]/10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-[#A8DF8E]">
              <Activity className="w-5 h-5" />
              <h3 className="text-sm font-medium uppercase tracking-widest opacity-80">Vitality Rhythm</h3>
            </div>
            <span className="text-xs text-[#86EFAC]/40">Last 10 Days</span>
          </div>

          <div className="h-32 flex items-end gap-2 md:gap-3">
            {trendData.map((bar, i) => (
              <div key={i} className="flex-1 h-full flex flex-col justify-end group cursor-pointer relative">
                <div
                  className="w-full rounded-t-full relative overflow-hidden transition-all duration-700 ease-out group-hover:brightness-110"
                  style={{
                    height: `${bar.height}%`,
                    background: bar.empty
                      ? "rgba(255,255,255,0.05)"
                      : bar.positive
                        ? `linear-gradient(to top, rgba(20, 83, 45, 0.4), #4ade80)`
                        : "linear-gradient(to top, rgba(69, 10, 10, 0.4), #f87171)"
                  }}
                >
                  {/* Glow at top of bar */}
                  {!bar.empty && (
                    <div className={`absolute top-0 inset-x-0 h-4 bg-white/30 blur-md`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
