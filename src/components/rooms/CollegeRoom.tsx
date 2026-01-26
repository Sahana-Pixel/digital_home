"use client";

import { useState, useEffect } from "react";
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

type TaskType = "Assignment" | "Workshop" | "Viva" | "Certificate";

interface CollegeTask {
  id: string;
  title: string;
  type: TaskType;
  due: string;
  done: boolean;
}

const TASK_TYPES: TaskType[] = ["Assignment", "Workshop", "Viva", "Certificate"];

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
  const [filter, setFilter] = useState<TaskType | "All">("All");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("Assignment");
  const [due, setDue] = useState("");

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
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
              type: data.type,
              due: data.due,
              done: data.done,
            };
          })
        );
      } catch (err) {
        console.error("[CollegeRoom] load error:", err);
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

    const newTask = {
      title: title.trim(),
      type,
      due,
      done: false,
      createdAt: serverTimestamp(),
    };

    try {
      const ref = collection(db, "users", user.uid, "rooms", "college", "tasks");
      const docRef = await addDoc(ref, newTask);

      setTasks((p) => [
        ...p,
        { id: docRef.id, title: newTask.title, type, due, done: false },
      ]);

      setShowAdd(false);
      setTitle("");
      setType("Assignment");
      setDue("");
    } catch (err) {
      console.error("[CollegeRoom] add error:", err);
    }
  };

  const filtered =
    filter === "All" ? tasks : tasks.filter((t) => t.type === filter);

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
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-medium text-[#F1F5F9] mb-4">Task List</h2>
            <ul className="space-y-3">
              {filtered.length === 0 ? (
                <li
                  className="rounded-2xl p-6 text-center text-[#94A3B8]"
                  style={{ backgroundColor: "rgba(15, 23, 42, 0.5)" }}
                >
                  Nothing here yet.
                </li>
              ) : (
                filtered.map((t) => {
                  const days = getDaysUntil(t.due);
                  let status = null;

                  if (t.done) status = "Completed";
                  else if (days < 0) status = "Task not done";
                  else if (days === 1) status = "Task near";

                  return (
                    <li
                      key={t.id}
                      className="rounded-2xl p-4 transition-all"
                      style={{ backgroundColor: "rgba(15, 23, 42, 0.5)" }}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggle(t.id)}
                          className="w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors"
                          style={{
                            borderColor: room.accent,
                            backgroundColor: t.done ? room.accent : "transparent",
                          }}
                        >
                          {t.done && (
                            <span className="text-[#0B1220] text-xs">✓</span>
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <span
                            className={
                              t.done
                                ? "line-through text-[#94A3B8]"
                                : "text-[#F1F5F9]"
                            }
                          >
                            {t.title}
                          </span>
                          <p className="text-sm text-[#94A3B8] mt-1">
                            Type: {t.type} · Due:{" "}
                            {new Date(t.due).toLocaleDateString("en-GB")}
                            {status && (
                              <span className="ml-2" style={{ color: room.accent }}>
                                {status}
                              </span>
                            )}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteTask(t.id)}
                          className="text-[#94A3B8] hover:text-red-400 transition-colors"
                          title="Delete task"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>

            <button
              type="button"
              onClick={() => setShowAdd((v) => !v)}
              className="mt-4 w-full rounded-2xl py-3 border-2 border-dashed flex items-center justify-center gap-2 transition-colors hover:border-[#7DD3FC]/50"
              style={{ borderColor: "rgba(148,163,184,0.3)", color: "#94A3B8" }}
            >
              [+] Add Task
            </button>

            {showAdd && (
              <div
                className="mt-4 rounded-2xl p-4 space-y-3"
                style={{ backgroundColor: "rgba(15, 23, 42, 0.5)" }}
              >
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title"
                  className="w-full rounded-xl px-4 py-2 bg-[#0F172A] text-[#F1F5F9] outline-none"
                />

                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TaskType)}
                  className="w-full rounded-xl px-4 py-2 bg-[#0F172A] text-[#F1F5F9] outline-none"
                >
                  {TASK_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>

                <input
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  className="w-full rounded-xl px-4 py-2 bg-[#0F172A] text-[#F1F5F9] outline-none"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAdd(false)}
                    className="flex-1 rounded-xl py-2 text-[#94A3B8]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTask}
                    className="flex-1 rounded-xl py-2 font-medium"
                    style={{ backgroundColor: room.accent, color: "#0B1220" }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6">
              <p className="text-sm text-[#94A3B8] mb-2">Filter</p>
              <div className="flex flex-wrap gap-2">
                {(["All", ...TASK_TYPES] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                      filter === f ? "opacity-100" : "opacity-60 hover:opacity-80"
                    }`}
                    style={{
                      backgroundColor:
                        filter === f ? room.accent : "rgba(148,163,184,0.2)",
                      color: filter === f ? "#0B1220" : "#94A3B8",
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-5 h-fit"
            style={{ backgroundColor: "rgba(15, 23, 42, 0.5)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-[#F1F5F9]">
                {currentMonth.toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() - 1
                      )
                    )
                  }
                  className="text-[#94A3B8] hover:text-[#F1F5F9]"
                >
                  ◀ Prev
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1
                      )
                    )
                  }
                  className="text-[#94A3B8] hover:text-[#F1F5F9]"
                >
                  Next ▶
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#94A3B8] mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array(firstDay)
                .fill(0)
                .map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}

              {Array(daysInMonth)
                .fill(0)
                .map((_, i) => {
                  const d = i + 1;
                  const tasksOnDay = taskForDate(d);

                  let bg;
                  if (tasksOnDay.length > 0) {
                    if (tasksOnDay.some((t) => !t.done && getDaysUntil(t.due) < 0))
                      bg = "rgba(248,113,113,0.5)";
                    else if (tasksOnDay.every((t) => t.done))
                      bg = "rgba(34,197,94,0.5)";
                    else bg = "rgba(250,204,21,0.5)";
                  }

                  return (
                    <button
                      key={d}
                      type="button"
                      title={tasksOnDay.map((t) => t.title).join(", ")}
                      className={`aspect-square rounded-lg text-sm transition-colors ${
                        isToday(d) ? "ring-2" : "hover:bg-white/10"
                      }`}
                      style={{
                        color: "#F1F5F9",
                        backgroundColor: bg,
                        ...(isToday(d) && { ringColor: room.accent }),
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
