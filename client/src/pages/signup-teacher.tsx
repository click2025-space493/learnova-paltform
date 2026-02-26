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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, ArrowLeft } from "lucide-react";

const teacherSignupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type TeacherSignupForm = z.infer<typeof teacherSignupSchema>;

export default function SignupTeacher() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TeacherSignupForm>({
    resolver: zodResolver(teacherSignupSchema),
  });

  const agreeToTerms = watch("agreeToTerms");

  const onSubmit = async (data: TeacherSignupForm) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual signup API call
      console.log("Teacher signup data:", data);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Account Created!",
        description: "Welcome to Learnova! Redirecting to your dashboard...",
      });

      // Redirect to teacher dashboard
      setTimeout(() => {
        setLocation("/teacher-dashboard");
      }, 1500);

    } catch (error) {
      toast({
        title: "Signup Failed",
        description: "Something went wrong. Please try again.",
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
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-32 relative z-10 pt-48">
        <div className="w-full max-w-xl">
          <div className="mb-10">
            <Link href="/role-selection">
              <Button variant="ghost" className="group text-white/20 hover:text-purple-400 font-black text-[10px] uppercase tracking-[0.3em] transition-all p-0 h-auto hover:bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-3 group-hover:-translate-x-2 transition-transform" />
                REVERT PATHWAY
              </Button>
            </Link>
          </div>

          <div className="rounded-[3.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl p-10 lg:p-16 neon-border-purple relative overflow-hidden">
            {/* Glowing Accent */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-[60px] pointer-events-none" />

            <div className="text-center mb-12 relative z-10">
              <div className="w-20 h-20 bg-purple-500/20 border border-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(168,85,247,0.2)] rotate-3">
                <GraduationCap className="h-10 w-10 text-purple-400" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-4 uppercase">EDUCATOR <span className="text-glow-purple text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">INDEX.</span></h1>
              <p className="text-lg text-blue-100/40 font-medium tracking-tight">Initiating Faculty Neural Network Access</p>
            </div>

            <div className="space-y-8 relative z-10">
              <GoogleAuthButton mode="signup" className="w-full h-16 rounded-2xl bg-white/5 border-white/10 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all" />

              <div className="relative py-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#020617] px-6 text-[10px] font-black uppercase tracking-widest text-white/20">FACULTY TERMINAL</span>
                </div>
              </div>

              <div className="space-y-6 text-center">
                <p className="text-[10px] font-black text-blue-100/40 uppercase tracking-[0.2em] leading-relaxed">
                  By joining, you authorize serving the <span className="text-white font-black">Learnnova Nexus Protocols</span> and the <span className="text-purple-400 font-black">Educator Distinction Code</span>.
                </p>

                <div className="pt-10 border-t border-white/10">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-6">
                    ALREADY REGISTERED?
                  </p>
                  <Link href="/signin">
                    <Button variant="outline" className="w-full h-16 rounded-2xl border-white/10 bg-transparent text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-purple-500/5 hover:border-purple-500/30 transition-all">
                      ACCESS PORTAL // SIGN IN →
                    </Button>
                  </Link>
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
