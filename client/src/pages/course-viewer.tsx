import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import VideoPlayer from "@/components/video-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  CheckCircle, 
  Lock, 
  Clock, 
  BookOpen, 
  Video,
  ChevronDown,
  ChevronRight,
  Award,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  videoDuration?: number;
  type: 'video' | 'text';
  content?: string;
  completed: boolean;
  locked: boolean;
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  expanded: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  coverImageUrl?: string;
  chapters: Chapter[];
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

export default function CourseViewer() {
  const [match, params] = useRoute("/courses/:id/learn");
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  // Check if user is enrolled in the course or has approved enrollment request
  const { data: enrollment, isLoading: enrollmentLoading, error: enrollmentError } = useQuery({
    queryKey: ['enrollment', params?.id, user?.id],
    queryFn: async () => {
      if (!params?.id || !user?.id) return null;
      
      console.log('Checking enrollment for course:', params.id, 'user:', user.id);
      
      // First check for direct enrollment
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', params.id)
        .eq('student_id', user.id)
        .maybeSingle();
      
      console.log('Enrollment query result:', { data: enrollmentData, error: enrollmentError });
      
      if (enrollmentData) {
        return enrollmentData;
      }
      
      // If no direct enrollment, check for approved enrollment request
      const { data: requestData, error: requestError } = await supabase
        .from('enrollment_requests')
        .select('*')
        .eq('course_id', params.id)
        .eq('student_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();
      
      console.log('Approved request query result:', { data: requestData, error: requestError });
      
      if (requestData) {
        // If we have an approved request, treat it as valid access
        // Return a mock enrollment object to grant access
        return {
          id: `approved-request-${requestData.id}`,
          student_id: user.id,
          course_id: params.id,
          enrolled_at: requestData.reviewed_at || requestData.requested_at,
          created_at: requestData.requested_at
        };
      }
      
      return null;
    },
    enabled: !!params?.id && !!user?.id && isAuthenticated,
  });

  // Fetch course data with chapters and lessons
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course-content', params?.id],
    queryFn: async () => {
      if (!params?.id) return null;
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          teacher:users!courses_teacher_id_fkey (
            id,
            name
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
              content,
              video_url,
              youtube_video_id,
              youtube_video_url,
              video_duration,
              position,
              is_free
            )
          )
        `)
        .eq('id', params.id)
        .eq('is_published', true)
        .single();
      
      if (error) throw error;
      
      console.log('Raw course data from database:', data);
      
      // Transform the data to match our interface
      const transformedData = {
        ...data,
        teacher: Array.isArray(data.teacher) ? data.teacher[0] : data.teacher,
        chapters: data.chapters?.map((chapter: any) => ({
          ...chapter,
          lessons: chapter.lessons?.map((lesson: any) => {
            console.log('Lesson data:', lesson);
            return lesson;
          }) || []
        })) || []
      };
      
      console.log('Transformed course data:', transformedData);
      
      return transformedData;
    },
    enabled: !!params?.id,
  });

  const isLoading = enrollmentLoading || courseLoading;

  // Set first lesson as current when course loads
  useEffect(() => {
    if (course && course.chapters.length > 0) {
      const firstChapter = course.chapters[0];
      if (firstChapter.lessons.length > 0) {
        const firstLesson = firstChapter.lessons[0];
        setCurrentLesson({
          id: firstLesson.id,
          title: firstLesson.title,
          description: firstLesson.description,
          type: firstLesson.type,
          content: firstLesson.content,
          videoUrl: firstLesson.video_url,
          videoDuration: firstLesson.video_duration,
          completed: false,
          locked: false
        });
        setExpandedChapters(new Set([firstChapter.id]));
      }
    }
  }, [course]);

  // Check authentication and enrollment
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access course content.",
        variant: "destructive",
      });
      setLocation("/signin");
      return;
    }

    // Only check enrollment after both enrollment and course queries are complete
    if (!enrollmentLoading && !courseLoading && !enrollment && course && isAuthenticated) {
      toast({
        title: "Access Denied",
        description: "You need to enroll in this course to access the content.",
        variant: "destructive",
      });
      setLocation(`/courses/${params?.id}`);
      return;
    }
  }, [isAuthenticated, enrollment, enrollmentLoading, courseLoading, course, isLoading, toast, setLocation, params?.id]);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const selectLesson = (lesson: Lesson) => {
    if (lesson.locked) {
      toast({
        title: "Lesson Locked",
        description: "Complete previous lessons to unlock this content.",
        variant: "destructive",
      });
      return;
    }
    setCurrentLesson(lesson);
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!user?.id || !params?.id) return;

    try {
      // Update lesson progress in database
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          student_id: user.id,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Lesson Completed!",
        description: "Great job! Moving to the next lesson.",
      });

      // Auto-advance to next lesson
      setTimeout(() => {
        const nextLesson = getNextLesson(lessonId);
        if (nextLesson) {
          setCurrentLesson(nextLesson);
        }
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark lesson as complete. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getNextLesson = (currentLessonId: string): Lesson | null => {
    if (!course) return null;
    
    const allLessons = course.chapters.flatMap((chapter: any) => chapter.lessons);
    const currentIndex = allLessons.findIndex((lesson: any) => lesson.id === currentLessonId);
    
    if (currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      return {
        id: nextLesson.id,
        title: nextLesson.title,
        description: nextLesson.description,
        type: nextLesson.type,
        content: nextLesson.content,
        videoUrl: nextLesson.video_url,
        videoDuration: nextLesson.video_duration,
        completed: false,
        locked: false
      };
    }
    
    return null;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const calculateStats = (chapters: any[]) => {
    return chapters.reduce((total: number, chapter: any) => {
      return total + chapter.lessons.length;
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if not enrolled
  if (!isLoading && !enrollment && course) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You need to enroll in this course to access the content.</p>
            <Button onClick={() => setLocation(`/courses/${params?.id}`)}>
              Go to Course Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
            <p className="text-muted-foreground">The course you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar - Course Content */}
        <div className="w-full lg:w-80 border-r lg:border-b-0 border-b bg-muted/30 lg:h-screen overflow-y-auto">
          <div className="p-4 lg:p-6">
            <div className="mb-4 lg:mb-6">
              <h2 className="font-bold text-base lg:text-lg mb-2">{course.title}</h2>
              <p className="text-xs lg:text-sm text-muted-foreground mb-4">by {course.teacher?.name}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs lg:text-sm">
                  <span>Progress</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 of {course.chapters.reduce((total, chapter) => total + chapter.lessons.length, 0)} lessons</span>
                </div>
              </div>
            </div>

            <Separator className="mb-4 lg:mb-6" />

            {/* Chapter List */}
            <div className="space-y-3 lg:space-y-4">
              {course.chapters.map((chapter: any) => (
                <div key={chapter.id}>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-2 lg:p-3 h-auto text-left"
                    onClick={() => toggleChapter(chapter.id)}
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm lg:text-base">{chapter.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {chapter.lessons.length} lessons
                      </div>
                    </div>
                    {expandedChapters.has(chapter.id) ? (
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    )}
                  </Button>

                  {expandedChapters.has(chapter.id) && (
                    <div className="ml-2 lg:ml-4 mt-2 space-y-1 lg:space-y-2">
                      {chapter.lessons.map((lesson: any) => (
                        <Button
                          key={lesson.id}
                          variant={currentLesson?.id === lesson.id ? "secondary" : "ghost"}
                          className="w-full justify-start p-2 lg:p-3 h-auto text-left"
                          onClick={() => selectLesson({
                            id: lesson.id,
                            title: lesson.title,
                            description: lesson.description,
                            type: lesson.type,
                            content: lesson.content,
                            videoUrl: lesson.video_url,
                            videoDuration: lesson.video_duration,
                            completed: false,
                            locked: false
                          })}
                        >
                          <div className="flex items-center gap-2 lg:gap-3 w-full min-w-0">
                            <div className="flex-shrink-0">
                              {lesson.type === 'video' ? (
                                <Video className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
                              ) : (
                                <BookOpen className="h-3 w-3 lg:h-4 lg:w-4 text-secondary" />
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="text-xs lg:text-sm font-medium truncate">{lesson.title}</div>
                              <div className="flex items-center gap-1 lg:gap-2 text-xs text-muted-foreground">
                                {lesson.video_duration && (
                                  <>
                                    <Clock className="h-3 w-3" />
                                    <span>{formatDuration(lesson.video_duration)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="p-4 lg:p-6">
            {currentLesson ? (
              <div className="space-y-4 lg:space-y-6">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold mb-2">{currentLesson.title}</h1>
                  <p className="text-sm lg:text-base text-muted-foreground">{currentLesson.description}</p>
                </div>

                {currentLesson.type === 'video' && currentLesson.videoUrl ? (
                  <VideoPlayer
                    videoUrl={currentLesson.videoUrl}
                    title={currentLesson.title}
                    onComplete={() => markLessonComplete(currentLesson.id)}
                    onProgress={(currentTime, duration) => {
                      // Mark as complete when 90% watched
                      if (currentTime / duration > 0.9 && !currentLesson.completed) {
                        markLessonComplete(currentLesson.id);
                      }
                    }}
                    allowDownload={false}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Lesson Content
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <p>{currentLesson.content || "Lesson content will be available here."}</p>
                      </div>
                      
                      <div className="mt-6">
                        <Button onClick={() => markLessonComplete(currentLesson.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Complete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Lesson Navigation */}
                <div className="flex justify-between items-center pt-6 border-t">
                  <div>
                    {currentLesson.completed && (
                      <Badge variant="secondary" className="text-sm">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {getNextLesson(currentLesson.id) && (
                      <Button 
                        onClick={() => {
                          const nextLesson = getNextLesson(currentLesson.id);
                          if (nextLesson) selectLesson(nextLesson);
                        }}
                      >
                        Next Lesson
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Lesson</h3>
                <p className="text-muted-foreground">
                  Choose a lesson from the sidebar to start learning
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
