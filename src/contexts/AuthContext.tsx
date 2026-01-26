"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { RoomId } from "@/lib/rooms";

export interface UserProfile {
  name: string;
  email: string;
  setupCompleted: boolean;
  selectedRooms: RoomId[];
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(
    async (uid: string, fallback?: { email?: string; name?: string }) => {
      try {
        console.log("[AuthContext] Loading profile for uid:", uid);
        const snap = await getDoc(doc(db, "users", uid));

        if (snap.exists()) {
          const d = snap.data();
          setProfile({
            name: d.name ?? fallback?.name ?? "",
            email: d.email ?? fallback?.email ?? "",
            setupCompleted: !!d.setupCompleted,
            selectedRooms: Array.isArray(d.selectedRooms) ? d.selectedRooms : [],
          });
          console.log("[AuthContext] Profile loaded:", d);
        } else {
          console.log("[AuthContext] No profile found, using fallback:", fallback);
          setProfile({
            name: fallback?.name ?? "",
            email: fallback?.email ?? "",
            setupCompleted: false,
            selectedRooms: [],
          });
        }
      } catch (err: any) {
        console.error("[AuthContext] Failed to load profile:", err.code, err.message);
        setProfile({
          name: fallback?.name ?? "",
          email: fallback?.email ?? "",
          setupCompleted: false,
          selectedRooms: [],
        });
      }
    },
    []
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      console.log("[AuthContext] Auth state changed:", u?.uid ?? null);
      setUser(u);
      if (u) {
        await loadProfile(u.uid, { email: u.email ?? "", name: u.displayName ?? "" });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    setLoading(true);
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
    setLoading(false);
    console.log("[AuthContext] User signed out");
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    console.log("[AuthContext] Refreshing profile for:", user.uid);
    try {
      await loadProfile(user.uid, { email: user.email ?? "", name: user.displayName ?? "" });
    } catch (err: any) {
      console.error("[AuthContext] Failed to refresh profile:", err.code, err.message);
    }
  }, [user, loadProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
