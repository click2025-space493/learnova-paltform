import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, GripVertical, Trash2, Edit2, Save, X, Video, FileText } from "lucide-react";
import { YouTubeVideoInput } from "./YouTubeVideoInput";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'text';
  content?: string;
  video_url?: string;
  youtube_video_id?: string;
  youtube_video_url?: string;
  video_duration?: number;
  position: number;
  is_free: boolean;
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  position: number;
  lessons: Lesson[];
}

interface CourseContentManagerProps {
  courseId: string;
}

export default function CourseContentManager({ courseId }: CourseContentManagerProps) {
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterDescription, setNewChapterDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch chapters and lessons
  const { data: chapters = [], isLoading } = useQuery({
    queryKey: ['course-content', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chapters')
        .select(`
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
        `)
        .eq('course_id', courseId)
        .order('position', { ascending: true });

      if (error) throw error;
      
      return data.map(chapter => ({
        ...chapter,
        lessons: chapter.lessons.sort((a, b) => a.position - b.position)
      }));
    },
    enabled: !!courseId,
  });

  // Add chapter mutation
  const addChapterMutation = useMutation({
    mutationFn: async ({ title, description }: { title: string; description: string }) => {
      const position = chapters.length;
      const { data, error } = await supabase
        .from('chapters')
        .insert({
          course_id: courseId,
          title,
          description,
          position
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-content', courseId] });
      setNewChapterTitle("");
      setNewChapterDescription("");
      toast({
        title: "Chapter added",
        description: "New chapter has been created successfully.",
      });
    },
    onError: (error) => {
      console.error('Add chapter error:', error);
      toast({
        title: "Error",
        description: "Failed to add chapter. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add lesson mutation
  const addLessonMutation = useMutation({
    mutationFn: async ({ chapterId, type }: { chapterId: string; type: 'video' | 'text' }) => {
      const chapter = chapters.find(c => c.id === chapterId);
      const position = chapter?.lessons.length || 0;
      
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          chapter_id: chapterId,
          title: `New ${type} lesson`,
          description: '',
          type,
          position,
          is_free: false,
          youtube_video_id: '',
          youtube_video_url: ''
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-content', courseId] });
      toast({
        title: "Lesson added",
        description: "New lesson has been created successfully.",
      });
    },
  });

  // Update lesson mutation
  const updateLessonMutation = useMutation({
    mutationFn: async ({ lessonId, updates }: { lessonId: string; updates: Partial<Lesson> }) => {
      // Map frontend fields to database fields
      const dbUpdates: any = {};
      
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.video_url !== undefined) dbUpdates.video_url = updates.video_url;
      if (updates.youtube_video_id !== undefined) dbUpdates.youtube_video_id = updates.youtube_video_id;
      if (updates.youtube_video_url !== undefined) dbUpdates.youtube_video_url = updates.youtube_video_url;
      if (updates.video_duration !== undefined) dbUpdates.video_duration = updates.video_duration;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.position !== undefined) dbUpdates.position = updates.position;
      if (updates.is_free !== undefined) dbUpdates.is_free = updates.is_free;

      console.log('Updating lesson:', lessonId, 'with:', dbUpdates);
      console.log('Raw updates received:', updates);

      const { error } = await supabase
        .from('lessons')
        .update(dbUpdates)
        .eq('id', lessonId);

      if (error) {
        console.error('Lesson update error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-content', courseId] });
    },
    onError: (error) => {
      console.error('Update lesson mutation error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update lesson. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete chapter mutation
  const deleteChapterMutation = useMutation({
    mutationFn: async (chapterId: string) => {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-content', courseId] });
      toast({
        title: "Chapter deleted",
        description: "Chapter has been removed successfully.",
      });
    },
  });

  // Delete lesson mutation
  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-content', courseId] });
      toast({
        title: "Lesson deleted",
        description: "Lesson has been removed successfully.",
      });
    },
  });

  const addChapter = () => {
    if (!(newChapterTitle || '').trim()) {
      toast({
        title: "Chapter title required",
        description: "Please enter a title for the chapter",
        variant: "destructive",
      });
      return;
    }

    addChapterMutation.mutate({
      title: newChapterTitle,
      description: newChapterDescription
    });
  };

  const addLesson = (chapterId: string, type: 'video' | 'text') => {
    addLessonMutation.mutate({ chapterId, type });
  };

  const updateLesson = (lessonId: string, updates: Partial<Lesson>) => {
    updateLessonMutation.mutate({ lessonId, updates });
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading course content...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add New Chapter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Chapter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="chapter-title">Chapter Title</Label>
            <Input
              id="chapter-title"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="Enter chapter title"
            />
          </div>
          <div>
            <Label htmlFor="chapter-description">Chapter Description</Label>
            <Textarea
              id="chapter-description"
              value={newChapterDescription}
              onChange={(e) => setNewChapterDescription(e.target.value)}
              placeholder="Enter chapter description"
              rows={2}
            />
          </div>
          <Button 
            onClick={addChapter}
            disabled={addChapterMutation.isPending}
          >
            {addChapterMutation.isPending ? "Adding..." : "Add Chapter"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Chapters */}
      {chapters.map((chapter, chapterIndex) => (
        <Card key={chapter.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                <div>
                  <CardTitle className="text-lg">
                    Chapter {chapterIndex + 1}: {chapter.title}
                  </CardTitle>
                  {chapter.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {chapter.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {chapter.lessons.length} lesson{chapter.lessons.length !== 1 ? 's' : ''}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteChapterMutation.mutate(chapter.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Add Lesson Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addLesson(chapter.id, 'video')}
                  disabled={addLessonMutation.isPending}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Add Video Lesson
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addLesson(chapter.id, 'text')}
                  disabled={addLessonMutation.isPending}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Add Text Lesson
                </Button>
              </div>

              {/* Lessons */}
              {chapter.lessons.map((lesson, lessonIndex) => (
                <Card key={lesson.id} className="ml-4">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <div className="flex items-center gap-2">
                          {lesson.type === 'video' ? (
                            <Video className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          <span className="font-medium">
                            Lesson {lessonIndex + 1}: {lesson.title}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLessonMutation.mutate(lesson.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Lesson Title</Label>
                        <Input
                          value={lesson.title}
                          onChange={(e) => updateLesson(lesson.id, { title: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={lesson.description}
                          onChange={(e) => updateLesson(lesson.id, { description: e.target.value })}
                          rows={2}
                        />
                      </div>

                      {lesson.type === 'video' && (
                        <div>
                          <Label>YouTube Video</Label>
                          <YouTubeVideoInput
                            onVideoSelect={(videoData) => {
                              console.log('Video data received:', videoData);
                              updateLesson(lesson.id, { 
                                youtube_video_id: videoData.youtubeVideoId,
                                youtube_video_url: videoData.youtubeVideoUrl,
                                video_duration: videoData.duration 
                              });
                            }}
                            initialUrl={lesson.youtube_video_url}
                          />
                        </div>
                      )}

                      {lesson.type === 'text' && (
                        <div>
                          <Label>Content</Label>
                          <Textarea
                            value={lesson.content || ''}
                            onChange={(e) => updateLesson(lesson.id, { content: e.target.value })}
                            rows={4}
                            placeholder="Enter lesson content..."
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {chapter.lessons.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No lessons yet. Add your first lesson above.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {chapters.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <h3 className="text-lg font-medium mb-2">No chapters yet</h3>
          <p>Create your first chapter to start building your course content.</p>
        </div>
      )}
    </div>
  );
}
