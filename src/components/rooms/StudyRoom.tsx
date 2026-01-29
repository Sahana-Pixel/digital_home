"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { RoomConfig } from "@/lib/rooms";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Calendar, Check } from "lucide-react";

interface StudyTask {
  id: string;
  title: string;
  done: boolean;
  streak: number;
  yearSquares: boolean[];
  lastCompletedDate: string | null;
}

function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayOfYear(): number {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function StudyRoom({ room }: { room: RoomConfig }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);
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
        const tasksRef = collection(db, "users", user.uid, "rooms", "study", "tasks");
        const snapshot = await getDocs(tasksRef);
        const today = getTodayDate();

        const loadedTasks: StudyTask[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          let done = data.done || false;
          const lastCompletedDate = data.lastCompletedDate || null;

          if (lastCompletedDate !== today) done = false;

          return {
            id: docSnap.id,
            title: data.title || "",
            done,
            streak: data.streak || 0,
            yearSquares: Array.isArray(data.yearSquares) && data.yearSquares.length === 365
              ? data.yearSquares
              : Array(365).fill(false),
            lastCompletedDate,
          };
        });

        setTasks(loadedTasks);
      } catch (err) {
        console.error("[StudyRoom] Failed to load tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [user]);

  const toggle = async (id: string) => {
    if (!user) return;

    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const today = getTodayDate();
    const dayIndex = getDayOfYear() - 1;

    if (task.done && task.lastCompletedDate === today) return;

    const newDone = !task.done;
    const newStreak = newDone ? task.streak + 1 : 0;
    const newYearSquares = [...task.yearSquares];
    if (dayIndex >= 0 && dayIndex < 365) newYearSquares[dayIndex] = newDone;
    const newLastCompletedDate = newDone ? today : null;

    const updatedTask = { ...task, done: newDone, streak: newStreak, yearSquares: newYearSquares, lastCompletedDate: newLastCompletedDate };
    setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));

    try {
      const taskRef = doc(db, "users", user.uid, "rooms", "study", "tasks", id);
      await updateDoc(taskRef, { done: newDone, streak: newStreak, yearSquares: newYearSquares, lastCompletedDate: newLastCompletedDate });
    } catch (err) {
      console.error("[StudyRoom] Failed to update task:", err);
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    }
  };

  const toggleYear = (id: string) => setExpandedYear((c) => (c === id ? null : id));

  const handleAddTask = async () => {
    if (!user || !newTaskTitle.trim()) return;

    const newTask = {
      title: newTaskTitle.trim(),
      done: false,
      streak: 0,
      yearSquares: Array(365).fill(false),
      lastCompletedDate: null,
      createdAt: serverTimestamp(),
    };

    try {
      const tasksRef = collection(db, "users", user.uid, "rooms", "study", "tasks");
      const docRef = await addDoc(tasksRef, newTask);

      setTasks((prev) => [
        ...prev,
        { id: docRef.id, title: newTask.title, done: false, streak: 0, yearSquares: newTask.yearSquares, lastCompletedDate: null },
      ]);
      setNewTaskTitle("");
    } catch (err) {
      console.error("[StudyRoom] Failed to add task:", err);
    }
  };

  // Delete task
  const handleDeleteTask = async (id: string) => {
    if (!user) return;

    try {
      const taskRef = doc(db, "users", user.uid, "rooms", "study", "tasks", id);
      await deleteDoc(taskRef);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("[StudyRoom] Failed to delete task:", err);
    }
  };

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center bg-[#0B1220]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7DD3FC] border-t-transparent" />
        <p className="text-[#7DD3FC] text-xs uppercase tracking-widest opacity-80">Focus In...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#050912] text-[#E2E8F0] selection:bg-[#9ADCFF]/20">

      {/* 1. Header Section */}
      <header className="px-6 py-8 md:py-12 border-b border-white/[0.05] bg-[#050912]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 text-sm text-[#64748B] hover:text-[#E2E8F0] transition-colors"
            >
              <div className="p-1.5 rounded-full bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span>Dashboard</span>
            </Link>

            <div className="text-xs font-mono text-[#64748B] tracking-wider uppercase opacity-60">
              {dateStr}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-[#0F172A] border border-white/5 shadow-lg">
              <span className="text-3xl filter drop-shadow-md">{room.emoji}</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-[#F8FAFC] tracking-tight">{room.name}</h1>
              <p className="text-[#94A3B8] text-sm mt-1 font-light tracking-wide">{room.tagline}</p>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">

        {/* Add Task Input */}
        <div className="bg-[#0F172A]/40 rounded-2xl p-2 border border-white/5 flex gap-2 focus-within:ring-2 focus-within:ring-[#9ADCFF]/20 transition-all shadow-inner">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            placeholder="What is your focus for today?"
            className="flex-1 bg-transparent px-4 py-3 text-[#F1F5F9] placeholder:text-[#475569] outline-none font-light"
          />
          <button
            type="button"
            onClick={handleAddTask}
            disabled={!newTaskTitle.trim()}
            className="px-4 py-2 rounded-xl bg-[#050912] border border-white/10 text-[#E2E8F0] hover:bg-[#9ADCFF] hover:text-[#050912] hover:border-[#9ADCFF] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-[#64748B] font-semibold pl-1 mb-6">Active Tasks</h2>

          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 rounded-3xl border border-dashed border-white/5 bg-white/[0.02]">
              <div className="w-12 h-12 rounded-full bg-[#0F172A] flex items-center justify-center mb-4 text-[#475569]">
                <Calendar className="w-5 h-5" />
              </div>
              <p className="text-[#94A3B8] text-sm font-light">Your schedule is clear.</p>
            </div>
          ) : (
            <ul className="grid gap-3">
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className={`
                    group relative overflow-hidden rounded-2xl p-5 border transition-all duration-300
                    ${t.done
                      ? "bg-[#050912] border-white/5 opacity-60"
                      : "bg-[#0F172A]/40 border-white/5 hover:border-white/10 hover:bg-[#0F172A]/60 hover:shadow-lg"
                    }
                  `}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggle(t.id)}
                      className={`
                        w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300
                        ${t.done
                          ? "border-[#9ADCFF] bg-[#9ADCFF] scale-100"
                          : "border-[#475569] hover:border-[#9ADCFF] scale-100"
                        }
                      `}
                    >
                      {t.done && <Check className="w-3.5 h-3.5 text-[#050912] stroke-[3]" />}
                    </button>

                    {/* Title */}
                    <span
                      className={`
                        max-w-[60%] truncate font-medium transition-all duration-300 selection:bg-[#9ADCFF]/20
                        ${t.done ? "text-[#475569] line-through decoration-white/10" : "text-[#E2E8F0]"}
                      `}
                    >
                      {t.title}
                    </span>

                    <div className="ml-auto flex items-center gap-4">
                      {/* Streak Badge */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#050912] border border-white/5">
                        <span className="text-xs" aria-hidden>🔥</span>
                        <span className="text-xs font-mono text-[#94A3B8]">{t.streak}</span>
                      </div>

                      {/* Year View Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleYear(t.id)}
                        className={`
                          text-xs font-medium tracking-wide transition-colors uppercase
                          ${expandedYear === t.id ? "text-[#9ADCFF]" : "text-[#475569] hover:text-[#94A3B8]"}
                        `}
                      >
                        {expandedYear === t.id ? "Hide Year" : "History"}
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(t.id)}
                        className="p-2 rounded-lg text-[#ef4444]/60 hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Year Grid */}
                  <div className={`grid transition-all duration-500 ease-in-out ${expandedYear === t.id ? "grid-rows-[1fr] mt-6 opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="grid gap-[2px] w-full" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(8px, 1fr))` }}>
                        {t.yearSquares.slice(0, 365).map((v, i) => (
                          <div
                            key={i}
                            title={v ? "Completed" : "Missed"}
                            className={`aspect-square rounded-[1px] transition-colors ${v ? "bg-[#39d353]" : "bg-white/[0.03]"}`}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-[#475569] mt-2 font-mono text-center uppercase tracking-widest">Yearly Consistency</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer / Quote */}
        <div className="mt-12 pt-8 border-t border-white/[0.05] text-center">
          <p className="text-[#64748B] text-sm italic font-serif opacity-60">
            "Focus is the art of knowing what to ignore."
          </p>
        </div>
      </div>
    </main>
  );
}
