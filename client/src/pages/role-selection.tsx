import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Users, TrendingUp } from "lucide-react";

export default function RoleSelection() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Role
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select how you'd like to use Learnova. You can always change this later.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Teacher Card */}
          <Card className="relative overflow-hidden border-2 hover:border-primary transition-colors cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">I'm a Teacher</CardTitle>
              <p className="text-muted-foreground">
                Share your knowledge and create courses
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-sm">Create and manage courses</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm">Track student progress</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="text-sm">Earn from your expertise</span>
                </div>
              </div>
              <Link href="/signup/teacher">
                <Button className="w-full mt-6" data-testid="button-teacher-signup">
                  Sign Up as Teacher
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Student Card */}
          <Card className="relative overflow-hidden border-2 hover:border-secondary transition-colors cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="text-2xl">I'm a Student</CardTitle>
              <p className="text-muted-foreground">
                Learn new skills and advance your career
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-secondary" />
                  <span className="text-sm">Access thousands of courses</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                  <span className="text-sm">Track your learning progress</span>
                </div>
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-secondary" />
                  <span className="text-sm">Earn certificates</span>
                </div>
              </div>
              <Link href="/signup/student">
                <Button variant="secondary" className="w-full mt-6" data-testid="button-student-signup">
                  Sign Up as Student
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Already have an account?
          </p>
          <Link href="/signin">
            <Button variant="outline" data-testid="button-signin">
              Sign In
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
