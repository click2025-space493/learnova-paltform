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
    <div className="min-h-screen bg-[#020617] relative overflow-hidden flex flex-col">
      <Navigation />

      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 w-full pt-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div className="max-w-2xl">
            <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
              SCHOLAR PORTAL // ACCESS GRANTED
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter mb-6">INTELLECTUAL <span className="text-glow-blue text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">HUB.</span></h1>
            <p className="text-xl text-blue-100/40 font-medium leading-relaxed">
              Welcome back, <span className="text-blue-400 font-black uppercase tracking-widest">{user?.name}</span>. Your neural pathways are optimized for learning.
            </p>
          </div>
          <Link href="/courses">
            <Button size="lg" className="h-16 px-10 rounded-2xl bg-white text-black font-black hover:bg-blue-400 hover:text-white transition-all shadow-2xl shadow-blue-500/20 border-none">
              <BookOpen className="h-6 w-6 mr-3" />
              SCAN REPOSITORY
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl neon-border-blue group hover:bg-white/10 transition-all cursor-default">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <BookOpen className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-[10px] font-black text-blue-400/40 uppercase tracking-widest">ENROLLED</div>
            </div>
            <div className="text-4xl font-black text-white tracking-tighter" data-testid="text-enrolled-courses">
              {enrollmentsLoading ? "..." : (stats.enrolledCourses || 0)}
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl neon-border-purple group hover:bg-white/10 transition-all cursor-default text-purple-400">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <Bell className="h-6 w-6 text-purple-400" />
              </div>
              <div className="text-[10px] font-black text-purple-400/40 uppercase tracking-widest">QUEUE</div>
            </div>
            <div className="text-4xl font-black text-white tracking-tighter flex items-center gap-3" data-testid="text-pending-requests">
              {requestsLoading ? "..." : (stats.pendingRequests || 0)}
              {stats.pendingRequests > 0 && (
                <span className="text-[10px] font-black bg-purple-500 text-white px-2 py-0.5 rounded-md">LIVE</span>
              )}
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl neon-border-blue group hover:bg-white/10 transition-all cursor-default">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <Award className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-[10px] font-black text-blue-400/40 uppercase tracking-widest">CREDENTIALS</div>
            </div>
            <div className="text-4xl font-black text-white tracking-tighter" data-testid="text-certificates">
              {stats.certificates || 0}
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl neon-border-purple group hover:bg-white/10 transition-all cursor-default text-purple-400">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <Calendar className="h-6 w-6 text-purple-400" />
              </div>
              <div className="text-[10px] font-black text-purple-400/40 uppercase tracking-widest">STREAK</div>
            </div>
            <div className="text-4xl font-black text-white tracking-tighter" data-testid="text-study-streak">
              {stats.studyStreak || 0}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-16">
          {/* Continue Learning */}
          <div className="lg:col-span-2 space-y-12">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-white tracking-tight">ACTIVE PROTOCOLS</h2>
              <Link href="/courses">
                <Button variant="ghost" className="text-blue-400 text-xs font-black uppercase tracking-widest hover:bg-blue-500/5">
                  Full Catalog →
                </Button>
              </Link>
            </div>

            {enrollmentsLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-48 bg-white/5 border border-white/10 rounded-[2.5rem] animate-pulse" />
                ))}
              </div>
            ) : enrollments && enrollments.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-8">
                {enrollments.slice(0, 4).map((enrollment: any) => (
                  <div key={enrollment.id} className="group relative p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden transition-all duration-500 hover:bg-white/10 neon-border-blue">
                    <div className="mb-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                        Progress Sync
                      </div>
                      <h4 className="font-black text-2xl text-white mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors" data-testid={`text-course-title-${enrollment.id}`}>
                        {enrollment.course?.title || 'Untitled Course'}
                      </h4>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                        Architect: {enrollment.course?.teacher?.name || 'Instructor'}
                      </p>
                    </div>

                    <div className="mb-10">
                      <div className="flex justify-between text-[10px] font-black mb-3 uppercase tracking-widest">
                        <span className="text-white/20">Neural Mastery</span>
                        <span className="text-blue-400" data-testid={`text-progress-${enrollment.id}`}>0%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[5%] animate-pulse shadow-[0_0_15px_#3b82f6]" />
                      </div>
                    </div>

                    <Link href={`/courses/${enrollment.course?.id}/learn`}>
                      <Button className="w-full h-14 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-blue-400 hover:text-white transition-all shadow-xl shadow-white/5 border-none">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        INITIALIZE STREAM
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 rounded-[3rem] border border-white/10 bg-white/5 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mb-8">
                  <BookOpen className="h-8 w-8 text-blue-400/40" />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">Repository Empty</h3>
                <p className="text-blue-100/40 font-medium mb-12 max-w-sm">
                  Initialize your first neural stream from the global repository of knowledge.
                </p>
                <Link href="/courses">
                  <Button className="bg-white text-black font-black h-16 px-12 rounded-2xl hover:bg-blue-400 hover:text-white transition-all border-none">
                    ENTER REPOSITORY
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="space-y-16">
            {/* Enrollment Requests Status */}
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-8">QUEUED REQUESTS</h2>
              {requestsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-28 bg-white/5 border border-white/10 rounded-[2rem] animate-pulse" />
                  ))}
                </div>
              ) : enrollmentRequests && enrollmentRequests.length > 0 ? (
                <div className="space-y-6">
                  {enrollmentRequests.slice(0, 3).map((request: any) => (
                    <div key={request.id} className="group p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-3xl hover:bg-white/10 transition-all cursor-default relative overflow-hidden">
                      <div className="flex flex-col gap-4 relative z-10">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="font-black text-white text-sm line-clamp-2 uppercase tracking-wide leading-tight group-hover:text-purple-400 transition-colors">
                            {request.course?.title || 'Unknown Course'}
                          </h4>
                          <Badge
                            className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border-none ${request.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                              request.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                                'bg-purple-500/10 text-purple-400'
                              }`}
                          >
                            {request.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
                          <span>SYNC: {new Date(request.requested_at).toLocaleDateString()}</span>
                          {request.status === 'approved' && (
                            <Link href={`/courses/${request.course?.id}/learn`} className="text-blue-400 hover:text-white transition-colors">
                              INITIATE →
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className={`absolute top-0 right-0 w-24 h-24 opacity-10 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-700 ${request.status === 'approved' ? 'bg-green-500' : request.status === 'rejected' ? 'bg-red-500' : 'bg-purple-500'}`} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl">
                  <Bell className="h-10 w-10 text-white/10 mx-auto mb-6" />
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">No Active Logs</p>
                </div>
              )}
            </div>

            {/* Recent Achievements */}
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-8">MILESTONES</h2>
              <div className="space-y-6">
                <div className="group p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-3xl hover:bg-white/10 transition-all cursor-default flex items-center gap-6">
                  <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <Award className="h-7 w-7 text-blue-400" />
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-white uppercase tracking-wide mb-1" data-testid="text-achievement-title">First Contact</h5>
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]" data-testid="text-achievement-date">Protocol Inception</p>
                  </div>
                </div>

                <div className="group p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-3xl hover:bg-white/10 transition-all cursor-default flex items-center gap-6">
                  <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                    <Calendar className="h-7 w-7 text-purple-400" />
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-white uppercase tracking-wide mb-1" data-testid="text-streak-achievement">{stats?.studyStreak || 0}-CYC STREAK</h5>
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]" data-testid="text-streak-date">Persistent Uplink</p>
                  </div>
                </div>

                <div className="group p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-3xl opacity-20 grayscale cursor-not-allowed flex items-center gap-6">
                  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-7 w-7 text-white/40" />
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-white uppercase tracking-wide mb-1">Elite Node</h5>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Encrypted</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
