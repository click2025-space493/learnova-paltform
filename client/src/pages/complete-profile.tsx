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
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <p className="text-muted-foreground">
              Welcome! Let's set up your account.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="username">Choose a Username</Label>
                <Input
                  id="username"
                  {...register("username")}
                  placeholder="Enter your username"
                  data-testid="input-username"
                />
                {errors.username && (
                  <p className="text-sm text-destructive mt-1">{errors.username.message}</p>
                )}
              </div>

              <div>
                <Label className="text-base font-medium">I am a...</Label>
                <RadioGroup
                  value={selectedRole}
                  onValueChange={(value) => setValue("role", value as "teacher" | "student")}
                  className="mt-3"
                >
                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="teacher" id="teacher" />
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <Label htmlFor="teacher" className="font-medium cursor-pointer">
                          Teacher
                        </Label>
                        <p className="text-sm text-gray-500">Create and share courses</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="student" id="student" />
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <Label htmlFor="student" className="font-medium cursor-pointer">
                          Student
                        </Label>
                        <p className="text-sm text-gray-500">Learn from amazing courses</p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
                {errors.role && (
                  <p className="text-sm text-destructive mt-1">{errors.role.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                data-testid="button-complete-profile"
              >
                {isSubmitting ? "Setting up your account..." : "Complete Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
