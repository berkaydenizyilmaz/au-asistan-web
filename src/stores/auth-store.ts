import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  role: "user" | "admin" | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setRole: (role: "user" | "admin" | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setRole: (role) => set({ role }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
