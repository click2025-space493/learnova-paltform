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

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && user?.role === 'admin',
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
          {/* Pending Approvals */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mock pending approval */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback data-testid="text-teacher-initials-1">DW</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-foreground" data-testid="text-teacher-name-1">
                        David Wilson
                      </div>
                      <div className="text-xs text-muted-foreground" data-testid="text-course-name-1">
                        Data Science Course
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50 hover:border-green-200" data-testid="button-approve-1">
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:bg-red-50 hover:border-red-200" data-testid="button-reject-1">
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback data-testid="text-teacher-initials-2">SM</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-foreground" data-testid="text-teacher-name-2">
                        Sarah Martinez
                      </div>
                      <div className="text-xs text-muted-foreground" data-testid="text-course-name-2">
                        Photography Basics
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50 hover:border-green-200" data-testid="button-approve-2">
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:bg-red-50 hover:border-red-200" data-testid="button-reject-2">
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    All caught up! No pending approvals.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-muted rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground" data-testid="text-activity-title-1">
                      15 new user registrations
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid="text-activity-time-1">
                      Last 24 hours
                    </div>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-muted rounded-lg">
                  <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center mr-3">
                    <BookOpen className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground" data-testid="text-activity-title-2">
                      3 new courses published
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid="text-activity-time-2">
                      Last 48 hours
                    </div>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-muted rounded-lg">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mr-3">
                    <DollarSign className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground" data-testid="text-activity-title-3">
                      $2,340 in course purchases
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid="text-activity-time-3">
                      This week
                    </div>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-muted rounded-lg">
                  <div className="w-10 h-10 bg-green-600/10 rounded-full flex items-center justify-center mr-3">
                    <UserCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground" data-testid="text-activity-title-4">
                      2 teacher applications approved
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid="text-activity-time-4">
                      Yesterday
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
