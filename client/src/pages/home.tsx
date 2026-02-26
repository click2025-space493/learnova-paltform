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
    <div className="min-h-screen bg-[#020617] relative overflow-hidden flex flex-col">
      <Navigation />

      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 pt-40 w-full">
        {/* Welcome Block */}
        <div className="mb-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <Badge className="bg-blue-500/10 text-blue-400 border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
                CENTRAL COMMAND ACTIVE
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-tight">
                WELCOME BACK, <br />
                <span className="text-glow-blue text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 italic">{user?.name}.</span>
              </h1>
              <p className="text-blue-100/40 font-medium tracking-tight uppercase text-xs tracking-widest max-w-xl">
                Synchronizing personal knowledge streams. All systems operational. Your educational uplink is ready.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">SYSTEM UPTIME</p>
                <p className="text-2xl font-black text-white tracking-widest">99.9%</p>
              </div>
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">DATA STREAMS</p>
                <p className="text-2xl font-black text-white tracking-widest">ACTIVE</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          <Link href="/courses" data-testid="link-browse-courses">
            <Card className="group relative overflow-hidden h-full cursor-pointer bg-white/5 border-white/10 rounded-[2.5rem] p-8 transition-all hover:scale-[1.02] hover:bg-white/10 neon-border-blue">
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <BookOpen className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">NEURAL ARCHIVE</h3>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest leading-relaxed mb-6">
                ACCESS CURATED KNOWLEDGE REPOSITORIES.
              </p>
              <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                INITIALIZE LINK →
              </div>
            </Card>
          </Link>

          {user?.role === 'teacher' && (
            <Link href="/create-course" data-testid="link-create-course">
              <Card className="group relative overflow-hidden h-full cursor-pointer bg-white/5 border-white/10 rounded-[2.5rem] p-8 transition-all hover:scale-[1.02] hover:bg-white/10 neon-border-purple">
                <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  <GraduationCap className="h-7 w-7 text-purple-400" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">CONSTRUCT STUDIO</h3>
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest leading-relaxed mb-6">
                  DEPLOY NEW EDUCATIONAL PROTOCOLS.
                </p>
                <div className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                  OPEN CONSOLE →
                </div>
              </Card>
            </Link>
          )}

          {user?.role === 'student' && (
            <Link href="/student-dashboard" data-testid="link-student-dashboard">
              <Card className="group relative overflow-hidden h-full cursor-pointer bg-white/5 border-white/10 rounded-[2.5rem] p-8 transition-all hover:scale-[1.02] hover:bg-white/10 neon-border-cyan">
                <div className="w-14 h-14 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  <TrendingUp className="h-7 w-7 text-cyan-400" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">PROGRESS NODE</h3>
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest leading-relaxed mb-6">
                  TRACK INDIVIDUAL SYNAPTIC GROWTH.
                </p>
                <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                  SYNC DATA →
                </div>
              </Card>
            </Link>
          )}

          {user?.role === 'teacher' && (
            <Link href="/teacher-dashboard" data-testid="link-teacher-dashboard">
              <Card className="group relative overflow-hidden h-full cursor-pointer bg-white/5 border-white/10 rounded-[2.5rem] p-8 transition-all hover:scale-[1.02] hover:bg-white/10 neon-border-pink">
                <div className="w-14 h-14 bg-pink-500/20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  <Users className="h-7 w-7 text-pink-400" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">COMMAND CENTER</h3>
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest leading-relaxed mb-6">
                  MANAGE CONNECTED INITIATES.
                </p>
                <div className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                  ENTER HQ →
                </div>
              </Card>
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link href="/admin-dashboard" data-testid="link-admin-dashboard">
              <Card className="group relative overflow-hidden h-full cursor-pointer bg-white/5 border-white/10 rounded-[2.5rem] p-8 transition-all hover:scale-[1.02] hover:bg-white/10 neon-border-red">
                <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  <TrendingUp className="h-7 w-7 text-red-400" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">CORE ACCESS</h3>
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest leading-relaxed mb-6">
                  ROOT LEVEL SYSTEM CONFIGURATION.
                </p>
                <div className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                  GRANT ROOT →
                </div>
              </Card>
            </Link>
          )}
        </div>

        {/* Latest Content Section */}
        <div className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
            <div>
              <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase leading-tight mb-2">
                PRIORITY <span className="text-glow-purple text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 italic">TRANSMISSIONS.</span>
              </h2>
              <p className="text-blue-100/40 font-medium tracking-tight uppercase text-xs tracking-widest">Latest Knowledge streams integrated into the global grid.</p>
            </div>
            <Link href="/courses">
              <Button className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all">
                BROWSE FULL ARCHIVE →
              </Button>
            </Link>
          </div>

          {coursesLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="aspect-[16/10] bg-white/5 rounded-[3rem] animate-pulse border border-white/10" />
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {courses.map((course: any) => {
                const totalLessons = course.chapters?.reduce((total: number, chapter: any) =>
                  total + (chapter.lessons?.length || 0), 0) || 0;
                const totalDuration = course.chapters?.reduce((total: number, chapter: any) =>
                  total + (chapter.lessons?.reduce((chapterTotal: number, lesson: any) =>
                    chapterTotal + (lesson.video_duration || 0), 0) || 0), 0) || 0;

                const formatDuration = (seconds: number) => {
                  const hours = Math.floor(seconds / 3600);
                  const minutes = Math.floor((seconds % 3600) / 60);
                  if (hours > 0) return `${hours}H ${minutes}M`;
                  return `${minutes}M`;
                };

                return (
                  <Link key={course.id} href={`/courses/${course.id}`}>
                    <Card className="group relative overflow-hidden h-full cursor-pointer bg-white/5 border-white/10 rounded-[3rem] shadow-2xl transition-all hover:scale-[1.02] hover:bg-white/10 border-t-white/20">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        {course.cover_image_url ? (
                          <img
                            src={course.cover_image_url}
                            alt={course.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.5] group-hover:grayscale-0"
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-500/10 flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-blue-400/20" />
                          </div>
                        )}
                        <div className="absolute top-6 left-6 flex gap-2">
                          <Badge className="bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-none shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                            {course.category}
                          </Badge>
                          <Badge className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/20">
                            ${course.price}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-10 space-y-8">
                        <div>
                          <h3 className="font-black text-2xl text-white uppercase tracking-tighter group-hover:text-blue-400 transition-colors line-clamp-1 mb-2">{course.title}</h3>
                          <div className="h-[2px] w-12 bg-blue-500 group-hover:w-full transition-all duration-500" />
                        </div>

                        <div className="flex items-center gap-8 border-t border-white/5 pt-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                              <Users className="h-3.5 w-3.5 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">ARCHITECT</p>
                              <p className="text-[10px] font-black text-white uppercase tracking-tighter">{course.users?.name || 'EDUCATOR'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                              <Clock className="h-3.5 w-3.5 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">RUNTIME</p>
                              <p className="text-[10px] font-black text-white uppercase tracking-tighter">{formatDuration(totalDuration)}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="border-2 border-dashed border-white/10 bg-white/5 rounded-[4rem] p-32 text-center group">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-10 group-hover:scale-110 transition-transform">
                <BookOpen className="h-10 w-10 text-white/20" />
              </div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">ARCHIVE EMPTY</h3>
              <p className="text-blue-100/40 font-black uppercase text-xs tracking-[0.2em] max-w-sm mx-auto">New data streams are currently being encoded and verified by the grid.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
