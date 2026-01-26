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
    weekday: "short",
    day: "numeric",
    month: "short",
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
      if (total === 0) return { height: 20, positive: true };
      const ratio = Math.abs(yes - no) / total;
      const height = 30 + ratio * 70;
      const positive = yes > no;
      return { height, positive };
    });
  }, [tasks]);

  if (loading) return <main className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7DD3FC] border-t-transparent" /></main>;

  return (
    <main className="min-h-screen">
      <header className="px-6 py-6 rounded-b-2xl" style={{ background: `linear-gradient(135deg, ${room.card} 0%, ${room.muted} 100%)`, color: "#0B1220" }}>
        <div className="max-w-4xl mx-auto flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{room.emoji} {room.name} Room</h1>
            <p className="mt-1 text-[#0B1220]/80">&ldquo;{room.tagline}&rdquo;</p>
            <p className="mt-2 text-sm opacity-70">{dateStr}</p>
          </div>
          <Link href="/dashboard" className="text-sm font-medium opacity-80 hover:opacity-100 transition-opacity" style={{ color: "#0B1220" }}>← Dashboard</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Add Task Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Enter task/habit..."
            className="flex-1 rounded-xl px-4 py-3 bg-[#0F172A] text-[#F1F5F9] outline-none"
          />
          <button type="button" onClick={handleAddTask} className="px-4 rounded-xl font-medium" style={{ backgroundColor: room.accent, color: "#0B1220" }}>
            Add
          </button>
        </div>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", color: "#94A3B8" }}>
            <p>Nothing here yet.</p>
            <p className="mt-2 text-sm">Add a task to start tracking.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {tasks.map((t) => (
              <li key={t.id} className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3" style={{ backgroundColor: "rgba(15, 23, 42, 0.5)" }}>
                <span className="text-[#F1F5F9] font-medium">{t.title}</span>
                <div className="flex gap-2">
                  <button onClick={() => setHabit(t.id, true)} className={`rounded-full px-4 py-1 text-sm font-medium transition-all ${t.value === true ? "opacity-100" : "opacity-40 hover:opacity-70"}`} style={{ backgroundColor: t.value === true ? room.accent : "rgba(148,163,184,0.2)", color: t.value === true ? "#0B1220" : "#94A3B8" }}>✅ Yes</button>
                  <button onClick={() => setHabit(t.id, false)} className={`rounded-full px-4 py-1 text-sm font-medium transition-all ${t.value === false ? "opacity-100" : "opacity-40 hover:opacity-70"}`} style={{ backgroundColor: t.value === false ? "rgba(239,68,68,0.3)" : "rgba(148,163,184,0.2)", color: t.value === false ? "#F1F5F9" : "#94A3B8" }}>❌ No</button>
                  <button onClick={() => handleDeleteTask(t.id)} className="ml-2 text-red-500 font-bold hover:text-red-400 transition-colors">❌</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Health trend */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: "rgba(15, 23, 42, 0.5)" }}>
          <h3 className="text-sm font-medium text-[#94A3B8] mb-4">Health Trend</h3>
          <div className="h-24 flex items-end gap-1">
            {trendData.map((bar, i) => (
              <div key={i} className="flex-1 rounded-t min-h-[4px] transition-all duration-500" style={{
                height: `${bar.height}%`,
                background: bar.positive
                  ? `linear-gradient(180deg, ${room.accent} 0%, ${room.muted} 100%)`
                  : "linear-gradient(180deg, rgba(248,113,113,1) 0%, rgba(127,29,29,1) 100%)",
              }} />
            ))}
          </div>
          <p className="mt-2 text-xs text-[#94A3B8]">Last 10 days</p>
        </div>
      </div>
    </main>
  );
}
