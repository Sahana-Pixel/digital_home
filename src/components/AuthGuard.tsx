"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log("AuthGuard loading:", loading, "user:", user);
    if (loading) return;
    if (!user) {
      console.log("No user, redirecting to /login");
      router.replace("/login");
    }
  }, [user, loading, router]);
  

  // if (loading) {
  //   return (
  //     <main className="min-h-screen flex items-center justify-center">
  //       <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7DD3FC] border-t-transparent" />
  //     </main>
  //   );
  // }

  if (!user) return null;

  return <>{children}</>;
}
