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
    <div className="min-h-screen bg-[#020617] relative overflow-hidden flex flex-col">
      <Navigation />

      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 pt-40 w-full">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => setLocation("/teacher-dashboard")}
              className="mb-8 p-0 h-auto text-white/30 hover:text-blue-400 font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-transparent group"
            >
              <ArrowLeft className="h-4 w-4 mr-3 group-hover:-translate-x-2 transition-transform" />
              REVERT TO DASHBOARD
            </Button>
            <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter uppercase leading-tight">MODIFY <span className="text-glow-blue text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 italic">STREAM.</span></h1>
            <p className="text-blue-100/40 font-medium tracking-tight uppercase text-xs mt-2">Adjusting Knowledge Parameters // ID-{courseId?.slice(0, 8)}</p>
          </div>

          <div className="flex items-center gap-4">
            <Badge className={`border-none text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${course?.is_published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {course?.is_published ? "SYSTEM LIVE" : "DRAFT STATE"}
            </Badge>
            <Button
              variant="outline"
              className="h-12 px-6 rounded-xl border-white/10 bg-white/5 text-white/60 font-black text-[10px] uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
              onClick={() => setLocation(`/courses/${courseId}`)}
            >
              <Eye className="h-4 w-4 mr-2" />
              PREVIEW UPLINK
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Form Column */}
          <div className="lg:col-span-12 space-y-12">
            <div className="rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden shadow-2xl neon-border-blue">
              <div className="p-10 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-4">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  CORE ARCHITECTURE
                </h2>
                <Button
                  variant="ghost"
                  onClick={handleDelete}
                  className="text-red-400/40 hover:text-red-400 hover:bg-red-400/10 rounded-xl font-black text-[10px] uppercase tracking-widest"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  DESTRUCT ENTITY
                </Button>
              </div>
              <div className="p-10 lg:p-12">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <FormLabel className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">COURSE DESIGNATION</FormLabel>
                          <FormControl>
                            <Input placeholder="ENTER STREAM TITLE..." {...field} className="h-16 bg-white/5 border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest focus-visible:ring-blue-500/20 placeholder:text-white/10" />
                          </FormControl>
                          <FormMessage className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <FormLabel className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">STREAM SYNOPSIS</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="DESCRIBE THE KNOWLEDGE TRANSMISSION..."
                              className="min-h-[160px] bg-white/5 border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest focus-visible:ring-blue-500/20 placeholder:text-white/10 p-6"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2" />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem className="space-y-4">
                            <FormLabel className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">CLASSIFICATION</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-16 bg-white/5 border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest focus:ring-blue-500/20">
                                  <SelectValue placeholder="SELECT SECTOR" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-[#0f172a] border-white/10 text-white font-black text-[10px] uppercase">
                                <SelectItem value="programming" className="focus:bg-blue-500/20">Programming</SelectItem>
                                <SelectItem value="design" className="focus:bg-blue-500/20">Design</SelectItem>
                                <SelectItem value="business" className="focus:bg-blue-500/20">Business</SelectItem>
                                <SelectItem value="marketing" className="focus:bg-blue-500/20">Marketing</SelectItem>
                                <SelectItem value="photography" className="focus:bg-blue-500/20">Photography</SelectItem>
                                <SelectItem value="music" className="focus:bg-blue-500/20">Music</SelectItem>
                                <SelectItem value="health" className="focus:bg-blue-500/20">Health & Fitness</SelectItem>
                                <SelectItem value="language" className="focus:bg-blue-500/20">Language</SelectItem>
                                <SelectItem value="other" className="focus:bg-blue-500/20">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem className="space-y-4">
                            <FormLabel className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">ACCESS FEE ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                                className="h-16 bg-white/5 border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest focus-visible:ring-blue-500/20 placeholder:text-white/10"
                              />
                            </FormControl>
                            <FormMessage className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="coverImage"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <FormLabel className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">VISUAL IDENTIFIER</FormLabel>
                          <FormControl>
                            <ImageUpload
                              onImageUploaded={(url: string) => {
                                field.onChange(url);
                                toast({
                                  title: "UPLINK SUCCESS",
                                  description: "Visual identifier has been synchronized.",
                                });
                              }}
                              currentImageUrl={field.value}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2" />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end pt-6">
                      <Button
                        type="submit"
                        disabled={isSubmitting || updateCourseMutation.isPending}
                        className="h-16 px-12 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-blue-400 hover:text-white transition-all border-none"
                      >
                        <Save className="h-4 w-4 mr-3" />
                        {isSubmitting ? "SYNCING..." : "COMMIT CHANGES"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>

            <div className="rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden shadow-2xl neon-border-purple">
              <div className="p-10 border-b border-white/10">
                <h2 className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-4">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                  CONTENT ARCHITECTURE
                </h2>
              </div>
              <div className="p-10 lg:p-12">
                <CourseContentManager courseId={courseId || ''} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
