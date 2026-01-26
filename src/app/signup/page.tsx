"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (user && profile) {
      router.replace(profile.setupCompleted ? "/dashboard" : "/setup");
    }
  }, [user, profile, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user: u } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", u.uid), {
        name,
        email,
        setupCompleted: false,
        selectedRooms: [],
      });
      router.replace("/setup");
    } catch (err: any) {
      console.error("Firebase signup error:", err); // 🔍 see the exact error
      setError(err.code || "Something went wrong. Please try again.");
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
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-[#94A3B8]/20 bg-[#0F172A]/80 p-8 shadow-soft backdrop-blur-sm">
          <h1 className="text-2xl font-semibold text-[#F1F5F9]">
            Build your house 🧱
          </h1>
          <p className="mt-1 text-[#94A3B8]">This is just for you.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <Input
              label="Name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              showPasswordToggle
            />
            {error && (
              <p className="text-sm text-amber-400/90" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" loading={loading} className="w-full">
              Continue
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-[#94A3B8] text-sm">
          Already have a house?{" "}
          <Link href="/login" className="text-[#7DD3FC] hover:underline">
            Enter
          </Link>
        </p>
      </div>
    </main>
  );
}
