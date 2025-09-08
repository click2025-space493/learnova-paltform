import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Award, Calendar, TrendingUp, PlayCircle, Clock } from "lucide-react";
import type { EnrollmentWithCourse, StudentStats } from "@/types/api";

export default function StudentDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }

    if (!isLoading && user?.role !== 'student') {
      toast({
        title: "Access Denied",
        description: "Only students can access this dashboard.",
        variant: "destructive",
      });
      setLocation("/");
      return;
    }
  }, [isAuthenticated, isLoading, user, toast, setLocation]);

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery<EnrollmentWithCourse[]>({
    queryKey: ["/api/student/enrollments"],
    enabled: isAuthenticated && user?.role === 'student',
  });

  const { data: stats, isLoading: statsLoading } = useQuery<StudentStats>({
    queryKey: ["/api/student/stats"],
    enabled: isAuthenticated && user?.role === 'student',
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-8" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-lg" />
              ))}
            </div>
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
            <p className="text-muted-foreground">
              Continue your learning journey, {user?.firstName}!
            </p>
          </div>
          <Link href="/courses">
            <Button data-testid="button-browse-courses">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Courses
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-secondary" data-testid="text-enrolled-courses">
                    {statsLoading ? "..." : (stats?.enrolledCourses || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Enrolled Courses</div>
                </div>
                <BookOpen className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-primary" data-testid="text-completed-courses">
                    {statsLoading ? "..." : (stats?.completedCourses || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-accent" data-testid="text-certificates">
                    {statsLoading ? "..." : (stats?.certificates || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Certificates</div>
                </div>
                <Award className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600" data-testid="text-study-streak">
                    {statsLoading ? "..." : (stats?.studyStreak || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Continue Learning */}
          <Card>
            <CardHeader>
              <CardTitle>Continue Learning</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollmentsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex items-center p-4 bg-muted rounded-lg animate-pulse">
                      <div className="w-12 h-12 bg-muted-foreground/20 rounded mr-4" />
                      <div className="flex-1">
                        <div className="h-4 bg-muted-foreground/20 rounded w-48 mb-2" />
                        <div className="h-3 bg-muted-foreground/20 rounded w-32 mb-2" />
                        <div className="h-2 bg-muted-foreground/20 rounded w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : enrollments && enrollments.length > 0 ? (
                <div className="space-y-4">
                  {enrollments.slice(0, 3).map((enrollment: any) => (
                    <div key={enrollment.id} className="bg-muted p-4 rounded-lg">
                      <div className="flex items-center mb-3">
                        <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center mr-3">
                          <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground" data-testid={`text-course-title-${enrollment.id}`}>
                            Course #{enrollment.courseId}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Enrolled course
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-foreground font-medium" data-testid={`text-progress-${enrollment.id}`}>
                            {enrollment.progress || 0}%
                          </span>
                        </div>
                        <Progress value={enrollment.progress || 0} className="h-2" />
                      </div>
                      <Link href={`/courses/${enrollment.courseId}`}>
                        <Button size="sm" className="w-full" data-testid={`button-continue-${enrollment.id}`}>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Continue Learning
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No enrollments yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Browse our courses to start your learning journey.
                  </p>
                  <Link href="/courses">
                    <Button data-testid="button-start-learning">
                      Start Learning
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-muted rounded-lg">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mr-3">
                    <Award className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground" data-testid="text-achievement-title">
                      Course completion milestone
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid="text-achievement-date">
                      Complete your first course to earn this achievement
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-muted rounded-lg">
                  <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center mr-3">
                    <Calendar className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground" data-testid="text-streak-achievement">
                      {stats?.studyStreak || 0}-day learning streak!
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid="text-streak-date">
                      Keep the momentum going
                    </div>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-muted rounded-lg opacity-50">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground" data-testid="text-future-achievement">
                      Future achievement
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid="text-future-description">
                      Complete more courses to unlock
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
