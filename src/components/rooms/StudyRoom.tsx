"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { RoomConfig } from "@/lib/rooms";
import Link from "next/link";

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

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7DD3FC] border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header
        className="px-6 py-6 rounded-b-2xl"
        style={{ background: `linear-gradient(135deg, ${room.card} 0%, ${room.muted} 100%)`, color: "#0B1220" }}
      >
        <div className="max-w-4xl mx-auto flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{room.emoji} {room.name} Room</h1>
            <p className="mt-1 text-[#0B1220]/80">&ldquo;{room.tagline}&rdquo;</p>
            <p className="mt-2 text-sm opacity-70">{dateStr}</p>
          </div>
          <Link href="/dashboard" className="text-sm font-medium opacity-80 hover:opacity-100 transition-opacity" style={{ color: "#0B1220" }}>
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Add Task Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Enter task title..."
            className="flex-1 rounded-xl px-4 py-3 bg-[#0F172A] text-[#F1F5F9] outline-none"
          />
          <button
            type="button"
            onClick={handleAddTask}
            className="px-4 rounded-xl font-medium"
            style={{ backgroundColor: room.accent, color: "#0B1220" }}
          >
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
              <li key={t.id} className="rounded-2xl p-4 transition-all duration-300" style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", borderLeft: `4px solid ${room.accent}` }}>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => toggle(t.id)}
                    className="w-6 h-6 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors"
                    style={{ borderColor: room.accent, backgroundColor: t.done ? room.accent : "transparent" }}
                  >
                    {t.done && <span className="text-[#0B1220] text-sm">✓</span>}
                  </button>

                  <span className={t.done ? "line-through text-[#94A3B8]" : "text-[#F1F5F9]"}>{t.title}</span>

                  <span className="text-lg" title="Streak">🔥</span>
                  <span className="text-[#F1F5F9]">{t.streak}</span>

                  <button type="button" onClick={() => toggleYear(t.id)} className="text-sm ml-auto" style={{ color: room.accent }}>
                    View Year {expandedYear === t.id ? "▲" : "▼"}
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(t.id)}
                    className="ml-2 text-red-500 font-bold hover:text-red-400 transition-colors"
                    title="Delete task"
                  >
                    ❌
                  </button>
                </div>

                {expandedYear === t.id && (
  <div
    className="mt-4 grid gap-[1px] w-full"
    style={{
      gridTemplateColumns: `repeat(auto-fit, minmax(12px, 1fr))`,
    }}
  >
    {t.yearSquares.slice(0, 365).map((v, i) => (
      <div
        key={i}
        style={{
          width: "100%",
          aspectRatio: "1", // keeps square
          backgroundColor: v ? "#39FF14" : "rgba(148,163,184,0.2)",
          borderRadius: "2px",
        }}
      />
    ))}
  </div>
)}

              </li>
            ))}
          </ul>
        )}

        {/* Weekly Note */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", borderColor: "rgba(148,163,184,0.2)" }}>
          <h3 className="text-sm font-medium text-[#94A3B8] mb-2">Weekly note</h3>
          <p className="text-[#F1F5F9] italic">&ldquo;You showed up most days.&rdquo;</p>
        </div>
      </div>
    </main>
  );
}
