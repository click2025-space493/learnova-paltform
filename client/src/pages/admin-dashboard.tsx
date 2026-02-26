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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  BookOpen,
  CreditCard,
  BarChart3,
  Settings,
  UserCheck,
  TrendingUp,
  Layout
} from "lucide-react";
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
    <div className="min-h-screen bg-[#020617] relative overflow-hidden flex flex-col">
      <Navigation />

      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 w-full pt-32">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div className="max-w-2xl">
            <Badge className="mb-6 bg-red-500/10 text-red-400 border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
              GLOBAL OVERRIDE // ADMIN ACCESS
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter mb-6">SYSTEM <span className="text-glow-blue text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">CORE.</span></h1>
            <p className="text-xl text-blue-100/40 font-medium leading-relaxed">
              Platform status: <span className="text-green-400 font-black uppercase tracking-widest">Master Operational</span>. Overview of global neural metrics.
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/admin/settings">
              <Button variant="outline" className="h-16 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-white/5 border-white/10 text-white hover:bg-white hover:text-black transition-all" data-testid="button-system-settings">
                <Settings className="h-4 w-4 mr-2" />
                CONFIG
              </Button>
            </Link>
            <Link href="/admin/courses">
              <Button className="h-16 px-10 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-blue-400 hover:text-white transition-all shadow-2xl shadow-blue-500/20 border-none">
                <Layout className="h-4 w-4 mr-2" />
                CENTRAL ARCHIVE
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl group hover:bg-white/10 transition-all cursor-default relative overflow-hidden neon-border-blue">
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-[10px] font-black text-blue-400/40 uppercase tracking-widest">TOTAL POPULATION</div>
            </div>
            <div className="text-4xl font-black text-white tracking-tighter relative z-10" data-testid="text-total-users">
              {statsLoading ? "..." : (stats?.totalUsers || 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-green-400 text-[10px] font-black mt-4 uppercase tracking-widest relative z-10">
              <TrendingUp className="h-3 w-3" />
              <span>+12.5% GROWTH</span>
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl group hover:bg-white/10 transition-all cursor-default relative overflow-hidden neon-border-purple">
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
                <BookOpen className="h-6 w-6 text-purple-400" />
              </div>
              <div className="text-[10px] font-black text-purple-400/40 uppercase tracking-widest">ACTIVE STREAMS</div>
            </div>
            <div className="text-4xl font-black text-white tracking-tighter relative z-10" data-testid="text-total-courses">
              {statsLoading ? "..." : (stats?.totalCourses || 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-green-400 text-[10px] font-black mt-4 uppercase tracking-widest relative z-10">
              <TrendingUp className="h-3 w-3" />
              <span>+8.2% SCALE</span>
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl group hover:bg-white/10 transition-all cursor-default relative overflow-hidden neon-border-blue">
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
                <CreditCard className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-[10px] font-black text-blue-400/40 uppercase tracking-widest">TOTAL VOLUME</div>
            </div>
            <div className="text-4xl font-black text-white tracking-tighter relative z-10" data-testid="text-total-revenue">
              ${statsLoading ? "..." : (stats?.totalRevenue || 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-green-400 text-[10px] font-black mt-4 uppercase tracking-widest relative z-10">
              <TrendingUp className="h-3 w-3" />
              <span>+15.3% REVENUE</span>
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl group hover:bg-white/10 transition-all cursor-default relative overflow-hidden neon-border-purple">
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
                <BarChart3 className="h-6 w-6 text-purple-400" />
              </div>
              <div className="text-[10px] font-black text-purple-400/40 uppercase tracking-widest">CORE QUALITY</div>
            </div>
            <div className="text-4xl font-black text-white tracking-tighter relative z-10">
              4.9
            </div>
            <div className="flex items-center gap-1 text-purple-400 text-[10px] font-black mt-4 uppercase tracking-widest relative z-10">
              <TrendingUp className="h-3 w-3" />
              <span>ELITE TIER</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Recent Teachers */}
          <section className="space-y-10">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">ACTIVE ENTITIES</h2>
              <Link href="/admin/teachers">
                <Button variant="ghost" className="text-blue-400 text-xs font-black uppercase tracking-widest hover:bg-blue-500/5">
                  Full Registry →
                </Button>
              </Link>
            </div>
            <div className="space-y-6">
              {recentTeachers && recentTeachers.length > 0 ? (
                recentTeachers.map((teacher: any) => (
                  <div key={teacher.id} className="p-6 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl hover:bg-white/10 transition-all group cursor-default">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <Avatar className="h-14 w-14 border border-white/10 shadow-2xl">
                          <AvatarImage src={teacher.profileImageUrl} />
                          <AvatarFallback className="bg-white/5 text-white font-black text-xs uppercase">
                            {teacher.firstName?.[0] || teacher.email?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-black text-white uppercase tracking-wide group-hover:text-blue-400 transition-colors">
                            {teacher.name || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.email}
                          </h4>
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{teacher.email}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">
                        {teacher.role}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center border border-dashed border-white/10 bg-white/5 rounded-[2.5rem]">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">No Entities Detected</p>
                </div>
              )}
            </div>
          </section>

          {/* Recent Courses */}
          <section className="space-y-10">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">DATA STREAMS</h2>
              <Link href="/admin/courses">
                <Button variant="ghost" className="text-purple-400 text-xs font-black uppercase tracking-widest hover:bg-purple-500/5">
                  Central Terminal →
                </Button>
              </Link>
            </div>
            <div className="space-y-6">
              {recentCourses && recentCourses.length > 0 ? (
                recentCourses.map((course: any) => (
                  <div key={course.id} className="p-6 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl hover:bg-white/10 transition-all group cursor-default">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                        <BookOpen className="h-7 w-7 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-black text-white uppercase tracking-wide truncate pr-4 group-hover:text-purple-400 transition-colors" data-testid={`text-course-title-${course.id}`}>
                            {course.title}
                          </h4>
                          <Badge className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border-none ${course.status === 'published' ? "bg-green-500/10 text-green-400" : "bg-purple-500/10 text-purple-400"}`}>
                            {course.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                          <span>{course.teacherName}</span>
                          <span className="w-1 h-1 rounded-full bg-white/10" />
                          <span>{course.enrollmentCount} NODES</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center border border-dashed border-white/10 bg-white/5 rounded-[2.5rem]">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">No Streams Detected</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
