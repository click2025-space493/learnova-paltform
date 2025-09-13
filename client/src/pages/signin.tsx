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
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <p className="text-muted-foreground">
              Sign in to your Learnova account
            </p>
          </CardHeader>
          <CardContent>
            <GoogleAuthButton mode="signin" className="w-full" />

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Don't have an account?
              </p>
              <Link href="/role-selection">
                <Button variant="outline" className="w-full" data-testid="button-get-started">
                  Get Started
                </Button>
              </Link>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Demo: Use "teacher@demo.com" for teacher dashboard or "student@demo.com" for student dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
