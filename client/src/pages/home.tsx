import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, Users, TrendingUp, Clock, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const { user } = useAuth();

  // Fetch published courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["published-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          users!courses_teacher_id_fkey(name),
          chapters(
            id,
            lessons(id, video_duration)
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome back, {user?.name || 'there'}! 👋
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

        {/* Published Courses Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">Latest Courses</h2>
            <Link href="/courses">
              <Button variant="outline">View All Courses</Button>
            </Link>
          </div>

          {coursesLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course: any) => {
                const totalLessons = course.chapters?.reduce((total: number, chapter: any) => 
                  total + (chapter.lessons?.length || 0), 0) || 0;
                const totalDuration = course.chapters?.reduce((total: number, chapter: any) => 
                  total + (chapter.lessons?.reduce((chapterTotal: number, lesson: any) => 
                    chapterTotal + (lesson.video_duration || 0), 0) || 0), 0) || 0;
                
                const formatDuration = (seconds: number) => {
                  const hours = Math.floor(seconds / 3600);
                  const minutes = Math.floor((seconds % 3600) / 60);
                  if (hours > 0) return `${hours}h ${minutes}m`;
                  return `${minutes}m`;
                };

                return (
                  <Link key={course.id} href={`/courses/${course.id}`}>
                    <Card className="card-hover cursor-pointer h-full">
                      <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-white" />
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg line-clamp-2">{course.title}</h3>
                          <Badge variant="secondary">{course.category}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {course.description}
                        </p>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {course.users?.name || 'Teacher'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDuration(totalDuration)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {totalLessons} lessons
                          </span>
                          <span className="font-bold text-lg text-primary">
                            ${course.price}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">No courses available yet</h3>
              <p className="text-muted-foreground">Be the first to create and publish a course!</p>
            </div>
          )}
        </div>

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
