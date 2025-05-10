import { User } from "./User";

export interface UserState {
    user: User | null;
    setUser: (data: Partial<User>) => void;
    updateUser: (fields: Partial<User>) => void;
    clearUser: () => void;
}