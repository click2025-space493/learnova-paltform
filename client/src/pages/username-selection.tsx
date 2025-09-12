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
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-secondary" />
            </div>
            <CardTitle className="text-2xl">Choose Your Username</CardTitle>
            <p className="text-muted-foreground">
              This will be your unique identifier on Learnova
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    {...register("username")}
                    placeholder="Enter your username"
                    className={`pr-10 ${
                      usernameAvailable === true ? 'border-green-500' : 
                      usernameAvailable === false ? 'border-red-500' : ''
                    }`}
                  />
                  {isCheckingUsername && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                  {!isCheckingUsername && usernameAvailable === true && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {!isCheckingUsername && usernameAvailable === false && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500">
                      ✕
                    </div>
                  )}
                </div>
                {errors.username && (
                  <p className="text-sm text-destructive mt-1">{errors.username.message}</p>
                )}
                {!errors.username && usernameAvailable === false && (
                  <p className="text-sm text-destructive mt-1">This username is already taken</p>
                )}
                {!errors.username && usernameAvailable === true && (
                  <p className="text-sm text-green-600 mt-1">Username is available!</p>
                )}
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Username Guidelines:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 3-20 characters long</li>
                  <li>• Letters, numbers, and underscores only</li>
                  <li>• Must be unique</li>
                </ul>
              </div>

              <Button
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={isLoading || !usernameAvailable || isCheckingUsername}
              >
                {isLoading ? "Creating Profile..." : "Continue to Dashboard"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
