import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'student';
  avatar_url?: string;
  bio?: string;
}

export function useAuth() {
  const query = useQuery({
    queryKey: ["auth"],
    queryFn: async (): Promise<AuthUser | null> => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      if (!user) return null;
      
      // Get user profile with role from users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        // If profile doesn't exist, create one
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || user.email!.split('@')[0],
            role: 'student' // default role
          })
          .select()
          .single();
        
        if (createError) throw createError;
        return newProfile as AuthUser;
      }
      
      return profile as AuthUser;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    ...query,
    user: query.data,
    isAuthenticated: !!query.data && !query.isLoading,
    isLoading: query.isLoading
  };
}
