"use client";

import { useState, useEffect } from "react";
import type { RoomConfig } from "@/lib/rooms";
import Link from "next/link";
import { ArrowLeft, Plus, X, Activity, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  increment
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Task = {
  id: string;
  text: string;
};

type Goal = {
  id: string;
  title: string;
  completedCount: number;
  tasks: Task[];
};

export function ProjectsRoom({ room }: { room: RoomConfig }) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [taskInputs, setTaskInputs] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Load Goals & Tasks
  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const loadData = async () => {
      try {
        // 1. Fetch Goals
        const goalsRef = collection(db, "users", user.uid, "rooms", "project", "goals");
        const goalsQ = query(goalsRef, orderBy("createdAt", "asc"));
        const goalsSnap = await getDocs(goalsQ);

        // 2. Fetch Tasks for each Goal
        const loadedGoals = await Promise.all(
          goalsSnap.docs.map(async (goalDoc) => {
            const tasksRef = collection(db, "users", user.uid, "rooms", "project", "goals", goalDoc.id, "tasks");
            const tasksQ = query(tasksRef, orderBy("createdAt", "asc"));
            const tasksSnap = await getDocs(tasksQ);

            const tasks: Task[] = tasksSnap.docs.map(tDoc => ({
              id: tDoc.id,
              text: tDoc.data().text
            }));

            return {
              id: goalDoc.id,
              title: goalDoc.data().title,
              completedCount: goalDoc.data().completedCount || 0,
              tasks
            };
          })
        );

        if (mounted) {
          setGoals(loadedGoals);
        }
      } catch (err) {
        console.error("[ProjectsRoom] Failed to load data:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => { mounted = false; };
  }, [user]);

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !user) return;

    const title = newGoalTitle.trim();
    const tempId = Date.now().toString();

    // Optimistic Update
    setGoals(prev => [...prev, { id: tempId, title, completedCount: 0, tasks: [] }]);
    setNewGoalTitle("");

    try {
      const ref = collection(db, "users", user.uid, "rooms", "project", "goals");
      const docRef = await addDoc(ref, {
        title,
        completedCount: 0,
        createdAt: serverTimestamp()
      });

      // Update ID
      setGoals(prev => prev.map(g => g.id === tempId ? { ...g, id: docRef.id } : g));
    } catch (err) {
      console.error("[ProjectsRoom] Add goal error:", err);
      setGoals(prev => prev.filter(g => g.id !== tempId));
    }
  };

  const removeGoal = async (id: string) => {
    if (!user) return;
    const prevGoals = [...goals];
    setGoals(prev => prev.filter(g => g.id !== id));

    try {
      const ref = doc(db, "users", user.uid, "rooms", "project", "goals", id);
      await deleteDoc(ref);
    } catch (err) {
      console.error("[ProjectsRoom] Remove goal error:", err);
      setGoals(prevGoals);
    }
  };

  const addTask = async (e: React.FormEvent, goalId: string) => {
    e.preventDefault();
    const text = taskInputs[goalId];
    if (!text?.trim() || !user) return;

    const newTask = { id: Date.now().toString(), text: text.trim() };

    // Optimistic Update
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        return { ...g, tasks: [...g.tasks, newTask] };
      }
      return g;
    }));
    setTaskInputs(prev => ({ ...prev, [goalId]: "" }));

    try {
      const tasksRef = collection(db, "users", user.uid, "rooms", "project", "goals", goalId, "tasks");
      const docRef = await addDoc(tasksRef, {
        text: newTask.text,
        createdAt: serverTimestamp()
      });

      setGoals(prev => prev.map(g => {
        if (g.id === goalId) {
          return {
            ...g,
            tasks: g.tasks.map(t => t.id === newTask.id ? { ...t, id: docRef.id } : t)
          };
        }
        return g;
      }));
    } catch (err) {
      console.error("[ProjectsRoom] Add task error:", err);
      // Revert
      setGoals(prev => prev.map(g => {
        if (g.id === goalId) {
          return { ...g, tasks: g.tasks.filter(t => t.id !== newTask.id) };
        }
        return g;
      }));
    }
  };

  const completeTask = async (goalId: string, taskId: string) => {
    if (!user) return;

    const goalToUpdate = goals.find(g => g.id === goalId);
    if (!goalToUpdate) return;
    const taskToRestore = goalToUpdate.tasks.find(t => t.id === taskId);

    // Optimistic Update: Remove task and increment count
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          completedCount: g.completedCount + 1,
          tasks: g.tasks.filter(t => t.id !== taskId)
        };
      }
      return g;
    }));

    try {
      // 1. Delete Task Doc
      const taskRef = doc(db, "users", user.uid, "rooms", "project", "goals", goalId, "tasks", taskId);
      await deleteDoc(taskRef);

      // 2. Increment Parent Goal Count
      const goalRef = doc(db, "users", user.uid, "rooms", "project", "goals", goalId);
      await updateDoc(goalRef, {
        completedCount: increment(1)
      });
    } catch (err) {
      console.error("[ProjectsRoom] Complete task error:", err);
      // Restore
      if (taskToRestore) {
        setGoals(prev => prev.map(g => {
          if (g.id === goalId) {
            return {
              ...g,
              completedCount: g.completedCount - 1,
              tasks: [...g.tasks, taskToRestore]
            };
          }
          return g;
        }));
      }
    }
  };

  const handleInputChange = (goalId: string, value: string) => {
    setTaskInputs(prev => ({ ...prev, [goalId]: value }));
  };

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center bg-[#0F0720]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D8B4FE] border-t-transparent" />
        <p className="text-[#D8B4FE] text-xs uppercase tracking-widest opacity-80">Building...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#0F0720] text-[#E9D5FF] selection:bg-[#7E22CE]/30 selection:text-white">

      {/* Header */}
      <header className="px-6 py-8 md:py-12 border-b border-white/[0.05] bg-[#0F0720]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 text-sm text-[#A696C8] hover:text-white transition-colors"
            >
              <div className="p-1.5 rounded-full bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span>Dashboard</span>
            </Link>

            <div className="text-xs font-mono text-[#D8B4FE] tracking-widest uppercase opacity-80 border border-[#D8B4FE]/20 px-3 py-1 rounded-full bg-[#D8B4FE]/5 shadow-[0_0_10px_-3px_rgba(216,180,254,0.3)]">
              {dateStr}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-[#2D1B4E] border border-white/5 shadow-[0_0_20px_-5px_rgba(126,34,206,0.5)] ring-1 ring-[#7E22CE]/30">
              <span className="text-3xl filter drop-shadowmd">{room.emoji}</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{room.name}</h1>
              <p className="text-[#A696C8] text-sm mt-1 font-medium tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D8B4FE] animate-pulse shadow-[0_0_8px_rgba(216,180,254,0.8)]" />
                {room.tagline}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* New Goal Input */}
        <form onSubmit={addGoal} className="mb-12">
          <div className="relative group max-w-xl">
            <input
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="New Challenge (e.g., 'Morning Routine')..."
              className="w-full bg-[#1A102E] border border-[#D8B4FE]/10 text-lg px-6 py-4 rounded-2xl text-white placeholder:text-[#6B5A7A] focus:border-[#D8B4FE]/50 focus:ring-1 focus:ring-[#D8B4FE]/50 outline-none transition-all shadow-lg hover:border-[#D8B4FE]/30"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-[#7E22CE] text-white opacity-0 group-focus-within:opacity-100 hover:opacity-100 transition-all shadow-[0_0_15px_-3px_rgba(126,34,206,0.6)] hover:bg-[#9333EA]"
              disabled={!newGoalTitle.trim()}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-[#2D1B4E] rounded-3xl bg-[#1A102E]/40 group">
            <Trophy className="w-12 h-12 mx-auto text-[#6B5A7A] mb-4 group-hover:text-[#D8B4FE] transition-colors drop-shadow-md" />
            <p className="text-[#A696C8] text-lg font-medium">No active challenges.</p>
            <p className="text-[#6B5A7A] mt-2 text-sm">Set a goal to start building consistency.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {goals.map((goal) => {
              const total = goal.tasks.length + goal.completedCount;
              const progress = total === 0 ? 0 : Math.round((goal.completedCount / total) * 100);

              return (
                <div
                  key={goal.id}
                  className="w-full group bg-[#1A102E]/60 border border-[#D8B4FE]/10 rounded-2xl p-6 hover:border-[#D8B4FE]/40 transition-all duration-300 hover:shadow-2xl hover:shadow-[#7E22CE]/10 hover:bg-[#1A102E]"
                >
                  {/* Goal Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-white tracking-tight leading-snug">
                        {goal.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-[#E9D5FF] bg-[#7E22CE]/20 px-2 py-0.5 rounded-full border border-[#7E22CE]/30">
                          {progress}% Done
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeGoal(goal.id)}
                      className="text-[#6B5A7A] hover:text-[#ef4444] p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-[#0F0720] rounded-full overflow-hidden mb-6 border border-white/5 shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-[#7E22CE] to-[#D8B4FE] transition-all duration-500 ease-out shadow-[0_0_10px_rgba(216,180,254,0.5)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-3 mb-6 min-h-[50px]">
                    {goal.tasks.length === 0 ? (
                      <div className="flex items-center justify-center h-20 border border-dashed border-[#D8B4FE]/10 rounded-xl bg-[#0F0720]/30">
                        <span className="text-xs text-[#6B5A7A] italic">No pending tasks</span>
                      </div>
                    ) : (
                      goal.tasks.map((task) => (
                        <div key={task.id} className="flex items-start gap-3 group/task animate-in fade-in slide-in-from-left-2 duration-300">
                          <button
                            onClick={() => completeTask(goal.id, task.id)}
                            className="mt-0.5 w-5 h-5 rounded-md border border-[#6B5A7A] flex-shrink-0 hover:border-[#D8B4FE] hover:bg-[#D8B4FE] transition-all flex items-center justify-center group-hover/task:border-[#D8B4FE] group-hover/task:shadow-[0_0_8px_rgba(216,180,254,0.4)]"
                          >
                            <Activity className="w-3 h-3 text-[#0F0720] opacity-0 group-hover:opacity-100 transition-opacity font-bold" />
                          </button>
                          <span className="text-sm text-[#E9D5FF] leading-snug break-words group-hover:text-white transition-colors">
                            {task.text}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Task Input */}
                  <form onSubmit={(e) => addTask(e, goal.id)} className="relative mt-auto">
                    <input
                      value={taskInputs[goal.id] || ""}
                      onChange={(e) => handleInputChange(goal.id, e.target.value)}
                      placeholder="+ Add task"
                      className="w-full bg-[#0F0720]/50 border border-[#D8B4FE]/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-[#6B5A7A] focus:border-[#D8B4FE]/40 focus:bg-[#0F0720] outline-none transition-all focus:shadow-[0_0_10px_-5px_rgba(216,180,254,0.3)]"
                    />
                  </form>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
