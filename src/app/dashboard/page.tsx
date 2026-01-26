"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ROOMS, type RoomId } from "@/lib/rooms";

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (profile && !profile.setupCompleted) {
      router.replace("/setup");
    }
  }, [user, profile, authLoading, router]);

  const handleLeave = async () => {
    await signOut();
    router.replace("/");
  };

  const rooms = ROOMS.filter((r) =>
    profile?.selectedRooms?.includes(r.id) ?? false
  );

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7DD3FC] border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 md:py-14">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
          >
            My House
          </Link>
          <button
            type="button"
            onClick={handleLeave}
            className="text-sm text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
          >
            Leave
          </button>
        </div>
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#F1F5F9]">
            Welcome, {profile?.name || "there"}!
          </h1>
        </div>
        {/* House status card – neutral dark */}
        <div className="rounded-2xl border border-[#94A3B8]/15 bg-[#0F172A]/70 px-6 py-4 shadow-soft mb-8">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-emerald-400/90 shadow-[0_0_8px_rgba(52,211,153,0.6)]" aria-hidden />
            <span className="text-[#F1F5F9]">
              Your house is balanced today
            </span>
          </div>
        </div>

        {/* Room cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5 stagger-children">
          {rooms.length === 0 ? (
            <div
              className="col-span-full rounded-2xl border border-[#94A3B8]/20 bg-[#0F172A]/50 px-6 py-10 text-center text-[#94A3B8]"
            >
              <p>No rooms in your house yet.</p>
              <p className="mt-1 text-sm">Go to Setup to choose your rooms.</p>
              <Link
                href="/setup"
                className="mt-4 inline-block text-[#7DD3FC] hover:underline"
              >
                Open Setup
              </Link>
            </div>
          ) : (
          rooms.map((room) => (
            <Link
              key={room.id}
              href={`/room/${room.id}`}
              className="
                group flex flex-col rounded-2xl p-5 md:p-6
                transition-all duration-300
                hover:scale-[1.02] hover:shadow-lg
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7DD3FC] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1220]
              "
              style={{
                backgroundColor: room.card,
                color: "#0B1220",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.2), 0 0 24px ${room.accent}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
              }}
            >
              <span className="text-3xl md:text-4xl mb-2" aria-hidden>
                {room.emoji}
              </span>
              <span className="font-semibold text-[#0B1220]">{room.name}</span>
            </Link>
          )))}
        </div>
      </div>
    </main>
  );
}
