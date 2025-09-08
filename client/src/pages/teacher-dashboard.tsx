import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, DollarSign, TrendingUp, Plus, Eye, Edit, MoreHorizontal } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { CourseWithRelations, TeacherStats } from "@/types/api";

export default function TeacherDashboard() {
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

    if (!isLoading && user?.role !== 'teacher' && user?.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Only teachers can access this dashboard.",
        variant: "destructive",
      });
      setLocation("/");
      return;
    }
  }, [isAuthenticated, isLoading, user, toast, setLocation]);

  const { data: courses, isLoading: coursesLoading } = useQuery<CourseWithRelations[]>({
    queryKey: ["/api/teacher/courses"],
    enabled: isAuthenticated && (user?.role === 'teacher' || user?.role === 'admin'),
  });

  const { data: stats, isLoading: statsLoading } = useQuery<TeacherStats>({
    queryKey: ["/api/teacher/stats"],
    enabled: isAuthenticated && (user?.role === 'teacher' || user?.role === 'admin'),
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
            <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.firstName}! Here's your teaching overview.
            </p>
          </div>
          <Link href="/create-course">
            <Button data-testid="button-create-new-course">
              <Plus className="h-4 w-4 mr-2" />
              Create New Course
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-primary" data-testid="text-total-students">
                    {statsLoading ? "..." : (stats?.totalStudents || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Students</div>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-secondary" data-testid="text-active-courses">
                    {statsLoading ? "..." : (stats?.totalCourses || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Courses</div>
                </div>
                <BookOpen className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-accent" data-testid="text-monthly-revenue">
                    ${statsLoading ? "..." : (stats?.monthlyRevenue || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Monthly Revenue</div>
                </div>
                <DollarSign className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600" data-testid="text-completion-rate">
                    {statsLoading ? "..." : (stats?.completionRate || 0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Completion Rate</div>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>My Courses</span>
              <Link href="/create-course">
                <Button size="sm" variant="outline" data-testid="button-add-course">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coursesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center p-4 bg-muted rounded-lg animate-pulse">
                    <div className="w-16 h-16 bg-muted-foreground/20 rounded mr-4" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted-foreground/20 rounded w-64 mb-2" />
                      <div className="h-3 bg-muted-foreground/20 rounded w-32" />
                    </div>
                    <div className="h-8 bg-muted-foreground/20 rounded w-20" />
                  </div>
                ))}
              </div>
            ) : courses && courses.length > 0 ? (
              <div className="space-y-4">
                {courses.map((course: any) => (
                  <div key={course.id} className="flex items-center p-4 bg-muted rounded-lg">
                    {course.coverImageUrl ? (
                      <img
                        src={course.coverImageUrl}
                        alt={course.title}
                        className="w-16 h-16 object-cover rounded mr-4"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-primary/10 rounded flex items-center justify-center mr-4">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground mb-1" data-testid={`text-course-title-${course.id}`}>
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={course.status === 'published' ? 'default' : 'secondary'} data-testid={`badge-status-${course.id}`}>
                          {course.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground" data-testid={`text-course-category-${course.id}`}>
                          {course.category}
                        </span>
                        <span className="text-sm text-muted-foreground" data-testid={`text-course-price-${course.id}`}>
                          ${course.price}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/courses/${course.id}`}>
                        <Button size="sm" variant="outline" data-testid={`button-view-${course.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline" data-testid={`button-edit-${course.id}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No courses yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first course to start sharing your knowledge.
                </p>
                <Link href="/create-course">
                  <Button data-testid="button-create-first-course">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Course
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
