import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, Users, TrendingUp } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome back, {user?.firstName || 'there'}! 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            Continue your learning journey with Learnova
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link href="/courses" data-testid="link-browse-courses">
            <Card className="card-hover cursor-pointer">
              <CardHeader className="pb-2">
                <BookOpen className="h-8 w-8 text-primary" />
                <CardTitle className="text-lg">Browse Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Discover new courses to expand your knowledge
                </p>
              </CardContent>
            </Card>
          </Link>

          {user?.role === 'teacher' && (
            <Link href="/create-course" data-testid="link-create-course">
              <Card className="card-hover cursor-pointer">
                <CardHeader className="pb-2">
                  <GraduationCap className="h-8 w-8 text-secondary" />
                  <CardTitle className="text-lg">Create Course</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Share your knowledge with students worldwide
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}

          {user?.role === 'student' && (
            <Link href="/student-dashboard" data-testid="link-student-dashboard">
              <Card className="card-hover cursor-pointer">
                <CardHeader className="pb-2">
                  <TrendingUp className="h-8 w-8 text-accent" />
                  <CardTitle className="text-lg">My Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Track your learning progress and achievements
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}

          {user?.role === 'teacher' && (
            <Link href="/teacher-dashboard" data-testid="link-teacher-dashboard">
              <Card className="card-hover cursor-pointer">
                <CardHeader className="pb-2">
                  <Users className="h-8 w-8 text-accent" />
                  <CardTitle className="text-lg">My Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Manage your courses and student progress
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link href="/admin-dashboard" data-testid="link-admin-dashboard">
              <Card className="card-hover cursor-pointer">
                <CardHeader className="pb-2">
                  <TrendingUp className="h-8 w-8 text-destructive" />
                  <CardTitle className="text-lg">Admin Panel</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Manage platform users and settings
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {/* Role-specific content */}
        {user?.role === 'student' && (
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Ready to continue learning?
            </h2>
            <Link href="/courses">
              <Button size="lg" data-testid="button-explore-courses">
                Explore Courses
              </Button>
            </Link>
          </div>
        )}

        {user?.role === 'teacher' && (
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Ready to create your next course?
            </h2>
            <Link href="/create-course">
              <Button size="lg" data-testid="button-create-new-course">
                Create New Course
              </Button>
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
