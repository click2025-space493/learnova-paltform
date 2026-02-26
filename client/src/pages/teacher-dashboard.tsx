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
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, DollarSign, TrendingUp, Plus, Eye, Edit, MoreHorizontal, Bell } from "lucide-react";
import EnrollmentRequests from "@/components/enrollment-requests";

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

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['teacher-courses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          category,
          price,
          cover_image_url,
          is_published,
          created_at,
          updated_at
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated && !!user?.id && (user?.role === 'teacher' || user?.role === 'admin'),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['teacher-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { totalStudents: 0, totalCourses: 0, monthlyRevenue: 0, completionRate: 0, pendingRequests: 0 };

      // Get total courses
      const { count: totalCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user.id);

      // Get total students (enrolled in teacher's courses)
      // First get course IDs for this teacher
      const { data: teacherCourses } = await supabase
        .from('courses')
        .select('id')
        .eq('teacher_id', user.id);

      const courseIds = teacherCourses?.map(course => course.id) || [];

      const { count: totalStudents } = await supabase
        .from('enrollments')
        .select('student_id', { count: 'exact', head: true })
        .in('course_id', courseIds);

      // Get pending enrollment requests count
      const { count: pendingRequests } = await supabase
        .from('enrollment_requests')
        .select('*', { count: 'exact', head: true })
        .in('course_id', courseIds)
        .eq('status', 'pending');

      return {
        totalStudents: totalStudents || 0,
        totalCourses: totalCourses || 0,
        monthlyRevenue: 0, // TODO: Calculate from enrollments
        completionRate: 85, // TODO: Calculate from lesson progress
        pendingRequests: pendingRequests || 0
      };
    },
    enabled: isAuthenticated && !!user?.id && (user?.role === 'teacher' || user?.role === 'admin'),
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
    <div className="min-h-screen bg-[#020617] relative overflow-hidden flex flex-col">
      <Navigation />

      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 w-full pt-32">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div className="max-w-2xl">
            <Badge className="mb-6 bg-purple-500/10 text-purple-400 border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
              INSTITUTIONAL NEXUS // ONLINE
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter mb-6">EDUCATOR <span className="text-glow-purple text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">HQ.</span></h1>
            <p className="text-xl text-blue-100/40 font-medium leading-relaxed">
              Welcome back, Commander <span className="text-purple-400 font-black uppercase tracking-widest">{user?.name}</span>. Your teaching impact today:
            </p>
          </div>
          <Link href="/create-course">
            <Button size="lg" className="h-16 px-10 rounded-2xl bg-white text-black font-black hover:bg-purple-400 hover:text-white transition-all shadow-2xl shadow-purple-500/20 border-none group" data-testid="button-create-new-course">
              <Plus className="h-6 w-6 mr-3 group-hover:rotate-90 transition-transform" />
              LAUNCH NEW STREAM
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl neon-border-purple group hover:bg-white/10 transition-all cursor-default">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <div className="text-[10px] font-black text-purple-400/40 uppercase tracking-widest">IMPACT</div>
            </div>
            <div className="text-4xl font-black text-white tracking-tighter" data-testid="text-total-students">
              {statsLoading ? "..." : (stats?.totalStudents || 0)}
            </div>
            <span className="text-[9px] font-black text-green-400 uppercase tracking-widest mt-2 block">ACTIVE NODES</span>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl neon-border-blue group hover:bg-white/10 transition-all cursor-default text-blue-400">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <BookOpen className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-[10px] font-black text-blue-400/40 uppercase tracking-widest">STREAMS</div>
            </div>
            <div className="text-4xl font-black text-white tracking-tighter" data-testid="text-active-courses">
              {statsLoading ? "..." : (stats?.totalCourses || 0)}
            </div>
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-2 block">CURRICULUM ARCHIVE</span>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl neon-border-purple group hover:bg-white/10 transition-all cursor-default text-purple-400">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <DollarSign className="h-6 w-6 text-purple-400" />
              </div>
              <div className="text-[10px] font-black text-purple-400/40 uppercase tracking-widest">REVENUE</div>
            </div>
            <div className="text-4xl font-black text-white tracking-tighter" data-testid="text-monthly-revenue">
              ${statsLoading ? "..." : (stats?.monthlyRevenue || 0)}
            </div>
            <span className="text-[9px] font-black text-green-400 uppercase tracking-widest mt-2 block">+8% CYC GAIN</span>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl neon-border-blue group hover:bg-white/10 transition-all cursor-default text-blue-400">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <Bell className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-[10px] font-black text-blue-400/40 uppercase tracking-widest">ALERTS</div>
            </div>
            <div className="text-4xl font-black text-white tracking-tighter flex items-center gap-3" data-testid="text-pending-requests">
              {statsLoading ? "..." : (stats?.pendingRequests || 0)}
              {(stats?.pendingRequests || 0) > 0 && (
                <span className="text-[10px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-md">NEW</span>
              )}
            </div>
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-2 block">PENDING UPLINKS</span>
          </div>
        </div>

        {/* Enrollment Requests Section */}
        <div className="mb-24">
          <EnrollmentRequests />
        </div>

        {/* Courses Section */}
        <div className="space-y-12">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">Core Curriculum</h2>
            <Link href="/create-course">
              <Button variant="ghost" className="text-purple-400 text-xs font-black uppercase tracking-widest hover:bg-purple-500/5">
                Archival View →
              </Button>
            </Link>
          </div>

          <div className="grid gap-8">
            {coursesLoading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-white/5 border border-white/10 rounded-[2.5rem] animate-pulse" />
                ))}
              </div>
            ) : courses && courses.length > 0 ? (
              courses.map((course: any) => (
                <div key={course.id} className="p-6 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl group relative overflow-hidden transition-all duration-500 hover:bg-white/10 neon-border-purple">
                  <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
                    <div className="w-full sm:w-48 aspect-[16/10] overflow-hidden rounded-2xl flex-shrink-0 relative border border-white/10 shadow-2xl">
                      {course.cover_image_url ? (
                        <img
                          src={course.cover_image_url}
                          alt={course.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-2"
                        />
                      ) : (
                        <div className="w-full h-full bg-purple-500/5 flex items-center justify-center">
                          <BookOpen className="h-10 w-10 text-purple-400/40" />
                        </div>
                      )}
                      {!course.is_published && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <Badge className="bg-white/10 text-white border-white/20 text-[10px] font-black uppercase tracking-widest">Offline</Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 py-2">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <Badge className={`border-none text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${course.is_published ? 'bg-green-500/10 text-green-400' : 'bg-purple-500/10 text-purple-400'}`}>
                          {course.is_published ? 'Protocol Active' : 'Neural Tuning'}
                        </Badge>
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]" data-testid={`text-course-category-${course.id}`}>
                          // {course.category}
                        </span>
                      </div>

                      <h3 className="text-2xl font-black text-white mb-4 leading-tight truncate group-hover:text-purple-400 transition-colors" data-testid={`text-course-title-${course.id}`}>
                        {course.title}
                      </h3>

                      <div className="flex items-center gap-8 text-[10px] font-black text-white/40 uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-purple-400" />
                          <span>120 Nodes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-purple-400">$</span>
                          <span className="text-white">{course.price}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto mt-6 sm:mt-0">
                      <Link href={`/courses/${course.id}`} className="flex-1 sm:flex-initial">
                        <Button variant="outline" className="w-full h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest border-white/10 bg-white/5 text-white hover:bg-white hover:text-black transition-all" data-testid={`button-view-${course.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          VIEW
                        </Button>
                      </Link>
                      <Link href={`/courses/${course.id}/edit`} className="flex-1 sm:flex-initial">
                        <Button className="w-full h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-purple-500 text-white hover:bg-white hover:text-black transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] border-none" data-testid={`button-edit-${course.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          ARCHITECT
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-24 rounded-[3.5rem] border border-white/10 bg-white/5 backdrop-blur-3xl text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center mb-10">
                  <Plus className="h-12 w-12 text-purple-400/40" />
                </div>
                <h3 className="text-3xl font-black text-white mb-6 uppercase tracking-tighter">Manifesto Empty</h3>
                <p className="text-blue-100/40 font-medium mb-12 max-w-sm">
                  Initialize your educational influence. Our quantum studio awaits your strategic brilliance.
                </p>
                <Link href="/create-course">
                  <Button className="bg-white text-black font-black h-16 px-12 rounded-2xl hover:bg-purple-400 hover:text-white transition-all shadow-2xl shadow-white/5 border-none">
                    GENERATE FIRST STREAM
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
