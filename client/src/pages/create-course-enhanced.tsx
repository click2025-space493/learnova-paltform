import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import ChapterManager from "@/components/chapter-manager";
import { ImageUpload } from "@/components/image-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookOpen, Video, Users, Settings, Save, Eye } from "lucide-react";

const createCourseSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Please select a category"),
  price: z.string().min(1, "Please enter a price"),
  coverImage: z.string().optional(),
  instapayNumber: z.string().optional(),
  vodafoneCashNumber: z.string().optional(),
  paymentInstructions: z.string().optional(),
});

type CreateCourseForm = z.infer<typeof createCourseSchema>;

interface Chapter {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Array<{
    id: string;
    title: string;
    description: string;
    videoUrl?: string;
    videoDuration?: number;
    order: number;
    type: 'video' | 'text';
    content?: string;
  }>;
}

export default function CreateCourseEnhanced() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  const [isLoading, setIsLoading] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateCourseForm>({
    resolver: zodResolver(createCourseSchema),
  });

  const watchedValues = watch();

  const onSubmit = async (data: CreateCourseForm) => {
    console.log('onSubmit called with data:', data);
    console.log('User:', user);
    console.log('Chapters:', chapters);
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a course.",
        variant: "destructive",
      });
      return;
    }

    if (chapters.length === 0) {
      toast({
        title: "No Content Added",
        description: "Please add at least one chapter with lessons before publishing.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create course in database
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: data.title,
          description: data.description,
          category: data.category,
          price: parseFloat(data.price),
          teacher_id: user.id,
          is_published: true, // Publish immediately
          cover_image_url: data.coverImage,
          instapay_number: data.instapayNumber,
          vodafone_cash_number: data.vodafoneCashNumber,
          payment_instructions: data.paymentInstructions
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // Set courseId for use in ChapterManager
      setCourseId(course.id);

      // Create chapters and lessons
      for (const chapter of chapters) {
        const { data: createdChapter, error: chapterError } = await supabase
          .from('chapters')
          .insert({
            course_id: course.id,
            title: chapter.title,
            description: chapter.description,
            position: chapter.order
          })
          .select()
          .single();

        if (chapterError) throw chapterError;

        // Create lessons for this chapter
        for (const lesson of chapter.lessons) {
          const { error: lessonError } = await supabase
            .from('lessons')
            .insert({
              chapter_id: createdChapter.id,
              title: lesson.title,
              description: lesson.description,
              type: lesson.type,
              content: lesson.content,
              video_url: lesson.videoUrl,
              video_duration: lesson.videoDuration,
              position: lesson.order,
              is_free: false
            });

          if (lessonError) throw lessonError;
        }
      }
      
      toast({
        title: "Course Published Successfully!",
        description: `"${data.title}" has been published and is now available to students.`,
      });
      
      // Redirect to teacher dashboard
      setTimeout(() => {
        setLocation("/teacher-dashboard");
      }, 1500);
      
    } catch (error) {
      console.error('Course creation error:', error);
      toast({
        title: "Failed to publish course",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalStats = () => {
    const totalLessons = chapters.reduce((total, chapter) => total + chapter.lessons.length, 0);
    const totalDuration = chapters.reduce((total, chapter) => 
      total + chapter.lessons.reduce((chapterTotal, lesson) => 
        chapterTotal + (lesson.videoDuration || 0), 0
      ), 0
    );
    const videoLessons = chapters.reduce((total, chapter) => 
      total + chapter.lessons.filter(lesson => lesson.type === 'video').length, 0
    );

    return { totalLessons, totalDuration, videoLessons };
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const stats = getTotalStats();

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <Link href="/teacher-dashboard">
            <Button variant="ghost" className="mb-4" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to </span>Dashboard
            </Button>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Create New Course</h1>
              <p className="text-sm lg:text-base text-muted-foreground mt-1 lg:mt-2">
                Build an engaging course with videos, lessons, and interactive content
              </p>
            </div>
            <Badge variant="secondary" className="text-xs w-fit">Draft</Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:gap-4 mb-6">
          <Badge variant="outline" className="text-xs">
            {chapters.length} chapters
          </Badge>
          <Badge variant="outline" className="text-xs">
            {stats.totalLessons} lessons
          </Badge>
          {stats.totalDuration > 0 && (
            <Badge variant="outline" className="text-xs">
              {formatDuration(stats.totalDuration)} total
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 lg:space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
            <TabsTrigger value="details" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm p-2 lg:p-3">
              <Settings className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden sm:inline">Course </span>Details
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm p-2 lg:p-3">
              <Video className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden sm:inline">Content & </span>Chapters
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm p-2 lg:p-3 hidden lg:flex">
              <Users className="h-3 w-3 lg:h-4 lg:w-4" />
              Student Management
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm p-2 lg:p-3 hidden lg:flex">
              <Eye className="h-3 w-3 lg:h-4 lg:w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 lg:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                  <BookOpen className="h-4 w-4 lg:h-5 lg:w-5" />
                  Basic Course Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 lg:space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Course Title</Label>
                      <Input
                        id="title"
                        {...register("title")}
                        placeholder="e.g., Complete React Development Course"
                        data-testid="input-title"
                      />
                      {errors.title && (
                        <p className="text-sm text-destructive">{errors.title.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select onValueChange={(value) => setValue("category", value)}>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="programming">Programming</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="photography">Photography</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="health">Health & Fitness</SelectItem>
                          <SelectItem value="language">Language</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-destructive">{errors.category.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Course Description</Label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      placeholder="Describe what students will learn in this course..."
                      rows={4}
                      data-testid="textarea-description"
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (USD)</Label>
                      <Input
                        id="price"
                        {...register("price")}
                        placeholder="99.00"
                        type="number"
                        step="0.01"
                        data-testid="input-price"
                      />
                      {errors.price && (
                        <p className="text-sm text-destructive">{errors.price.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <ImageUpload
                        label="Course Cover Image (Optional)"
                        onImageUploaded={(url) => setValue("coverImage", url)}
                        currentImageUrl={watchedValues.coverImage}
                        maxSizeInMB={5}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Payment Methods Section */}
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-lg">Payment Methods</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Configure how students can pay for your course. Add at least one payment method.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="instapayNumber">InstaPay Number (Optional)</Label>
                          <Input
                            id="instapayNumber"
                            {...register("instapayNumber")}
                            placeholder="e.g., 01234567890"
                            data-testid="input-instapay"
                          />
                          <p className="text-xs text-muted-foreground">
                            Students can pay using InstaPay to this number
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="vodafoneCashNumber">Vodafone Cash Number (Optional)</Label>
                          <Input
                            id="vodafoneCashNumber"
                            {...register("vodafoneCashNumber")}
                            placeholder="e.g., 01012345678"
                            data-testid="input-vodafone-cash"
                          />
                          <p className="text-xs text-muted-foreground">
                            Students can pay using Vodafone Cash to this number
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentInstructions">Payment Instructions (Optional)</Label>
                        <Textarea
                          id="paymentInstructions"
                          {...register("paymentInstructions")}
                          placeholder="Provide detailed payment instructions for students..."
                          rows={3}
                          data-testid="textarea-payment-instructions"
                        />
                        <p className="text-xs text-muted-foreground">
                          Additional instructions to help students complete their payment
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      onClick={() => setActiveTab("content")}
                      className="flex items-center gap-2"
                    >
                      Next: Add Content
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <ChapterManager 
              chapters={chapters} 
              onChaptersChange={setChapters}
              courseId={courseId || ""}
            />
            
            <div className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => setActiveTab("details")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Details
              </Button>
              <Button 
                onClick={() => setActiveTab("students")}
                className="flex items-center gap-2"
              >
                Next: Student Settings
                <Users className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Student Management Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Student Management</h3>
                  <p className="text-muted-foreground mb-6">
                    Once your course is published, you'll be able to track student progress,
                    view enrollment statistics, and manage student access here.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Track Progress</h4>
                      <p className="text-muted-foreground">Monitor how students are progressing through your course content</p>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">View Analytics</h4>
                      <p className="text-muted-foreground">Get insights into completion rates and engagement metrics</p>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Manage Access</h4>
                      <p className="text-muted-foreground">Control student enrollment and course access permissions</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => setActiveTab("content")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Content
              </Button>
              <Button 
                onClick={() => setActiveTab("preview")}
                className="flex items-center gap-2"
              >
                Preview Course
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Course Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {watchedValues.title ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg">
                      <h2 className="text-2xl font-bold mb-2">{watchedValues.title}</h2>
                      <p className="text-muted-foreground mb-4">{watchedValues.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge>{watchedValues.category}</Badge>
                        <span className="font-semibold">${watchedValues.price}</span>
                        <span>{stats.totalLessons} lessons</span>
                        {stats.totalDuration > 0 && (
                          <span>{formatDuration(stats.totalDuration)} total duration</span>
                        )}
                      </div>
                    </div>

                    {chapters.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Course Content</h3>
                        <div className="space-y-3">
                          {chapters.map((chapter, index) => (
                            <div key={chapter.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">Chapter {index + 1}: {chapter.title}</h4>
                                <Badge variant="outline">
                                  {chapter.lessons.length} lessons
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{chapter.description}</p>
                              <div className="space-y-2">
                                {chapter.lessons.map((lesson, lessonIndex) => (
                                  <div key={lesson.id} className="flex items-center gap-3 text-sm bg-muted/30 p-2 rounded">
                                    {lesson.type === 'video' ? (
                                      <Video className="h-4 w-4 text-primary" />
                                    ) : (
                                      <BookOpen className="h-4 w-4 text-secondary" />
                                    )}
                                    <span>{lessonIndex + 1}. {lesson.title}</span>
                                    {lesson.videoDuration && (
                                      <span className="text-muted-foreground ml-auto">
                                        {formatDuration(lesson.videoDuration)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center pt-6">
                      <Button
                        onClick={async (e) => {
                          e.preventDefault();
                          console.log('Publish button clicked');
                          console.log('Form data:', watchedValues);
                          console.log('Chapters:', chapters);
                          
                          // Trigger form validation by attempting to submit with empty handler
                          let formIsValid = true;
                          try {
                            await handleSubmit(() => {
                              // Empty success handler - we just want to trigger validation
                            }, (errors) => {
                              // If there are validation errors, form is invalid
                              formIsValid = false;
                              console.log('Form validation errors:', errors);
                            })();
                          } catch (error) {
                            formIsValid = false;
                          }
                          
                          if (!formIsValid) {
                            // If form is invalid, show validation errors and switch to details tab
                            console.log('Form validation failed');
                            setActiveTab("details");
                            return;
                          }
                          
                          // Check if we have chapters
                          if (chapters.length === 0) {
                            toast({
                              title: "No Content Added",
                              description: "Please add at least one chapter with lessons before publishing.",
                              variant: "destructive",
                            });
                            setActiveTab("content");
                            return;
                          }
                          
                          // If all validations pass, submit the form
                          handleSubmit(onSubmit)();
                        }}
                        disabled={isLoading || chapters.length === 0}
                        className="flex items-center gap-2 px-8"
                        size="lg"
                      >
                        {isLoading ? (
                          "Creating Course..."
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Publish Course
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Eye className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Course Details Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Fill in the course details and add some content to see the preview
                    </p>
                    <Button onClick={() => setActiveTab("details")}>
                      Go to Course Details
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="flex justify-start">
              <Button 
                variant="outline"
                onClick={() => setActiveTab("students")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Student Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
