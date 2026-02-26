import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, CheckCircle } from "lucide-react";

const usernameSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
});

type UsernameForm = z.infer<typeof usernameSchema>;

export default function UsernameSelection() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, refetch } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<UsernameForm>({
    resolver: zodResolver(usernameSchema),
  });

  const watchedUsername = watch("username");

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (!watchedUsername || watchedUsername.length < 3) {
        setUsernameAvailable(null);
        return;
      }

      setIsCheckingUsername(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('name', watchedUsername)
          .single();

        setUsernameAvailable(!data);
      } catch (error) {
        // If no user found, username is available
        setUsernameAvailable(true);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const debounceTimer = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounceTimer);
  }, [watchedUsername]);

  // Redirect if user already has a profile
  useEffect(() => {
    if (user && user.role) {
      setLocation("/student-dashboard");
    }
  }, [user, setLocation]);

  // Generate username suggestion from email
  useEffect(() => {
    if (user?.email && !watchedUsername) {
      const emailUsername = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      setValue("username", emailUsername);
    }
  }, [user?.email, setValue, watchedUsername]);

  const onSubmit = async (data: UsernameForm) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please sign in again.",
        variant: "destructive",
      });
      return;
    }

    if (!usernameAvailable) {
      toast({
        title: "Username Not Available",
        description: "Please choose a different username.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Update user profile with username and student role
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name: data.username,
          role: 'student',
          avatar_url: user.avatar_url,
        });

      if (error) throw error;

      // Invalidate auth cache to get updated user data
      await refetch();

      toast({
        title: "Profile Created!",
        description: "Welcome to Learnova! Redirecting to your dashboard...",
      });

      setTimeout(() => {
        setLocation("/student-dashboard");
      }, 1500);

    } catch (error) {
      console.error('Profile creation error:', error);
      toast({
        title: "Profile Creation Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we set up your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden flex flex-col">
      <Navigation />

      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      <main className="flex-1 max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 pt-40 w-full">
        <div className="mb-12 text-center">
          <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
            IDENTITY AUTHORIZATION
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase leading-tight">SELECT <span className="text-glow-blue text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 italic">ALIAS.</span></h1>
          <p className="text-blue-100/40 font-medium tracking-tight uppercase text-[10px] mt-2 tracking-widest">Registering Unique Identity on Global Education Node</p>
        </div>

        <div className="rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden shadow-2xl neon-border-purple">
          <div className="p-10 lg:p-12">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4">
                <Label htmlFor="username" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">SYSTEM IDENTIFIER</Label>
                <div className="relative">
                  <Input
                    id="username"
                    {...register("username")}
                    placeholder="ENTER DESIGNATION..."
                    className={`h-16 bg-white/5 border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest focus-visible:ring-blue-500/20 placeholder:text-white/10 pr-12 transition-all ${usernameAvailable === true ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' :
                      usernameAvailable === false ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : ''
                      }`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                    {isCheckingUsername ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/10 border-t-white" />
                    ) : usernameAvailable === true ? (
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    ) : usernameAvailable === false ? (
                      <div className="h-5 w-5 text-red-500 font-bold flex items-center justify-center text-sm">✕</div>
                    ) : null}
                  </div>
                </div>
                {errors.username ? (
                  <p className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2">{errors.username.message}</p>
                ) : usernameAvailable === false ? (
                  <p className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2">DESIGNATION ALREADY ALLOCATED</p>
                ) : usernameAvailable === true ? (
                  <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest ml-2">DESIGNATION AVAILABLE</p>
                ) : null}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">SYNTAX GUIDELINES</h4>
                <ul className="space-y-2">
                  {['3-20 CHARACTERS', 'ALPHANUMERIC ONLY', 'UNIQUE NEURAL HASH'].map((rule) => (
                    <li key={rule} className="flex items-center gap-3">
                      <div className="w-1 h-1 bg-blue-500 rounded-full" />
                      <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                type="submit"
                className="h-16 w-full rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-purple-500 hover:text-white transition-all border-none"
                disabled={isLoading || !usernameAvailable || isCheckingUsername}
              >
                {isLoading ? "AUTHORIZING..." : "INITIALIZE DASHBOARD"}
              </Button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
