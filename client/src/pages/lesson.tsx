import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, User, BookOpen, CheckCircle } from "lucide-react";
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

  // Fetch lesson data directly by lesson ID
  const { data: lesson, isLoading: lessonsLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      if (!lessonId) return null;
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();
      
      if (error) throw error;
      return data;
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
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lesson Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={isCompleted ? "default" : "secondary"}>
                  {isCompleted ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </>
                  ) : (
                    `${Math.round(currentProgress)}% Complete`
                  )}
                </Badge>
                {lesson.duration && (
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {Math.round(lesson.duration / 60)} min
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {lesson.title}
              </h1>
              {lesson.description && (
                <p className="text-muted-foreground text-lg">
                  {lesson.description}
                </p>
              )}
            </div>

            {/* Video Player */}
            {lesson.youtube_video_id ? (
              <SecureVideoPlayer
                lessonId={lesson.id}
                courseId={lesson.course_id}
                studentName={user?.name || user?.email || 'Student'}
                studentId={user?.id || 'unknown'}
                onVideoEnd={handleVideoEnd}
                onProgress={handleVideoProgress}
                className="w-full"
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Video Available</h3>
                  <p className="text-muted-foreground">
                    This lesson doesn't have a video yet. Check back later!
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Lesson Content */}
            {lesson.content && (
              <Card>
                <CardHeader>
                  <CardTitle>Lesson Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{Math.round(currentProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${currentProgress}%` }}
                      />
                    </div>
                  </div>
                  
                  {isCompleted ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Completed!</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Watch the video to complete this lesson
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lesson Info */}
            <Card>
              <CardHeader>
                <CardTitle>Lesson Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Order</span>
                  <span className="text-sm font-medium">#{lesson.order_index}</span>
                </div>
                {lesson.duration && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Duration</span>
                    <span className="text-sm font-medium">
                      {Math.round(lesson.duration / 60)} minutes
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="text-sm font-medium">
                    {lesson.youtube_video_id ? 'Video Lesson' : 'Text Lesson'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Next Lesson */}
            <Card>
              <CardHeader>
                <CardTitle>What's Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete this lesson to unlock the next one in your course.
                </p>
                <Button 
                  className="w-full" 
                  disabled={!isCompleted}
                  onClick={() => {
                    // Navigate to next lesson logic would go here
                    toast({
                      title: "Coming Soon",
                      description: "Navigation to next lesson will be implemented.",
                    });
                  }}
                >
                  {isCompleted ? 'Continue to Next Lesson' : 'Complete This Lesson First'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
