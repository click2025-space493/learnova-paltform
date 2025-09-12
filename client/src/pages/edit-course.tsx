import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Eye, Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import CourseContentManager from "@/components/course-content-manager";

const editCourseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  price: z.string().min(1, "Price is required"),
  coverImage: z.string().optional(),
});

type EditCourseForm = z.infer<typeof editCourseSchema>;

export default function EditCourse() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { id: courseId } = useParams();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditCourseForm>({
    resolver: zodResolver(editCourseSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      price: "",
      coverImage: "",
    },
  });

  // Fetch course data
  const { data: course, isLoading: courseLoading, error } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID is required');
      
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
          teacher_id,
          created_at,
          updated_at
        `)
        .eq('id', courseId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  // Update form when course data loads
  useEffect(() => {
    if (course) {
      form.reset({
        title: course.title,
        description: course.description,
        category: course.category,
        price: course.price.toString(),
        coverImage: course.cover_image_url || "",
      });
    }
  }, [course, form]);

  // Check authorization
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please sign in to edit courses.",
        variant: "destructive",
      });
      setLocation("/signin");
      return;
    }

    if (!authLoading && user?.role !== 'teacher' && user?.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Only teachers can edit courses.",
        variant: "destructive",
      });
      setLocation("/");
      return;
    }

    if (course && user && course.teacher_id !== user.id && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You can only edit your own courses.",
        variant: "destructive",
      });
      setLocation("/teacher-dashboard");
      return;
    }
  }, [authLoading, isAuthenticated, user, course, toast, setLocation]);

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async (data: EditCourseForm) => {
      if (!courseId) throw new Error('Course ID is required');
      
      const { error } = await supabase
        .from('courses')
        .update({
          title: data.title,
          description: data.description,
          category: data.category,
          price: parseFloat(data.price),
          cover_image_url: data.coverImage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', courseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      toast({
        title: "Course Updated",
        description: "Your course has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error('Update course error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update course. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async () => {
      if (!courseId) throw new Error('Course ID is required');
      
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      toast({
        title: "Course Deleted",
        description: "Your course has been successfully deleted.",
      });
      setLocation("/teacher-dashboard");
    },
    onError: (error) => {
      console.error('Delete course error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: EditCourseForm) => {
    setIsSubmitting(true);
    try {
      await updateCourseMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      deleteCourseMutation.mutate();
    }
  };

  if (authLoading || courseLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-8" />
            <div className="h-96 bg-muted rounded-lg" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Course Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The course you're looking for doesn't exist or you don't have permission to edit it.
            </p>
            <Button onClick={() => setLocation("/teacher-dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/teacher-dashboard")}
            className="mb-4"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to </span>Dashboard
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Edit Course</h1>
              <p className="text-sm lg:text-base text-muted-foreground mt-1 lg:mt-2">
                Update your course details and content
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={course?.is_published ? "default" : "secondary"} className="text-xs">
                {course?.is_published ? "Published" : "Draft"}
              </Badge>
              <Button
                variant="outline"
                onClick={() => setLocation(`/courses/${courseId}`)}
                size="sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl">Course Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 lg:space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter course title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe what students will learn"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="programming">Programming</SelectItem>
                              <SelectItem value="design">Design</SelectItem>
                              <SelectItem value="business">Business</SelectItem>
                              <SelectItem value="marketing">Marketing</SelectItem>
                              <SelectItem value="photography">Photography</SelectItem>
                              <SelectItem value="music">Music</SelectItem>
                              <SelectItem value="health">Health & Fitness</SelectItem>
                              <SelectItem value="language">Language</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="coverImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image</FormLabel>
                        <FormControl>
                          <ImageUpload
                            onImageUploaded={(url: string) => {
                              field.onChange(url);
                              toast({
                                title: "Image uploaded successfully",
                                description: "Your course cover image has been updated.",
                              });
                            }}
                            currentImageUrl={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSubmitting || updateCourseMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl">Course Content</CardTitle>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
              <CourseContentManager courseId={courseId || ''} />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
