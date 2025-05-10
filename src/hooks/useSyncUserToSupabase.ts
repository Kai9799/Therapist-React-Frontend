import { createClerkSupabaseClient } from "../lib/supabase";

export const useSyncUserToSupabase = () => {
    return async ({
        clerkId,
        firstName,
        lastName,
        email,
        username,
    }: {
        clerkId: string;
        firstName: string;
        lastName: string;
        email: string;
        username: string;
    }) => {
        const supabaseClient = await createClerkSupabaseClient();

        const { error, data } = await supabaseClient
            .from('users')
            .insert([
                {
                    clerk_id: clerkId,
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    username,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Error inserting user into Supabase:', error);
            throw new Error('Failed to sync user to Supabase');
        }

        return data;
    };
};