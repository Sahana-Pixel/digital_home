"use client";

import { useState, useEffect } from "react";
import type { RoomConfig } from "@/lib/rooms";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Plus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Todo = {
  id: string;
  text: string;
};

type Goal = {
  id: string;
  title: string;
  todos: Todo[];
};

export function PlannerRoom({ room }: { room: RoomConfig }) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [todoInputs, setTodoInputs] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Load Goals & Todos
  useEffect(() => {
    console.log("[Planner] user:", user);
    console.log("[Planner] uid:", user?.uid);

    if (!user) return;

    let mounted = true;

    const loadData = async () => {
      console.log("[Planner] Loading goals from Firestore");
      try {
        // 1. Fetch Goals
        const goalsRef = collection(db, "users", user.uid, "rooms", "planner", "goals");
        const goalsQ = query(goalsRef, orderBy("createdAt", "asc"));
        const goalsSnap = await getDocs(goalsQ);

        // 2. Fetch Todos for each Goal in parallel
        const loadedGoals = await Promise.all(
          goalsSnap.docs.map(async (goalDoc) => {
            const todosRef = collection(db, "users", user.uid, "rooms", "planner", "goals", goalDoc.id, "todos");
            const todosQ = query(todosRef, orderBy("createdAt", "asc"));
            const todosSnap = await getDocs(todosQ);

            const todos: Todo[] = todosSnap.docs.map(tDoc => ({
              id: tDoc.id,
              text: tDoc.data().text
            }));

            return {
              id: goalDoc.id,
              title: goalDoc.data().title,
              todos
            };
          })
        );

        console.log("[Planner] Number of goals loaded:", loadedGoals.length);

        if (mounted) {
          setGoals(loadedGoals);
        }
      } catch (err) {
        console.error("[PlannerRoom] Failed to load data:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => { mounted = false; };
  }, [user]);

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Planner] Add Goal clicked");

    if (!newGoalTitle.trim() || !user) {
      console.warn("[Planner] Add Goal aborted: missing title or user");
      return;
    }

    const title = newGoalTitle.trim();
    const tempId = Date.now().toString();

    console.log("[Planner] Goal title:", title);
    console.log("[Planner] UID before write:", user.uid);
    console.log("[Planner] Firestore path:", `users/${user.uid}/rooms/planner/goals`);

    // Optimistic Update
    setGoals(prev => [...prev, { id: tempId, title, todos: [] }]);
    setNewGoalTitle("");

    try {
      const ref = collection(db, "users", user.uid, "rooms", "planner", "goals");
      const docRef = await addDoc(ref, {
        title,
        createdAt: serverTimestamp()
      });
      console.log("[Planner] Goal added with ID:", docRef.id);

      // Update ID from temp to real
      setGoals(prev => prev.map(g => g.id === tempId ? { ...g, id: docRef.id } : g));
    } catch (err) {
      console.error("[Planner] Failed to add goal:", err);
      // Revert
      setGoals(prev => prev.filter(g => g.id !== tempId));
    }
  };

  const removeGoal = async (id: string) => {
    if (!user) return;

    // Store previous state for revert
    const prevGoals = [...goals];
    setGoals(prev => prev.filter(g => g.id !== id));

    try {
      const ref = doc(db, "users", user.uid, "rooms", "planner", "goals", id);
      await deleteDoc(ref);
    } catch (err) {
      console.error("[PlannerRoom] Remove goal error:", err);
      setGoals(prevGoals);
    }
  };

  const addTodo = async (e: React.FormEvent, goalId: string) => {
    e.preventDefault();
    const text = todoInputs[goalId];
    if (!text?.trim() || !user) return;

    const newTodo = { id: Date.now().toString(), text: text.trim() };

    console.log("[Planner] Adding todo to goal:", goalId);
    console.log("[Planner] Todo text:", text);

    // Optimistic Update
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        return { ...g, todos: [...g.todos, newTodo] };
      }
      return g;
    }));
    setTodoInputs(prev => ({ ...prev, [goalId]: "" }));

    try {
      // Add to subcollection
      const todosRef = collection(db, "users", user.uid, "rooms", "planner", "goals", goalId, "todos");
      const docRef = await addDoc(todosRef, {
        text: newTodo.text,
        createdAt: serverTimestamp()
      });
      console.log("[Planner] Todo added with ID:", docRef.id);

      // Update ID from temp to real
      setGoals(prev => prev.map(g => {
        if (g.id === goalId) {
          return {
            ...g,
            todos: g.todos.map(t => t.id === newTodo.id ? { ...t, id: docRef.id } : t)
          };
        }
        return g;
      }));
    } catch (err) {
      console.error("[Planner] Add todo error:", err);
      // Revert optimistic update
      setGoals(prev => prev.map(g => {
        if (g.id === goalId) {
          return { ...g, todos: g.todos.filter(t => t.id !== newTodo.id) };
        }
        return g;
      }));
    }
  };

  const completeTodo = async (goalId: string, todoId: string) => {
    if (!user) return;

    // Find item to restore if needed
    const goalToUpdate = goals.find(g => g.id === goalId);
    const todoToRestore = goalToUpdate?.todos.find(t => t.id === todoId);

    // Optimistic Update (Remove immediately)
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          todos: g.todos.filter(t => t.id !== todoId)
        };
      }
      return g;
    }));

    try {
      // Delete from subcollection
      const todoRef = doc(db, "users", user.uid, "rooms", "planner", "goals", goalId, "todos", todoId);
      await deleteDoc(todoRef);
    } catch (err) {
      console.error("[PlannerRoom] Complete todo error:", err);
      // Restore
      if (goalToUpdate && todoToRestore) {
        setGoals(prev => prev.map(g => {
          if (g.id === goalId) {
            return { ...g, todos: [...g.todos, todoToRestore] };
          }
          return g;
        }));
      }
    }
  };

  const handleTodoInputChange = (goalId: string, value: string) => {
    setTodoInputs(prev => ({ ...prev, [goalId]: value }));
  };

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center bg-[#18181B]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F9A825] border-t-transparent" />
        <p className="text-[#F9A825] text-xs uppercase tracking-widest opacity-80">Planning...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#18181B] text-[#E4E4E7] selection:bg-[#F9A825]/20">

      {/* Header */}
      <header className="px-6 py-8 md:py-12 border-b border-white/[0.05] bg-[#18181B]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#E4E4E7] transition-colors"
            >
              <div className="p-1.5 rounded-full bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span>Dashboard</span>
            </Link>

            <div className="text-xs font-mono text-[#F9A825] tracking-widest uppercase opacity-80 border border-[#F9A825]/20 px-3 py-1 rounded-full bg-[#F9A825]/5">
              {dateStr}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-[#27272A] border border-white/5 shadow-[0_0_20px_-5px_rgba(249,168,37,0.15)] ring-1 ring-[#F9A825]/20">
              <span className="text-3xl">{room.emoji}</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{room.name}</h1>
              <p className="text-[#A1A1AA] text-sm mt-1 font-medium tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F9A825] animate-pulse" />
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
              placeholder="Create a new goal..."
              className="w-full bg-[#27272A] border border-white/10 text-lg px-6 py-4 rounded-2xl text-white placeholder:text-[#52525B] focus:border-[#F9A825]/50 focus:ring-1 focus:ring-[#F9A825]/50 outline-none transition-all shadow-lg"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-[#F9A825] text-[#18181B] opacity-0 group-focus-within:opacity-100 hover:opacity-100 transition-all shadow-[0_0_15px_-3px_rgba(249,168,37,0.4)]"
              disabled={!newGoalTitle.trim()}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-[#27272A] rounded-3xl bg-[#27272A]/20">
            <p className="text-[#52525B] text-lg font-medium">No plans yet.</p>
            <p className="text-[#3F3F46] mt-2 text-sm">Start by creating a goal above.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="group bg-[#27272A]/50 border border-white/5 rounded-2xl p-5 hover:border-[#F9A825]/20 transition-all duration-300 hover:shadow-xl"
              >
                {/* Goal Header */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-lg text-[#F4F4F5] tracking-tight leading-snug">
                    {goal.title}
                  </h3>
                  <button
                    onClick={() => removeGoal(goal.id)}
                    className="text-[#52525B] hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Todos List */}
                <div className="space-y-2 mb-4 min-h-[50px]">
                  {goal.todos.length === 0 && (
                    <p className="text-xs text-[#52525B] italic">No tasks added.</p>
                  )}
                  {goal.todos.map((todo) => (
                    <div key={todo.id} className="flex items-start gap-3 group/todo animate-in fade-in slide-in-from-left-2 duration-300">
                      <button
                        onClick={() => completeTodo(goal.id, todo.id)}
                        className="mt-0.5 w-4 h-4 rounded-full border border-[#52525B] flex-shrink-0 hover:border-[#F9A825] hover:bg-[#F9A825]/10 bg-transparent transition-all flex items-center justify-center group-hover/todo:border-[#F9A825]"
                      >
                        <div className="w-2 h-2 rounded-full bg-[#F9A825] opacity-0 hover:opacity-100 transition-opacity" />
                      </button>
                      <span className="text-sm text-[#D4D4D8] leading-tight break-words">
                        {todo.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Add Todo Input */}
                <form onSubmit={(e) => addTodo(e, goal.id)} className="relative">
                  <input
                    value={todoInputs[goal.id] || ""}
                    onChange={(e) => handleTodoInputChange(goal.id, e.target.value)}
                    placeholder="+ Add a step"
                    className="w-full bg-transparent border-t border-white/5 py-3 text-sm text-[#E4E4E7] placeholder:text-[#52525B] focus:border-[#F9A825]/30 outline-none transition-colors"
                  />
                </form>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
