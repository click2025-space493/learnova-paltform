import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";

const signinSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type SigninForm = z.infer<typeof signinSchema>;

export default function Signin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninForm>({
    resolver: zodResolver(signinSchema),
  });

  const onSubmit = async (data: SigninForm) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual signin API call
      console.log("Signin data:", data);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock user role detection - in real app this would come from API
      const mockUserRole = data.email.includes("teacher") ? "teacher" : "student";

      toast({
        title: "Welcome back!",
        description: "Redirecting to your dashboard...",
      });

      // Redirect based on role
      setTimeout(() => {
        if (mockUserRole === "teacher") {
          setLocation("/teacher-dashboard");
        } else {
          setLocation("/student-dashboard");
        }
      }, 1500);

    } catch (error) {
      toast({
        title: "Sign In Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden flex flex-col">
      <Navigation />

      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 flex items-center justify-center px-4 py-32 relative z-10 pt-48">
        <div className="w-full max-w-xl">
          <div className="rounded-[3.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl p-10 lg:p-16 neon-border-purple relative overflow-hidden">
            {/* Glowing Accent */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-[60px] pointer-events-none" />

            <div className="text-center mb-12 relative z-10">
              <div className="w-20 h-20 bg-purple-500/20 border border-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(168,85,247,0.2)] rotate-3">
                <LogIn className="h-10 w-10 text-purple-400" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-4 uppercase">IDENTITY <span className="text-glow-purple text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">UPLINK.</span></h1>
              <p className="text-lg text-blue-100/40 font-medium tracking-tight">Accessing Neural Network / Learnova Protocols</p>
            </div>

            <div className="space-y-8 relative z-10">
              <GoogleAuthButton mode="signin" className="w-full h-16 rounded-2xl bg-white/5 border-white/10 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all" />

              <div className="relative py-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#020617] px-6 text-[10px] font-black uppercase tracking-widest text-white/20">ACCESS TERMINAL</span>
                </div>
              </div>

              <div className="space-y-6 text-center">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                  NEW ENTITY DETECTED?
                </p>
                <Link href="/role-selection">
                  <Button variant="outline" className="w-full h-16 rounded-2xl border-white/10 bg-transparent text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-500/5 hover:border-blue-500/30 transition-all" data-testid="button-get-started">
                    INITIALIZE NEW PROTOCOL →
                  </Button>
                </Link>
              </div>

              <div className="pt-10 border-t border-white/10">
                <div className="bg-white/5 rounded-3xl p-8 border border-white/10 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    DECRYPTED CREDENTIALS
                  </p>
                  <p className="text-sm text-blue-100/40 font-medium leading-relaxed tracking-tight">
                    Access <span className="text-white font-black uppercase tracking-widest text-xs">Educator HQ</span> via teacher@demo.com or <span className="text-white font-black uppercase tracking-widest text-xs">Scholars Nexus</span> via student@demo.com.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center mt-12 text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">
            © 2025 LEARNOVA NEXUS // GLOBAL CORE.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
