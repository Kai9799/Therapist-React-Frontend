import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserState } from '../types/UserState';
import { User } from '../types/User';

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            user: null,
            setUser: (data: Partial<User>) =>
                set((state: any) => ({
                    user: { ...state.user, ...data },
                })),
            updateUser: (fields: Partial<User>) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...fields } : null,
                })),
            clearUser: () => set({ user: null }),
        }),
        {
            name: 'zustand-user-store',
        }
    )
);
