import { User } from "./User";

export interface UserState {
    user: User | null;
    setUser: (user: User) => void;
    updateUser: (fields: Partial<User>) => void;
    clearUser: () => void;
}