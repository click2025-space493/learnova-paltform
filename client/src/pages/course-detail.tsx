import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlayCircle, Clock, Users, Star, Download, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function CourseDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading, error } = useQuery({
    queryKey: ["/api/courses", id],
    enabled: !!id,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/courses/${id}/enroll`);
    },
    onSuccess: () => {
      toast({
        title: "Successfully enrolled!",
        description: "You can now access the course content.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/student/enrollments"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Enrollment failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  if (error) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Course Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The course you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/courses">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-6" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-64 bg-muted rounded-lg mb-6" />
                <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                <div className="h-32 bg-muted rounded mb-6" />
              </div>
              <div>
                <div className="bg-card border rounded-lg p-6">
                  <div className="h-48 bg-muted rounded mb-4" />
                  <div className="h-12 bg-muted rounded" />
                </div>
              </div>
            </div>
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
        <div className="mb-6">
          <Link href="/courses">
            <Button variant="ghost" size="sm" data-testid="button-back-courses">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course Content */}
          <div className="lg:col-span-2">
            {course?.coverImageUrl && (
              <img
                src={course.coverImageUrl}
                alt={course.title}
                className="w-full h-64 object-cover rounded-lg mb-6"
                data-testid="img-course-cover"
              />
            )}

            <div className="flex items-center gap-2 mb-4">
              {course?.category && (
                <Badge variant="secondary" data-testid="badge-category">
                  {course.category}
                </Badge>
              )}
              <div className="flex items-center text-yellow-500">
                <Star className="h-4 w-4 mr-1" />
                <span className="text-sm">4.8</span>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-4" data-testid="text-course-title">
              {course?.title}
            </h1>

            <p className="text-lg text-muted-foreground mb-6" data-testid="text-course-description">
              {course?.description}
            </p>

            {/* Course Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="flex items-center text-sm text-muted-foreground">
                <PlayCircle className="h-4 w-4 mr-2" />
                <span data-testid="text-lesson-count">
                  {course?.lessons?.length || 0} lessons
                </span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                <span data-testid="text-course-duration">
                  {Math.ceil((course?.lessons?.reduce((acc: number, lesson: any) => acc + (lesson.duration || 0), 0) || 0) / 60)} hours
                </span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-2" />
                <span data-testid="text-student-count">256 students</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Download className="h-4 w-4 mr-2" />
                <span data-testid="text-resource-count">
                  {course?.resources?.length || 0} resources
                </span>
              </div>
            </div>

            {/* Course Lessons */}
            {course?.lessons && course.lessons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Course Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.lessons.map((lesson: any, index: number) => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground" data-testid={`text-lesson-title-${index}`}>
                            {lesson.title}
                          </h4>
                          {lesson.description && (
                            <p className="text-sm text-muted-foreground" data-testid={`text-lesson-description-${index}`}>
                              {lesson.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        <span data-testid={`text-lesson-duration-${index}`}>
                          {lesson.duration || 0} min
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <Card className="sticky top-8">
              <CardContent className="p-6">
                {course?.coverImageUrl && (
                  <img
                    src={course.coverImageUrl}
                    alt={course.title}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                )}
                
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-primary mb-2" data-testid="text-course-price">
                    ${course?.price || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">One-time payment</p>
                </div>

                {isAuthenticated && user?.role === 'student' ? (
                  <Button
                    className="w-full mb-4"
                    onClick={() => enrollMutation.mutate()}
                    disabled={enrollMutation.isPending}
                    data-testid="button-enroll-course"
                  >
                    {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                  </Button>
                ) : !isAuthenticated ? (
                  <Button
                    className="w-full mb-4"
                    onClick={() => window.location.href = "/api/login"}
                    data-testid="button-login-enroll"
                  >
                    Login to Enroll
                  </Button>
                ) : (
                  <Button className="w-full mb-4" disabled data-testid="button-enroll-disabled">
                    {user?.role === 'teacher' ? 'Teachers cannot enroll' : 'Enrollment unavailable'}
                  </Button>
                )}

                <Separator className="mb-4" />

                {/* Instructor Info */}
                <div className="flex items-center mb-4">
                  <Avatar className="h-12 w-12 mr-3">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback data-testid="text-instructor-initials">
                      {course?.teacher?.firstName?.[0] || 'T'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-foreground" data-testid="text-instructor-name">
                      {course?.teacher?.firstName} {course?.teacher?.lastName}
                    </h4>
                    <p className="text-sm text-muted-foreground">Course Instructor</p>
                  </div>
                </div>

                {/* Course Features */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    <span>Lifetime access</span>
                  </div>
                  <div className="flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    <span>Downloadable resources</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Community access</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
