import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GameSession {
  levelId: string;
  score: number;
  combo: number;
  hits: number;
  misses: number;
  enemyHp: number;
  index: number;
}

interface UserState {
  userId: string | null;
  nickname: string;
  setUserId: (id: string | null) => void;
  setNickname: (name: string) => void;
}

interface GameState {
  session: GameSession | null;
  setSession: (session: GameSession | null) => void;
  updateSession: (patch: Partial<GameSession>) => void;
  resetSession: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      nickname: "Player",
      setUserId: (id) => set({ userId: id }),
      setNickname: (name) => set({ nickname: name }),
    }),
    { name: "findx-user" }
  )
);

export const useGameStore = create<GameState>()((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  updateSession: (patch) =>
    set((state) => ({
      session: state.session ? { ...state.session, ...patch } : null,
    })),
  resetSession: () => set({ session: null }),
}));
