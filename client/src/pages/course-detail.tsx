import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { supabase } from "@/lib/supabase";
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
import { useToast } from "@/hooks/use-toast";

export default function CourseDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Course ID is required');

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
          teacher_id,
          teacher:users!courses_teacher_id_fkey (
            id,
            name,
            avatar_url
          ),
          chapters (
            id,
            title,
            description,
            position,
            lessons (
              id,
              title,
              description,
              type,
              video_duration,
              position
            )
          )
        `)
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (error) throw error;

      // Transform the data to handle array responses
      const transformedData = {
        ...data,
        teacher: Array.isArray(data.teacher) ? data.teacher[0] : data.teacher
      };

      return transformedData;
    },
    enabled: !!id,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!id || !user?.id) throw new Error('Course ID and user required');

      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          course_id: id,
          enrolled_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Successfully enrolled!",
        description: "You can now access the course content.",
      });
      queryClient.invalidateQueries({ queryKey: ['student-enrollments'] });
    },
    onError: (error) => {
      console.error('Enrollment error:', error);
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
    <div className="min-h-screen bg-[#020617] relative overflow-hidden flex flex-col">
      <Navigation />

      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative z-10 w-full pt-40">
        {/* Breadcrumbs & Actions */}
        <div className="flex items-center justify-between mb-16">
          <Link href="/courses">
            <Button variant="ghost" className="group text-white/30 hover:text-blue-400 font-black text-[10px] uppercase tracking-[0.3em] transition-all p-0 h-auto hover:bg-transparent" data-testid="button-back-courses">
              <ArrowLeft className="h-4 w-4 mr-3 group-hover:-translate-x-2 transition-transform" />
              REVERT TO CATALOG
            </Button>
          </Link>
          <div className="flex gap-4">
            <Button variant="outline" size="icon" className="rounded-xl border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/20 transition-all">
              <Star className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-xl border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/20 transition-all">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-16 lg:gap-24">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-16">
            {/* Course Hero Content */}
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-4">
                {course?.category && (
                  <Badge className="bg-blue-500/10 text-blue-400 border-none text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full" data-testid="badge-category">
                    {course.category}
                  </Badge>
                )}
                <Badge className="bg-purple-500/10 text-purple-400 border-none text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                  <Star className="h-3 w-3 mr-2 inline" fill="currentColor" />
                  4.9 RATING
                </Badge>
                <Badge className="bg-white/5 text-white/40 border border-white/10 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                  ELITE STATUS
                </Badge>
              </div>

              <h1 className="text-5xl lg:text-8xl font-black text-white tracking-tighter leading-[0.9] uppercase" data-testid="text-course-title">
                {course?.title?.split(' ').map((word: string, i: number) => (
                  <span key={i} className={i % 2 === 1 ? "text-glow-purple text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400" : ""}>
                    {word}{' '}
                  </span>
                ))}
              </h1>

              <p className="text-xl text-blue-100/40 font-medium leading-relaxed max-w-2xl" data-testid="text-course-description">
                {course?.description}
              </p>

              {/* High-End Stats Bar */}
              <div className="flex flex-wrap items-center gap-x-12 gap-y-8 pt-8 border-t border-white/5">
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                    <PlayCircle className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">MODULES</p>
                    <p className="text-sm font-black text-white uppercase tracking-tight" data-testid="text-lesson-count">
                      {course?.chapters?.reduce((acc: number, chapter: any) => acc + (chapter.lessons?.length || 0), 0) || 0} UNITS
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
                    <Clock className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">DURATION</p>
                    <p className="text-sm font-black text-white uppercase tracking-tight" data-testid="text-course-duration">
                      {Math.ceil((course?.chapters?.reduce((acc: number, chapter: any) =>
                        acc + (chapter.lessons?.reduce((lessonAcc: number, lesson: any) =>
                          lessonAcc + (lesson.video_duration || 0), 0) || 0), 0) || 0) / 60)} HOURS
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all">
                    <Users className="h-6 w-6 text-white/40" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">ALUMNI</p>
                    <p className="text-sm font-black text-white uppercase tracking-tight" data-testid="text-student-count">1.4K+ MEMBERS</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Curriculum Preview */}
            <div className="space-y-12">
              <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">CURRICULUM</h2>
                <Badge variant="outline" className="border-white/10 text-white/40 font-black text-[10px] uppercase tracking-widest px-4 py-1.5">
                  {course?.chapters?.length || 0} CHAPTERS
                </Badge>
              </div>

              <div className="space-y-8">
                {course?.chapters?.sort((a: any, b: any) => a.position - b.position).map((chapter: any, idx: number) => (
                  <div key={chapter.id} className="group relative rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden transition-all hover:bg-white/10 neon-border-blue">
                    <div className=" p-10 lg:p-12">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">PHASE // 0{idx + 1}</span>
                      </div>
                      <h3 className="text-3xl font-black text-white leading-tight uppercase tracking-tight mb-4">
                        {chapter.title}
                      </h3>
                      {chapter.description && (
                        <p className="text-blue-100/40 font-medium leading-relaxed max-w-xl">
                          {chapter.description}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-white/5 bg-[#020617]/50">
                      {chapter.lessons?.sort((a: any, b: any) => a.position - b.position).map((lesson: any, lIdx: number) => (
                        <div key={lesson.id} className="group/lesson flex items-center justify-between p-8 hover:bg-white/5 transition-all border-b last:border-none border-white/5">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-[10px] font-black text-white/20 group-hover/lesson:bg-blue-500 group-hover/lesson:text-white group-hover/lesson:border-blue-400 group-hover/lesson:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                              {lIdx + 1 < 10 ? `0${lIdx + 1}` : lIdx + 1}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-black text-white uppercase tracking-wide text-sm group-hover/lesson:text-blue-400 transition-colors truncate" data-testid={`text-lesson-title-${idx}-${lIdx}`}>
                                {lesson.title}
                              </h4>
                              {lesson.description && (
                                <p className="text-xs text-blue-100/20 font-medium mt-1 uppercase tracking-widest truncate" data-testid={`text-lesson-description-${idx}-${lIdx}`}>
                                  {lesson.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl group-hover/lesson:bg-white/10 transition-colors">
                            <PlayCircle className="h-3 w-3 text-blue-400" />
                            <span data-testid={`text-lesson-duration-${idx}-${lIdx}`}>
                              {lesson.video_duration || 0}:00
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar / Enrollment Column */}
          <div className="relative">
            <div className="lg:sticky lg:top-40 space-y-12">
              <div className="rounded-[4rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden neon-border-purple shadow-2xl relative">
                {/* Glowing Background Glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-[60px] pointer-events-none" />

                <div className="relative aspect-video overflow-hidden border-b border-white/10">
                  {course?.cover_image_url ? (
                    <img
                      src={course.cover_image_url}
                      alt={course.title}
                      className="w-full h-full object-cover grayscale-[0.2] transition-all group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#020617] flex items-center justify-center">
                      <PlayCircle className="h-16 w-16 text-white/5" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[#020617]/40 backdrop-blur-[2px] flex items-center justify-center group cursor-pointer">
                    <div className="w-20 h-20 bg-white/5 backdrop-blur-3xl rounded-full flex items-center justify-center border border-white/10 shadow-2xl group-hover:scale-110 group-hover:bg-white/10 transition-all">
                      <PlayCircle className="h-10 w-10 text-white fill-white/10" />
                    </div>
                  </div>
                </div>

                <div className="p-10 lg:p-12">
                  <div className="flex items-end justify-between mb-12">
                    <div>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">ACCESS FEE</p>
                      <div className="text-6xl font-black text-white tracking-tighter" data-testid="text-course-price">
                        ${course?.price || 0}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">UNLIMITED</p>
                      <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">CORE ACCESS</p>
                    </div>
                  </div>

                  <div className="space-y-6 mb-12">
                    {isAuthenticated && user?.role === 'student' ? (
                      <Link href={`/courses/${id}/payment`}>
                        <Button size="lg" className="w-full h-16 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:bg-purple-400 hover:text-white transition-all border-none" data-testid="button-enroll-course">
                          INITIALIZE ENROLLMENT
                        </Button>
                      </Link>
                    ) : !isAuthenticated ? (
                      <Link href="/signin">
                        <Button size="lg" className="w-full h-16 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:bg-purple-400 hover:text-white transition-all border-none" data-testid="button-login-enroll">
                          UPLINK TO ACCESS
                        </Button>
                      </Link>
                    ) : (
                      <Button size="lg" className="w-full h-16 rounded-2xl bg-white/5 border border-white/10 text-white/20 font-black text-xs uppercase tracking-[0.3em]" disabled data-testid="button-enroll-disabled">
                        {user?.role === 'teacher' ? 'FACULTY MODE' : 'RESTRICTED'}
                      </Button>
                    )}
                    <Button variant="ghost" className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-white/40 hover:text-white transition-all">
                      REQUEST TRIAL PHASE
                    </Button>
                  </div>

                  {/* Course Features */}
                  <div className="space-y-6 pt-10 border-t border-white/5">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6 text-center">NEXUS PROTOCOLS</h4>
                    <div className="space-y-4">
                      {[
                        { icon: PlayCircle, text: "High-fidelity video streams", color: "blue" },
                        { icon: Download, text: "Curated research data", color: "purple" },
                        { icon: Users, text: "Elite alumni network access", color: "blue" },
                        { icon: Star, text: "Mastery certification", color: "purple" }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 text-[10px] font-black text-white/40 uppercase tracking-widest">
                          <div className={`w-8 h-8 rounded-xl bg-${item.color}-500/10 flex items-center justify-center border border-${item.color}-500/10`}>
                            <item.icon className="h-4 w-4 text-white/60" />
                          </div>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructor Mini-Card */}
              <div className="rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl p-8 transition-all hover:bg-white/10">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20 rounded-[1.5rem] border-2 border-white/10 shadow-2xl p-0.5 bg-gradient-to-br from-blue-500 to-purple-500">
                    <AvatarImage src={course?.teacher?.avatar_url || "/placeholder-avatar.jpg"} className="rounded-[1.3rem] object-cover" />
                    <AvatarFallback className="bg-transparent text-white text-2xl font-black">
                      {course?.title?.toLowerCase().includes("mechanical vibration")
                        ? "SN"
                        : (course?.teacher?.name?.[0] || 'T')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">LEAD ARCHITECT</p>
                    <h4 className="text-xl font-black text-white truncate uppercase tracking-tight" data-testid="text-instructor-name">
                      {course?.title?.toLowerCase().includes("mechanical vibration")
                        ? "ENG SALAH NOUR"
                        : (course?.teacher?.name || 'UNKNOWN ENTITY')}
                    </h4>
                    <Link href={`/instructor/${course?.teacher?.id}`} className="inline-block mt-3 text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition-colors">
                      VERIFY PROFILE // ACCESS →
                    </Link>
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
