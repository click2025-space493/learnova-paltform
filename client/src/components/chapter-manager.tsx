import { useState } from "react";
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
import { supabase } from "@/lib/supabase";

interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  youtube_video_id?: string;
  youtube_video_url?: string;
  video_duration?: number;
  order: number;
  type: 'video' | 'text';
  content?: string;
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

interface ChapterManagerProps {
  chapters: Chapter[];
  onChaptersChange: (chapters: Chapter[]) => void;
}

export default function ChapterManager({ chapters, onChaptersChange }: ChapterManagerProps) {
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterDescription, setNewChapterDescription] = useState("");
  const { toast } = useToast();

  const addChapter = () => {
    if (!newChapterTitle.trim()) {
      toast({
        title: "Chapter title required",
        description: "Please enter a title for the chapter",
        variant: "destructive",
      });
      return;
    }

    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: newChapterTitle,
      description: newChapterDescription,
      order: chapters.length + 1,
      lessons: []
    };

    onChaptersChange([...chapters, newChapter]);
    setNewChapterTitle("");
    setNewChapterDescription("");
    
    toast({
      title: "Chapter added",
      description: `"${newChapterTitle}" has been added to your course`,
    });
  };

  const updateChapter = (chapterId: string, updates: Partial<Chapter>) => {
    const updatedChapters = chapters.map(chapter =>
      chapter.id === chapterId ? { ...chapter, ...updates } : chapter
    );
    onChaptersChange(updatedChapters);
  };

  const deleteChapter = (chapterId: string) => {
    const updatedChapters = chapters.filter(chapter => chapter.id !== chapterId);
    onChaptersChange(updatedChapters);
    
    toast({
      title: "Chapter deleted",
      description: "The chapter and all its lessons have been removed",
    });
  };

  const addLesson = (chapterId: string, type: 'video' | 'text') => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: `New ${type} lesson`,
      description: "",
      order: chapter.lessons.length + 1,
      type
    };

    const updatedChapter = {
      ...chapter,
      lessons: [...chapter.lessons, newLesson]
    };

    updateChapter(chapterId, updatedChapter);
    setEditingLesson(newLesson.id);
  };

  const updateLesson = (chapterId: string, lessonId: string, updates: Partial<Lesson>) => {
    console.log('Chapter manager updateLesson called:', { chapterId, lessonId, updates });
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    const updatedLessons = chapter.lessons.map(lesson =>
      lesson.id === lessonId ? { ...lesson, ...updates } : lesson
    );

    const updatedChapter = {
      ...chapter,
      lessons: updatedLessons
    };

    console.log('Updated chapter with lessons:', updatedChapter);
    updateChapter(chapterId, updatedChapter);
  };

  const deleteLesson = (chapterId: string, lessonId: string) => {
    console.log('Chapter manager deleteLesson called:', { chapterId, lessonId });
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    const updatedLessons = chapter.lessons.filter(lesson => lesson.id !== lessonId);
    updateChapter(chapterId, { lessons: updatedLessons });
    
    toast({
      title: "Lesson deleted",
      description: "The lesson has been removed from the chapter",
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = (chapter: Chapter) => {
    return chapter.lessons.reduce((total, lesson) => {
      return total + (lesson.video_duration || 0);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Course Chapters & Lessons</h3>
        <Badge variant="secondary">
          {chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'}
        </Badge>
      </div>

      {/* Add New Chapter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Chapter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="chapter-title">Chapter Title</Label>
            <Input
              id="chapter-title"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="e.g., Introduction to React Hooks"
            />
          </div>
          <div>
            <Label htmlFor="chapter-description">Chapter Description</Label>
            <Textarea
              id="chapter-description"
              value={newChapterDescription}
              onChange={(e) => setNewChapterDescription(e.target.value)}
              placeholder="Brief description of what students will learn in this chapter"
              rows={3}
            />
          </div>
          <Button onClick={addChapter} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Chapter
          </Button>
        </CardContent>
      </Card>

      {/* Chapters List */}
      <div className="space-y-4">
        {chapters.map((chapter, chapterIndex) => (
          <Card key={chapter.id} className="border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {editingChapter === chapter.id ? (
                    <div className="space-y-3">
                      <Input
                        value={chapter.title}
                        onChange={(e) => updateChapter(chapter.id, { title: e.target.value })}
                        className="font-semibold"
                      />
                      <Textarea
                        value={chapter.description}
                        onChange={(e) => updateChapter(chapter.id, { description: e.target.value })}
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => setEditingChapter(null)}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingChapter(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Chapter {chapterIndex + 1}</Badge>
                        <CardTitle className="text-lg">{chapter.title}</CardTitle>
                      </div>
                      <p className="text-muted-foreground text-sm mb-2">{chapter.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{chapter.lessons.length} lessons</span>
                        {getTotalDuration(chapter) > 0 && (
                          <span>{formatDuration(getTotalDuration(chapter))} total</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {editingChapter !== chapter.id && (
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingChapter(chapter.id)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteChapter(chapter.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Lessons */}
              <div className="space-y-3">
                {chapter.lessons.map((lesson, lessonIndex) => (
                  <div key={lesson.id} className="border rounded-lg p-4 bg-muted/30">
                    {editingLesson === lesson.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Lesson Title</Label>
                            <Input
                              value={lesson.title}
                              onChange={(e) => updateLesson(chapter.id, lesson.id, { title: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Lesson Type</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={lesson.type === 'video' ? 'default' : 'secondary'}>
                                {lesson.type === 'video' ? <Video className="h-3 w-3 mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
                                {lesson.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={lesson.description}
                            onChange={(e) => updateLesson(chapter.id, lesson.id, { description: e.target.value })}
                            rows={2}
                          />
                        </div>

                        {lesson.type === 'video' && (
                          <div>
                            <Label>YouTube Video</Label>
                            <YouTubeVideoInput
                              onVideoSelect={(videoData) => {
                                console.log('Chapter manager - Video data received:', videoData);
                                console.log('Storing video data in local state only - will save to DB on Save Lesson');
                                // Only update local state, don't save to database yet
                                updateLesson(chapter.id, lesson.id, { 
                                  youtube_video_id: videoData.youtubeVideoId,
                                  youtube_video_url: videoData.youtubeVideoUrl,
                                  video_duration: videoData.duration 
                                });
                                console.log('Video data stored in local state successfully');
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
                              onChange={(e) => updateLesson(chapter.id, lesson.id, { content: e.target.value })}
                              rows={6}
                              placeholder="Enter the lesson content here..."
                            />
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              console.log('Save Lesson clicked - saving to database...');
                              try {
                                // Save lesson data to database
                                const { error } = await supabase
                                  .from('lessons')
                                  .update({
                                    title: lesson.title,
                                    description: lesson.description,
                                    content: lesson.content,
                                    youtube_video_id: lesson.youtube_video_id,
                                    youtube_video_url: lesson.youtube_video_url,
                                    video_duration: lesson.video_duration
                                  })
                                  .eq('id', lesson.id);

                                if (error) {
                                  console.error('Database save error:', error);
                                  toast({
                                    title: "Save Failed",
                                    description: "Failed to save lesson to database",
                                    variant: "destructive",
                                  });
                                } else {
                                  console.log('Lesson saved to database successfully');
                                  toast({
                                    title: "Lesson Saved",
                                    description: "Lesson has been saved successfully",
                                  });
                                  setEditingLesson(null);
                                }
                              } catch (error) {
                                console.error('Save lesson error:', error);
                                toast({
                                  title: "Save Failed",
                                  description: "An error occurred while saving",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save Lesson
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingLesson(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              Lesson {lessonIndex + 1}
                            </Badge>
                            <Badge variant={lesson.type === 'video' ? 'default' : 'secondary'} className="text-xs">
                              {lesson.type === 'video' ? <Video className="h-3 w-3 mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
                              {lesson.type}
                            </Badge>
                          </div>
                          <h4 className="font-medium">{lesson.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
                          {lesson.video_duration && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Duration: {formatDuration(lesson.video_duration)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingLesson(lesson.id)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteLesson(chapter.id, lesson.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Lesson Buttons */}
              <Separator />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addLesson(chapter.id, 'video')}
                  className="flex-1"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Add Video Lesson
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addLesson(chapter.id, 'text')}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Add Text Lesson
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {chapters.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No chapters yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Start building your course by adding your first chapter above
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
