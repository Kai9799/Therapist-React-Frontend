export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username?: string;
    clerkId: string;
    supabaseToken: string;
    organizationId?: string;
    organizationName?: string;
}