import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, GraduationCap, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";

const completeProfileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be less than 20 characters"),
  role: z.enum(['teacher', 'student'], {
    required_error: "Please select your role",
  }),
});

type CompleteProfileForm = z.infer<typeof completeProfileSchema>;

export default function CompleteProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CompleteProfileForm>({
    resolver: zodResolver(completeProfileSchema),
  });

  const selectedRole = watch("role");

  // Get current user session directly from Supabase
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          setUser(session.user);
        } else {
          setLocation('/signin');
        }
      } catch (error) {
        console.error('Error getting user session:', error);
        setLocation('/signin');
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
  }, [setLocation]);

  const onSubmit = async (data: CompleteProfileForm) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Create user profile in database
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name: data.username,
          role: data.role
        });

      if (error) throw error;

      // Invalidate auth cache to refresh user data
      queryClient.invalidateQueries({ queryKey: ["auth"] });

      toast({
        title: "Profile completed!",
        description: `Welcome to Learnova as a ${data.role}!`,
      });

      // Redirect based on role
      setTimeout(() => {
        if (data.role === 'teacher') {
          setLocation('/teacher-dashboard');
        } else {
          setLocation('/student-dashboard');
        }
      }, 1500);

    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Profile Update Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to complete your profile</h1>
          <Button onClick={() => setLocation('/signin')}>Go to Sign In</Button>
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
          <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
            USER REGISTRATION PROTOCOL
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase leading-tight">FINALIZE <span className="text-glow-purple text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 italic">IDENTITY.</span></h1>
          <p className="text-blue-100/40 font-medium tracking-tight uppercase text-[10px] mt-2 tracking-widest">Constructing Global Knowledge Unified Profile</p>
        </div>

        <div className="rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden shadow-2xl neon-border-blue">
          <div className="p-10 lg:p-12">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              <div className="space-y-4">
                <Label htmlFor="username" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">CHOOSE DESIGNATION</Label>
                <Input
                  id="username"
                  {...register("username")}
                  placeholder="ENTER UNIQUE ALIAS..."
                  className="h-16 bg-white/5 border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest focus-visible:ring-blue-500/20 placeholder:text-white/10"
                  data-testid="input-username"
                />
                {errors.username && (
                  <p className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-6">
                <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">SELECT SYSTEM ROLE</Label>
                <RadioGroup
                  value={selectedRole}
                  onValueChange={(value) => setValue("role", value as "teacher" | "student")}
                  className="grid grid-cols-1 gap-6"
                >
                  <div className={`flex items-center space-x-4 p-6 border-2 rounded-2xl transition-all cursor-pointer ${selectedRole === 'teacher' ? 'bg-blue-500/10 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                    <RadioGroupItem value="teacher" id="teacher" className="border-white/20 text-blue-500" />
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <Label htmlFor="teacher" className="font-black text-xs text-white uppercase tracking-widest cursor-pointer">
                          Educator
                        </Label>
                        <p className="text-[10px] font-medium text-white/40 uppercase tracking-tighter mt-1">Deploy Knowledge Streams</p>
                      </div>
                    </div>
                  </div>

                  <div className={`flex items-center space-x-4 p-6 border-2 rounded-2xl transition-all cursor-pointer ${selectedRole === 'student' ? 'bg-purple-500/10 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                    <RadioGroupItem value="student" id="student" className="border-white/20 text-purple-500" />
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <Label htmlFor="student" className="font-black text-xs text-white uppercase tracking-widest cursor-pointer">
                          Neural Initiate
                        </Label>
                        <p className="text-[10px] font-medium text-white/40 uppercase tracking-tighter mt-1">Access Universal Education</p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
                {errors.role && (
                  <p className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2">{errors.role.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="h-16 w-full rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-blue-400 hover:text-white transition-all border-none"
                disabled={isSubmitting}
                data-testid="button-complete-profile"
              >
                {isSubmitting ? "SYNCHRONIZING..." : "INITIALIZE ACCESS"}
              </Button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
