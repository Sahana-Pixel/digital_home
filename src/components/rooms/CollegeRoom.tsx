"use client";

import { useState, useEffect, useMemo } from "react";
import type { RoomConfig } from "@/lib/rooms";
import Link from "next/link";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Circle,
  Filter,
  GraduationCap
} from "lucide-react";

// Common types for suggestions, but not for limiting input
const SUGGESTED_TYPES = ["Assignment", "Workshop", "Viva", "Certificate"] as const;

interface CollegeTask {
  id: string;
  title: string;
  type: string; // Free typing allowed
  due: string;
  done: boolean;
}

function getDaysUntil(d: string): number {
  const due = new Date(d);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function CollegeRoom({ room }: { room: RoomConfig }) {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<CollegeTask[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [due, setDue] = useState("");
  const [loading, setLoading] = useState(true);

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  useEffect(() => {
    if (!user) return;

    const loadTasks = async () => {
      try {
        const ref = collection(db, "users", user.uid, "rooms", "college", "tasks");
        const snap = await getDocs(ref);
        setTasks(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: data.title,
              type: data.type || "Assignment",
              due: data.due,
              done: data.done,
            };
          })
        );
      } catch (err) {
        console.error("[CollegeRoom] load error:", err);
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

    const updated = { ...task, done: !task.done };
    setTasks((p) => p.map((t) => (t.id === id ? updated : t)));

    try {
      const ref = doc(db, "users", user.uid, "rooms", "college", "tasks", id);
      await updateDoc(ref, { done: updated.done });
    } catch (err) {
      console.error("[CollegeRoom] toggle error:", err);
      setTasks((p) => p.map((t) => (t.id === id ? task : t)));
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;

    const prev = tasks;
    setTasks((p) => p.filter((t) => t.id !== id));

    try {
      const ref = doc(db, "users", user.uid, "rooms", "college", "tasks", id);
      await deleteDoc(ref);
    } catch (err) {
      console.error("[CollegeRoom] delete error:", err);
      setTasks(prev);
    }
  };

  const handleAddTask = async () => {
    if (!user || !title.trim() || !due) return;

    // Default to 'Assignment' if type is empty
    const finalType = type.trim() || "Assignment";

    const newTask = {
      title: title.trim(),
      type: finalType,
      due,
      done: false,
      createdAt: serverTimestamp(),
    };

    try {
      const ref = collection(db, "users", user.uid, "rooms", "college", "tasks");
      const docRef = await addDoc(ref, newTask);

      setTasks((p) => [
        ...p,
        { id: docRef.id, title: newTask.title, type: finalType, due, done: false },
      ]);

      setShowAdd(false);
      setTitle("");
      setType("");
      setDue("");
    } catch (err) {
      console.error("[CollegeRoom] add error:", err);
    }
  };

  // Dynamic Filters: Get unique types from tasks
  const availableFilters = useMemo(() => {
    const types = new Set(tasks.map(t => t.type).filter(Boolean));
    return ["All", ...Array.from(types).sort()];
  }, [tasks]);

  // Filter and Sort
  const filteredAndSorted = useMemo(() => {
    let result = tasks;

    // Filter
    if (filter !== "All") {
      result = result.filter((t) => t.type === filter);
    }

    // Sort by Date (Ascending)
    result.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());

    return result;
  }, [tasks, filter]);

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = (d: number) =>
    today.getDate() === d &&
    today.getMonth() === currentMonth.getMonth() &&
    today.getFullYear() === currentMonth.getFullYear();

  const taskForDate = (d: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    return tasks.filter((t) => t.due === dateStr);
  };

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center bg-[#0F172A]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#51e5ff] border-t-transparent" />
        <p className="text-[#51e5ff] text-xs uppercase tracking-widest opacity-80">Gear Up...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#0F172A] text-[#E2E8F0] selection:bg-[#51e5ff]/20">

      {/* Header */}
      <header className="px-6 py-8 md:py-12 border-b border-white/[0.05] bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#E2E8F0] transition-colors"
            >
              <div className="p-1.5 rounded-full bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span>Dashboard</span>
            </Link>

            <div className="text-xs font-mono text-[#51e5ff] tracking-widest uppercase opacity-80 border border-[#51e5ff]/20 px-3 py-1 rounded-full bg-[#51e5ff]/5">
              {dateStr}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-[#1E293B] border border-white/5 shadow-[0_0_20px_-5px_rgba(81,229,255,0.15)] ring-1 ring-[#51e5ff]/20">
              <span className="text-3xl">{room.emoji}</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{room.name}</h1>
              <p className="text-[#94A3B8] text-sm mt-1 font-medium tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#51e5ff] animate-pulse" />
                {room.tagline}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-10">

          {/* Left Column: Tasks */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#51e5ff]" />
                Academics
              </h2>
              {/* Dynamic Filter Bar */}
              <div className="flex gap-1 bg-[#1E293B] p-1 rounded-lg border border-white/5 overflow-x-auto max-w-[50%] no-scrollbar">
                {availableFilters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-all whitespace-nowrap ${filter === f
                      ? "bg-[#51e5ff] text-[#0F172A] shadow-sm"
                      : "text-[#94A3B8] hover:text-white hover:bg-white/5"
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredAndSorted.length === 0 ? (
                <div className="rounded-2xl p-10 text-center border-2 border-dashed border-[#1E293B] bg-[#1E293B]/20">
                  <p className="text-[#94A3B8] font-medium">No tasks found.</p>
                  <p className="text-sm text-[#64748B] mt-1">Stay ahead of the curve.</p>
                </div>
              ) : (
                filteredAndSorted.map((t) => {
                  const days = getDaysUntil(t.due);
                  let statusColor = "text-[#94A3B8]";
                  let statusText = "";

                  if (t.done) {
                    statusColor = "text-[#4ade80]";
                    statusText = "Completed";
                  } else if (days < 0) {
                    statusColor = "text-red-400";
                    statusText = "Overdue";
                  } else if (days === 0) {
                    statusColor = "text-yellow-400";
                    statusText = "Due Today";
                  } else if (days <= 2) {
                    statusColor = "text-orange-400";
                    statusText = `${days} days left`;
                  }

                  return (
                    <div
                      key={t.id}
                      className={`
                        group relative rounded-xl p-5 border transition-all duration-300
                        ${t.done
                          ? "bg-[#0F172A] border-white/5 opacity-60"
                          : "bg-[#1E293B]/50 border-white/5 hover:border-[#51e5ff]/30 hover:shadow-[0_4px_20px_-10px_rgba(81,229,255,0.1)]"
                        }
                      `}
                    >
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggle(t.id)}
                          className={`
                            mt-1 w-5 h-5 rounded border flex items-center justify-center transition-all
                            ${t.done
                              ? "bg-[#51e5ff] border-[#51e5ff]"
                              : "border-[#64748B] hover:border-[#51e5ff] bg-transparent"
                            }
                          `}
                        >
                          {t.done && <CheckCircle2 className="w-3.5 h-3.5 text-[#0F172A]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium truncate ${t.done ? "text-[#64748B] line-through" : "text-[#F1F5F9]"}`}>
                            {t.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs">
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[#94A3B8]">
                              {t.type}
                            </span>
                            <span className={`flex items-center gap-1.5 ${statusColor}`}>
                              <Clock className="w-3 h-3" />
                              {new Date(t.due).toLocaleDateString("en-GB")}
                              {statusText && <span className="font-semibold">• {statusText}</span>}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => deleteTask(t.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-[#64748B] hover:text-red-400 transition-all transform hover:scale-110"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setShowAdd((v) => !v)}
              className="w-full py-4 rounded-xl border-2 border-dashed border-[#1E293B] text-[#64748B] font-medium hover:border-[#51e5ff]/50 hover:text-[#51e5ff] hover:bg-[#51e5ff]/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Task
            </button>

            {showAdd && (
              <div className="animate-in fade-in slide-in-from-top-2 bg-[#1E293B] rounded-xl p-5 border border-[#51e5ff]/20 shadow-xl space-y-4">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full bg-[#0F172A] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-[#64748B] focus:border-[#51e5ff] focus:ring-1 focus:ring-[#51e5ff] outline-none transition-all"
                  autoFocus
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* Free Text Input for Type */}
                  <input
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder="Type (e.g. Assignment)"
                    list="task-types"
                    className="bg-[#0F172A] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-[#64748B] outline-none focus:border-[#51e5ff] transition-all"
                  />
                  {/* Datalist for suggestions */}
                  <datalist id="task-types">
                    {SUGGESTED_TYPES.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>

                  <input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    className="bg-[#0F172A] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#51e5ff] transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowAdd(false)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium text-[#94A3B8] hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTask}
                    className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-[#51e5ff] text-[#0F172A] hover:bg-[#22d3ee] transition-colors shadow-[0_0_15px_-3px_rgba(81,229,255,0.4)]"
                  >
                    Create Task
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Calendar */}
          <div className="h-fit space-y-6">
            <div className="bg-[#1E293B]/50 backdrop-blur-sm rounded-2xl p-6 border border-white/5 sticky top-32">
              <div className="flex items-center justify-between mb-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <CalendarIcon className="w-5 h-5 text-[#51e5ff]" />
                  <span>{currentMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span>
                </h2>
                <div className="flex gap-1 bg-[#0F172A] p-1 rounded-lg">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-1.5 text-[#94A3B8] hover:text-white hover:bg-white/10 rounded-md transition-all"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-1.5 text-[#94A3B8] hover:text-white hover:bg-white/10 rounded-md transition-all"
                  >
                    ▶
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-4">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <span key={d} className="text-center text-xs font-bold text-[#64748B] uppercase tracking-wider">{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array(firstDay).fill(0).map((_, i) => <div key={`pad-${i}`} />)}

                {Array(daysInMonth).fill(0).map((_, i) => {
                  const d = i + 1;
                  const tasksOnDay = taskForDate(d);
                  const isCurrent = isToday(d);

                  let dayStatus = "default";
                  if (tasksOnDay.length > 0) {
                    if (tasksOnDay.some(t => !t.done)) dayStatus = "has-tasks";
                    else dayStatus = "all-done";
                  }

                  return (
                    <div key={d} className="relative aspect-square group">
                      <button
                        className={`
                            w-full h-full rounded-lg text-sm font-medium transition-all flex flex-col items-center justify-center
                            ${isCurrent ? "bg-[#51e5ff] text-[#0F172A] font-bold shadow-[0_0_15px_-3px_rgba(81,229,255,0.4)]" : "text-[#94A3B8] hover:bg-white/5 hover:text-white"}
                            ${dayStatus === "has-tasks" && !isCurrent ? "bg-[#1E293B] border border-[#51e5ff]/30 text-white" : ""}
                          `}
                      >
                        {d}
                        {dayStatus !== "default" && !isCurrent && (
                          <span className={`mt-1 w-1 h-1 rounded-full ${dayStatus === "all-done" ? "bg-[#4ade80]" : "bg-[#51e5ff]"}`} />
                        )}
                      </button>

                      {/* Hover Tooltip for Tasks */}
                      {tasksOnDay.length > 0 && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#0F172A] border border-white/10 rounded-lg p-3 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 text-left">
                          <p className="text-xs font-bold text-[#64748B] mb-2 uppercase tracking-wider">
                            {d} {currentMonth.toLocaleDateString("en-GB", { month: "short" })}
                          </p>
                          <div className="space-y-1">
                            {tasksOnDay.map((t) => (
                              <div key={t.id} className="text-xs flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${t.done ? "bg-[#4ade80]" : "bg-[#51e5ff]"}`} />
                                <span className={t.done ? "text-[#64748B] line-through" : "text-[#E2E8F0]"}>{t.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
