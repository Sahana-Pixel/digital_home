"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { ROOMS, type RoomId } from "@/lib/rooms";

export default function SetupPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [selected, setSelected] = useState<Set<RoomId>>(
    new Set(ROOMS.map((r) => r.id))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("SetupPage: authLoading", authLoading, "user:", user, "profile:", profile);
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [user, authLoading, profile, router]);
  

  const toggle = (id: RoomId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    setLoading(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: profile?.name ?? user.displayName ?? user.email ?? "",
          email: user.email ?? "",
          setupCompleted: true,
          selectedRooms: Array.from(selected),
        },
        { merge: true }
      );
      await refreshProfile();
      router.replace("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7DD3FC] border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="rounded-3xl border border-[#94A3B8]/20 bg-[#0F172A]/80 p-8 md:p-10 shadow-soft backdrop-blur-sm">
          <h1 className="text-2xl font-semibold text-[#F1F5F9]">
            Let&apos;s build your house 🏠
          </h1>
          <p className="mt-2 text-[#94A3B8]">
            Choose the rooms you want in your house
          </p>

          <form onSubmit={handleSubmit} className="mt-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ROOMS.map((room) => {
                const isSelected = selected.has(room.id);
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => toggle(room.id)}
                    className={`
                      flex items-center gap-3 rounded-2xl px-4 py-3 text-left
                      transition-all duration-300
                      ${isSelected
                        ? "shadow-soft ring-1 ring-white/10"
                        : "opacity-60 hover:opacity-80"
                      }
                    `}
                    style={{
                      backgroundColor: isSelected ? room.card : "rgba(30, 41, 59, 0.6)",
                      color: isSelected ? "#0B1220" : "#94A3B8",
                    }}
                  >
                    <span className="text-xl">{room.emoji}</span>
                    <span className="font-medium">{room.name}</span>
                    {isSelected && (
                      <span className="ml-auto text-sm" aria-hidden>✔</span>
                    )}
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="mt-4 text-sm text-amber-400/90" role="alert">
                {error}
              </p>
            )}
            <div className="mt-10 flex justify-center">
              <Button type="submit" loading={loading}>
                Enter My House
              </Button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-[#94A3B8] text-sm">
          <Link href="/login" className="text-[#7DD3FC] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
