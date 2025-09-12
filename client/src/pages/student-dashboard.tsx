import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Award, Calendar, TrendingUp, PlayCircle, Clock, Bell } from "lucide-react";

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

  // Fetch enrolled courses
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['student-enrollments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          enrolled_at,
          course:courses!enrollments_course_id_fkey (
            id,
            title,
            description,
            cover_image_url,
            teacher:users!courses_teacher_id_fkey (
              name
            )
          )
        `)
        .eq('student_id', user.id)
        .order('enrolled_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data
      const transformedData = data?.map(enrollment => ({
        ...enrollment,
        course: Array.isArray(enrollment.course) ? enrollment.course[0] : enrollment.course
      })) || [];
      
      return transformedData;
    },
    enabled: isAuthenticated && user?.role === 'student' && !!user?.id,
  });

  // Fetch enrollment requests status
  const { data: enrollmentRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['student-enrollment-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('enrollment_requests')
        .select(`
          id,
          status,
          requested_at,
          course:courses!enrollment_requests_course_id_fkey (
            id,
            title
          )
        `)
        .eq('student_id', user.id)
        .order('requested_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data
      const transformedData = data?.map(request => ({
        ...request,
        course: Array.isArray(request.course) ? request.course[0] : request.course
      })) || [];
      
      return transformedData;
    },
    enabled: isAuthenticated && user?.role === 'student' && !!user?.id,
  });

  const stats = {
    enrolledCourses: enrollments?.length || 0,
    completedCourses: 0,
    certificates: 0,
    studyStreak: 1,
    pendingRequests: enrollmentRequests?.filter(req => req.status === 'pending').length || 0
  };

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
              Continue your learning journey, {user?.name}!
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
                    {enrollmentsLoading ? "..." : (stats.enrolledCourses || 0)}
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
                  <div className="text-2xl font-bold text-orange-600 flex items-center gap-2" data-testid="text-pending-requests">
                    {requestsLoading ? "..." : (stats.pendingRequests || 0)}
                    {stats.pendingRequests > 0 && (
                      <Badge variant="destructive" className="text-xs">New!</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending Requests</div>
                </div>
                <Bell className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-accent" data-testid="text-certificates">
                    {stats.certificates || 0}
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
                    {stats.studyStreak || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
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
                        {enrollment.course?.cover_image_url ? (
                          <img 
                            src={enrollment.course.cover_image_url} 
                            alt={enrollment.course?.title}
                            className="w-12 h-12 rounded object-cover mr-3"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center mr-3">
                            <BookOpen className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-foreground" data-testid={`text-course-title-${enrollment.id}`}>
                            {enrollment.course?.title || 'Course'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            by {enrollment.course?.teacher?.name || 'Unknown Teacher'}
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-foreground font-medium" data-testid={`text-progress-${enrollment.id}`}>
                            0%
                          </span>
                        </div>
                        <Progress value={0} className="h-2" />
                      </div>
                      <Link href={`/courses/${enrollment.course?.id}/learn`}>
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

          {/* Enrollment Requests Status */}
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex items-center p-4 bg-muted rounded-lg animate-pulse">
                      <div className="w-10 h-10 bg-muted-foreground/20 rounded mr-4" />
                      <div className="flex-1">
                        <div className="h-4 bg-muted-foreground/20 rounded w-32 mb-2" />
                        <div className="h-3 bg-muted-foreground/20 rounded w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : enrollmentRequests && enrollmentRequests.length > 0 ? (
                <div className="space-y-4">
                  {enrollmentRequests.slice(0, 3).map((request: any) => (
                    <div key={request.id} className="bg-muted p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-foreground">
                          {request.course?.title || 'Course'}
                        </div>
                        <Badge 
                          variant={
                            request.status === 'approved' ? 'default' : 
                            request.status === 'rejected' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Requested {new Date(request.requested_at).toLocaleDateString()}
                      </div>
                      {request.status === 'approved' && (
                        <Link href={`/courses/${request.course?.id}/learn`}>
                          <Button size="sm" className="w-full mt-2">
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Start Learning
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No requests yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Your enrollment requests will appear here.
                  </p>
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
