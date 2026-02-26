import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, User, BookOpen, CheckCircle, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useSupabase";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { SecureVideoPlayer } from "@/components/SecureVideoPlayer";
import { useToast } from "@/hooks/use-toast";

export default function Lesson() {
  const [, params] = useRoute("/lesson/:id");
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const lessonId = params?.id;
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Fetch lesson data with chapter and course info
  const { data: lesson, isLoading: lessonsLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      if (!lessonId) return null;
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          chapter:chapters!inner (
            id,
            course_id,
            course:courses!inner (
              id,
              title
            )
          )
        `)
        .eq('id', lessonId)
        .single();

      if (error) throw error;

      // Flatten the structure for easier access
      const flattenedData = {
        ...data,
        course_id: data.chapter.course_id,
        course_title: data.chapter.course.title
      };

      console.log('Lesson data with course info:', flattenedData);
      return flattenedData;
    },
    enabled: !!lessonId
  });

  // Fetch user progress
  const { data: progressData, refetch: refetchProgress } = useProgress(lessonId || '');
  const lessonProgress = progressData?.find((p: any) => p.lesson_id === lessonId);

  useEffect(() => {
    if (lessonProgress) {
      setCurrentProgress(lessonProgress.progress_percentage || 0);
      setIsCompleted(lessonProgress.completed || false);
    }
  }, [lessonProgress]);

  const handleVideoProgress = (progress: number) => {
    setCurrentProgress(progress);

    // Auto-complete when video reaches 90%
    if (progress >= 90 && !isCompleted) {
      handleVideoEnd();
    }
  };

  const handleVideoEnd = async () => {
    if (!lesson || !user || isCompleted) return;

    try {
      // Mark lesson as completed
      setIsCompleted(true);
      setCurrentProgress(100);

      // You would typically call an API to update progress here
      // await updateProgress(lessonId, 100, true);

      toast({
        title: "Lesson Completed!",
        description: "Great job! You've completed this lesson.",
      });

      refetchProgress();
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (authLoading || lessonsLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
              <p className="text-muted-foreground mb-6">
                Please sign in to access this lesson.
              </p>
              <Button onClick={() => window.location.href = '/signin'}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Lesson Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The lesson you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </main>
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
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 w-full pt-40">
        {/* Navigation & Title */}
        <div className="mb-12">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="group text-white/30 hover:text-blue-400 font-black text-[10px] uppercase tracking-[0.3em] transition-all p-0 h-auto hover:bg-transparent"
          >
            <ArrowLeft className="h-4 w-4 mr-3 group-hover:-translate-x-2 transition-transform" />
            REVERT TO COURSE ARCHIVE
          </Button>

          <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <Badge className={`border-none text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${isCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  {isCompleted ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" />
                      MASTERY SYNC COMPLETE
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                      UPLINK: {Math.round(currentProgress)}%
                    </span>
                  )}
                </Badge>
                {lesson.duration && (
                  <Badge className="bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                    <Clock className="h-3 w-3 mr-2" />
                    {Math.round(lesson.duration / 60)} MIN STREAMS
                  </Badge>
                )}
                <Badge className="bg-purple-500/10 text-purple-400 border-none text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                  PHASE 0{lesson.order_index}
                </Badge>
              </div>
              <h1 className="text-4xl lg:text-7xl font-black text-white tracking-tighter leading-tight uppercase">
                {lesson.title.split(' ').map((word: string, i: number) => (
                  <span key={i} className={i % 2 === 1 ? "text-glow-blue text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 italic" : ""}>
                    {word}{' '}
                  </span>
                ))}
              </h1>
              <p className="text-xl text-blue-100/40 font-medium leading-relaxed mt-4">
                {lesson.description}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-12">

            {/* Terminal Debug Info - Styled as a code/terminal block */}
            <div className="rounded-3xl bg-black border border-white/10 p-6 font-mono text-[10px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-white/5" />
                <div className="w-2 h-2 rounded-full bg-white/5" />
                <div className="w-2 h-2 rounded-full bg-white/5" />
              </div>
              <div className="space-y-1.5 text-blue-400/60 transition-colors group-hover:text-blue-400/80">
                <p><span className="text-white/20"># NODE_IDENTIFIER:</span> {lesson.id}</p>
                <p><span className="text-white/20"># CORE_PROTOCOL:</span> {lesson.course_id || 'NULL'}</p>
                <p><span className="text-white/20"># STREAM_PROVIDER:</span> YouTube_API_V3</p>
                <p><span className="text-white/20"># STATUS:</span> {isCompleted ? 'SYNCHRONIZED' : 'STREAMING_ACTIVE'}</p>
                <p><span className="text-white/20"># PAYLOAD:</span> {lesson.youtube_video_id || 'UNSET'}</p>
              </div>
            </div>

            {/* Video Player Container */}
            <div className="rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden shadow-2xl neon-border-blue group">
              {lesson.youtube_video_id ? (
                <div className="relative aspect-video">
                  <SecureVideoPlayer
                    lessonId={lesson.id}
                    courseId={lesson.course_id}
                    studentName={user?.name || user?.email || 'Student'}
                    studentId={user?.id || 'unknown'}
                    onVideoEnd={handleVideoEnd}
                    onProgress={handleVideoProgress}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="p-24 text-center">
                  <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <BookOpen className="h-10 w-10 text-white/10" />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">No Video Stream</h3>
                  <p className="text-blue-100/40 font-medium max-w-sm mx-auto uppercase text-[10px] tracking-widest leading-relaxed">
                    This unit relies on neural-text transmission. Proceed to manual data entry below.
                  </p>
                </div>
              )}
            </div>

            {/* Lesson Content - Detailed info */}
            {lesson.content && (
              <div className="rounded-[3.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl p-10 lg:p-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 pointer-events-none opacity-5">
                  <BookOpen className="h-40 w-40 text-white" />
                </div>

                <div className="flex items-center gap-4 mb-12">
                  <div className="w-1.5 h-10 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full" />
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter">DATA TRANSMISSION</h2>
                </div>

                <div className="prose prose-invert prose-blue max-w-none">
                  <div
                    className="text-blue-100/60 text-lg leading-relaxed font-medium selection:bg-blue-500/30"
                    dangerouslySetInnerHTML={{ __html: lesson.content }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-12">

            {/* Sync Progress Card */}
            <div className="rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl p-10 neon-border-purple shadow-2xl relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none" />

              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                NEURAL SYNC
              </h3>

              <div className="space-y-10">
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-4">
                    <span className="text-white/20">PROGRESSION</span>
                    <span className="text-purple-400">{Math.round(currentProgress)}%</span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                      style={{ width: `${currentProgress}%` }}
                    />
                  </div>
                </div>

                {isCompleted ? (
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Verified</p>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">UNIT MASTERED</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] leading-relaxed text-center italic">
                      // CONTINUE STREAM TO FINALIZE SYNC //
                  </p>
                )}
              </div>
            </div>

            {/* Unit Information */}
            <div className="rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl p-10 shadow-xl">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-10">UNIT METADATA</h3>

              <div className="space-y-6">
                <div className="flex justify-between items-center py-4 border-b border-white/5">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">POSITION</span>
                  <span className="text-xs font-black text-white uppercase">PHASE 0{lesson.order_index}</span>
                </div>
                {lesson.duration && (
                  <div className="flex justify-between items-center py-4 border-b border-white/5">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">INTERVAL</span>
                    <span className="text-xs font-black text-white uppercase">{Math.round(lesson.duration / 60)} MINS</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-4">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">STREAM TYPE</span>
                  <span className="text-xs font-black text-blue-400 uppercase tracking-widest">
                    {lesson.youtube_video_id ? 'V-STREAM' : 'T-ENVELOPE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Phase Action */}
            <div className="p-2">
              <Button
                className={`w-full h-20 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all border-none ${isCompleted ? 'bg-white text-black hover:bg-purple-500 hover:text-white shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'bg-white/5 text-white/10 cursor-not-allowed'}`}
                disabled={!isCompleted}
                onClick={() => {
                  toast({
                    title: "INITIALIZING JUMP",
                    description: "Next phase coordinates requested.",
                  });
                }}
              >
                {isCompleted ? 'INITIATE NEXT PHASE →' : 'UNIT SYNC REQUIRED'}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
