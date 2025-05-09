import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserState } from '../types/UserState';

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            user: null,
            setUser: (user) => set({ user }),
            updateUser: (fields) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...fields } : null,
                })),
            clearUser: () => set({ user: null }),
        }),
        {
            name: 'user-store',
        }
    )
);
