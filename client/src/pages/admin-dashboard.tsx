import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, BookOpen, DollarSign, UserCheck, Settings, CheckCircle, XCircle } from "lucide-react";
import type { AdminStats } from "@/types/api";

export default function AdminDashboard() {
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

    if (!isLoading && user?.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Only admins can access this dashboard.",
        variant: "destructive",
      });
      setLocation("/");
      return;
    }
  }, [isAuthenticated, isLoading, user, toast, setLocation]);

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch recent teachers for quick overview
  const { data: recentTeachers } = useQuery({
    queryKey: ["/api/admin/teachers"],
    enabled: isAuthenticated && user?.role === 'admin',
    select: (data: any[]) => data?.slice(0, 5) || [], // Get first 5 teachers
  });

  // Fetch recent courses for quick overview
  const { data: recentCourses } = useQuery({
    queryKey: ["/api/admin/courses"],
    enabled: isAuthenticated && user?.role === 'admin',
    select: (data: any[]) => data?.slice(0, 3) || [], // Get first 3 courses
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
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Platform overview and management tools
            </p>
          </div>
          <Button variant="outline" data-testid="button-system-settings">
            <Settings className="h-4 w-4 mr-2" />
            System Settings
          </Button>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/admin/teachers")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Teachers Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage all teachers and their activities
                  </p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/admin/courses")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Courses Overview</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor courses and student enrollments
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/admin/videos")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Video Management</h3>
                  <p className="text-sm text-muted-foreground">
                    View and manage all platform videos
                  </p>
                </div>
                <div className="h-8 w-8 bg-accent/20 rounded flex items-center justify-center">
                  <div className="h-4 w-4 bg-accent rounded-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/admin/subscription-requests")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Subscription Requests</h3>
                  <p className="text-sm text-muted-foreground">
                    Review teacher subscription requests
                  </p>
                </div>
                <div className="h-8 w-8 bg-yellow-100 rounded flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-primary" data-testid="text-total-users">
                    {statsLoading ? "..." : (stats?.totalUsers || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                  <div className="text-xs text-green-600 mt-1">+12% this month</div>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-secondary" data-testid="text-total-courses">
                    {statsLoading ? "..." : (stats?.totalCourses || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Courses</div>
                  <div className="text-xs text-green-600 mt-1">+8% this month</div>
                </div>
                <BookOpen className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-accent" data-testid="text-total-revenue">
                    ${statsLoading ? "..." : (stats?.totalRevenue || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                  <div className="text-xs text-green-600 mt-1">+15% this month</div>
                </div>
                <DollarSign className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600" data-testid="text-active-teachers">
                    {statsLoading ? "..." : (stats?.activeTeachers || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Teachers</div>
                  <div className="text-xs text-green-600 mt-1">+5% this month</div>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Teachers */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTeachers && recentTeachers.length > 0 ? (
                  recentTeachers.map((teacher: any) => (
                    <div key={teacher.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={teacher.profileImageUrl} />
                          <AvatarFallback>
                            {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {teacher.name || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.email}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {teacher.email}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {teacher.role}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      No teachers found.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Courses */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCourses && recentCourses.length > 0 ? (
                  recentCourses.map((course: any) => (
                    <div key={course.id} className="flex items-center p-3 bg-muted rounded-lg">
                      <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center mr-3">
                        <BookOpen className="h-5 w-5 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">
                          {course.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          by {course.teacherName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {course.enrollmentCount} students • {course.lessonCount} lessons
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                          {course.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          ${course.price}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      No courses found.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
