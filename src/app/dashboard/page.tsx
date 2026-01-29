"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ROOMS } from "@/lib/rooms";
import { LogOut, Plus, Sparkles, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [isExiting, setIsExiting] = useState(false);

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
    setIsExiting(true);
    await signOut();
    router.replace("/");
  };

  const userRooms = ROOMS.filter((r) =>
    profile?.selectedRooms?.includes(r.id) ?? false
  );

  if (authLoading || isExiting) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#050912]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7DD3FC] border-t-transparent" />
          <p className="text-[#94A3B8] text-xs uppercase tracking-widest animate-pulse">Initializing</p>
        </div>
      </main>
    );
  }

  // Get time of day for greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = profile?.name?.split(" ")[0] || "there";

  return (
    <main className="min-h-screen px-6 py-12 md:py-20 bg-[#050912] text-[#F1F5F9] relative overflow-hidden selection:bg-[#7DD3FC]/20">
      {/* Cinematic Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[0%] w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03),transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.03),transparent_70%)] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Minimal Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 fade-in">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] uppercase tracking-[0.2em] text-[#94A3B8]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#7DD3FC] animate-pulse" />
              My Home
            </div>

            <h1 className="text-4xl md:text-6xl font-extralight tracking-tight text-white leading-tight">
              {timeGreeting}, <br />
              <span className="font-semibold">{firstName}</span>.
            </h1>
          </div>

          <button
            onClick={handleLeave}
            className="group flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/5 bg-[#0F172A]/40 text-[#64748B] hover:text-white hover:border-white/10 transition-all duration-300 backdrop-blur-md"
          >
            <span className="text-xs uppercase tracking-widest font-medium">Disconnect</span>
            <LogOut className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform opacity-70" />
          </button>
        </header>

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {userRooms.length === 0 ? (
            <div className="col-span-full h-[400px] flex flex-col items-center justify-center text-center rounded-[2rem] border border-dashed border-white/5 bg-white/[0.02]">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 ring-1 ring-white/10">
                <Plus className="w-8 h-8 text-[#64748B]" />
              </div>
              <h3 className="text-xl font-light text-white mb-2">Empty House</h3>
              <p className="text-[#64748B] mb-8 text-sm">Design your sanctuary to begin.</p>
              <Link
                href="/setup"
                className="px-8 py-3 rounded-full bg-white text-black font-medium hover:bg-[#E2E8F0] transition-colors tracking-wide text-sm"
              >
                Enter Setup
              </Link>
            </div>
          ) : (
            userRooms.map((room) => (
              <Link
                key={room.id}
                href={`/room/${room.id}`}
                className="group relative h-[320px] rounded-[2rem] p-2 transition-all duration-500 hover:-translate-y-1 focus:outline-none"
              >
                {/* 1. Outer Frame (Dark Metal Look) */}
                <div className="absolute inset-0 bg-[#0F131C] rounded-[2rem] border border-white/[0.08] shadow-2xl overflow-hidden group-hover:border-white/[0.15] transition-colors duration-500">
                  {/* Subtle texture noise could go here */}
                  <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
                </div>

                {/* 2. Inner "Inset" Panel */}
                <div
                  className="absolute inset-[6px] rounded-[1.7rem] bg-[#090C14] border border-white/[0.03] overflow-hidden"
                  style={{
                    boxShadow: `inset 0 2px 20px rgba(0,0,0,0.8)`
                  }}
                >
                  {/* Ambient Light from bottom */}
                  <div
                    className="absolute bottom-[-20%] left-[-20%] right-[-20%] h-[60%] opacity-20 blur-[60px] transition-opacity duration-700 group-hover:opacity-40"
                    style={{ background: room.accent }}
                  />

                  {/* Hover Reveal Gradient */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 mix-blend-soft-light"
                    style={{ background: `linear-gradient(to bottom, transparent, ${room.card})` }}
                  />

                  {/* Room Content Container */}
                  <div className="relative h-full flex flex-col justify-between p-7 z-10">
                    {/* Top: Icon Well */}
                    <div className="flex justify-between items-start">
                      <div className="relative">
                        {/* The "Well" - darker inset circle */}
                        <div className="w-14 h-14 rounded-full bg-black/40 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] border border-white/[0.05] flex items-center justify-center group-hover:border-white/[0.1] transition-colors">
                          <span className="text-2xl filter drop-shadow-lg grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-110">
                            {room.emoji}
                          </span>
                        </div>
                        {/* Indicator Dot */}
                        <div
                          className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#090C14] transition-transform duration-500 group-hover:scale-110"
                          style={{ background: room.accent }}
                        />
                      </div>

                      <ArrowRight className="w-5 h-5 text-[#475569] group-hover:text-white transition-colors duration-300" />
                    </div>

                    {/* Bottom: Typography */}
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-3xl font-light text-white tracking-tight mb-1 group-hover:translate-x-1 transition-transform duration-500">
                          {room.name}
                        </h2>
                        <div className="h-[1px] w-8 bg-white/20 group-hover:w-full group-hover:bg-white/40 transition-all duration-700 ease-out" />
                      </div>

                      <p className="text-[#64748B] text-sm leading-relaxed line-clamp-2 group-hover:text-[#94A3B8] transition-colors">
                        {room.tagline}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

