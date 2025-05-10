import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SubscriptionState {
    isSubscribed: boolean;
    isOnTrial: boolean;
    subscriptionStatus: string | null;
    trialEndsAt?: string;
    setSubscriptionData: (data: Partial<SubscriptionState>) => void;
    clearSubscription: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
    persist(
        (set) => ({
            isSubscribed: false,
            isOnTrial: false,
            subscriptionStatus: null,
            trialEndsAt: undefined,
            setSubscriptionData: (data) => set(data),
            clearSubscription: () => set({
                isSubscribed: false,
                isOnTrial: false,
                subscriptionStatus: null,
                trialEndsAt: undefined,
            }),
        }),
        {
            name: 'subscription-store',
        }
    )
);
