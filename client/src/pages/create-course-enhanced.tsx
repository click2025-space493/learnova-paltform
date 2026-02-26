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
import { ArrowLeft, BookOpen, Video, Users, Settings, Save, Eye, TrendingUp } from "lucide-react";

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
    youtube_video_id?: string;
    youtube_video_url?: string;
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
              youtube_video_id: lesson.youtube_video_id,
              youtube_video_url: lesson.youtube_video_url,
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
    <div className="min-h-screen bg-[#020617] relative overflow-hidden flex flex-col">
      <Navigation />

      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 pt-40 w-full">
        <div className="mb-12">
          <Link href="/teacher-dashboard">
            <Button variant="ghost" className="mb-6 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-xl" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              RETURNING TO COMMAND CENTER
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <Badge className="bg-purple-500/10 text-purple-400 border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
                KNOWLEDGE DEPLOYMENT PROTOCOL
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter uppercase leading-tight">
                CONSTRUCT <span className="text-glow-purple text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 italic">SYSTEM.</span>
              </h1>
              <p className="text-blue-100/40 font-medium tracking-tight uppercase text-[10px] tracking-widest max-w-xl">
                Architecting a new educational node on the global neural network. All assets must be verified.
              </p>
            </div>
            <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <div className="px-4 border-r border-white/5">
                <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">CHAPTERS</p>
                <p className="text-xl font-black text-white tracking-widest">{chapters.length}</p>
              </div>
              <div className="px-4 border-r border-white/5">
                <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-1">LESSONS</p>
                <p className="text-xl font-black text-white tracking-widest">{stats.totalLessons}</p>
              </div>
              <div className="px-4">
                <p className="text-[8px] font-black text-cyan-400 uppercase tracking-widest mb-1">RUNTIME</p>
                <p className="text-xl font-black text-white tracking-widest">{formatDuration(stats.totalDuration)}</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
          <TabsList className="flex w-full bg-white/5 border border-white/10 p-1.5 rounded-3xl backdrop-blur-3xl h-auto">
            <TabsTrigger value="details" className="flex-1 rounded-2xl py-4 flex items-center justify-center gap-3 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all">
              <Settings className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">CONFIGURATION</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex-1 rounded-2xl py-4 flex items-center justify-center gap-3 data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all">
              <Video className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">CONTENT GRID</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="flex-1 rounded-2xl py-4 flex items-center justify-center gap-3 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all">
              <Users className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">ACCESS NODES</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex-1 rounded-2xl py-4 flex items-center justify-center gap-3 data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all">
              <Eye className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">SYSTEM VIEW</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                <div className="rounded-[3rem] bg-white/5 border border-white/10 p-10 lg:p-12 backdrop-blur-3xl shadow-2xl space-y-10">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">PRIMARY CORE DATA</h3>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <Label htmlFor="title" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">SYSTEM TITULAR</Label>
                        <Input
                          id="title"
                          {...register("title")}
                          placeholder="ASSIGN UNIQUE DESIGNATION..."
                          className="h-16 bg-white/5 border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest focus-visible:ring-blue-500/20 placeholder:text-white/10"
                        />
                        {errors.title && (
                          <p className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2">{errors.title.message}</p>
                        )}
                      </div>

                      <div className="space-y-4">
                        <Label htmlFor="category" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">GRID CLASSIFICATION</Label>
                        <Select onValueChange={(value) => setValue("category", value)}>
                          <SelectTrigger className="h-16 bg-white/5 border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest focus-visible:ring-blue-500/20">
                            <SelectValue placeholder="SELECT CATEGORY..." />
                          </SelectTrigger>
                          <SelectContent className="bg-[#020617] border-white/10 rounded-2xl">
                            {['PROGRAMMING', 'DESIGN', 'BUSINESS', 'MARKETING', 'PHOTOGRAPHY', 'MUSIC', 'HEALTH', 'LANGUAGE'].map(cat => (
                              <SelectItem key={cat} value={cat.toLowerCase()} className="text-[10px] font-black text-white uppercase tracking-widest focus:bg-blue-500 focus:text-white rounded-xl py-3">{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.category && (
                          <p className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2">{errors.category.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="description" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">FUNCTIONAL OVERVIEW</Label>
                      <Textarea
                        id="description"
                        {...register("description")}
                        placeholder="DEFINE SYSTEM CORE OBJECTIVES..."
                        className="bg-white/5 border-white/10 rounded-3xl text-white font-medium text-sm p-6 focus-visible:ring-blue-500/20 placeholder:text-white/10 transition-all min-h-[160px]"
                      />
                      {errors.description && (
                        <p className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2">{errors.description.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <Label htmlFor="price" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">ACCESS CREDIT PRICE (USD)</Label>
                        <Input
                          id="price"
                          {...register("price")}
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                          className="h-16 bg-white/5 border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest focus-visible:ring-blue-500/20 placeholder:text-white/10"
                        />
                        {errors.price && (
                          <p className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2">{errors.price.message}</p>
                        )}
                      </div>

                      <div className="space-y-4">
                        <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">IDENTITY VISUAL</Label>
                        <ImageUpload
                          onImageUploaded={(url) => setValue("coverImage", url)}
                          currentImageUrl={watchedValues.coverImage}
                          maxSizeInMB={5}
                          className="w-full !rounded-2xl !bg-white/5 !border-white/10"
                        />
                      </div>
                    </div>
                  </form>
                </div>

                <div className="rounded-[3rem] bg-white/5 border border-white/10 p-10 lg:p-12 backdrop-blur-3xl shadow-2xl space-y-10 border-dashed">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                      <Settings className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter">FINANCIAL UPLINK</h3>
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Configure primary credit transfer channels.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <Label htmlFor="instapayNumber" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">INSTAPAY IDENTIFIER</Label>
                      <Input
                        id="instapayNumber"
                        {...register("instapayNumber")}
                        placeholder="ENTER IDENTIFIER..."
                        className="h-16 bg-emerald-500/5 border-emerald-500/20 rounded-2xl text-white font-black text-xs uppercase tracking-widest focus-visible:ring-emerald-500/20 placeholder:text-emerald-500/20"
                      />
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="vodafoneCashNumber" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">MOBILE WALLET COORDINATES</Label>
                      <Input
                        id="vodafoneCashNumber"
                        {...register("vodafoneCashNumber")}
                        placeholder="ENTER COORDINATES..."
                        className="h-16 bg-red-500/5 border-red-500/20 rounded-2xl text-white font-black text-xs uppercase tracking-widest focus-visible:ring-red-500/20 placeholder:text-red-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="paymentInstructions" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">TRANSFER PROTOCOL INSTRUCTIONS</Label>
                    <Textarea
                      id="paymentInstructions"
                      {...register("paymentInstructions")}
                      placeholder="DEFINE DETAILED TRANSFER STEPS..."
                      rows={3}
                      className="bg-white/5 border-white/10 rounded-3xl text-white font-medium text-sm p-6 focus-visible:ring-blue-500/20 placeholder:text-white/10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="rounded-[2.5rem] bg-blue-500 border border-blue-400 p-8 text-white space-y-6 shadow-[0_0_40px_rgba(59,130,246,0.3)]">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black uppercase tracking-tight">READY TO DEPLOY?</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-relaxed mt-2">
                      Once primary configuration is complete, you can begin constructing the knowledge grid.
                    </p>
                  </div>
                  <Button
                    onClick={() => setActiveTab("content")}
                    className="w-full h-14 rounded-2xl bg-white text-blue-600 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all border-none"
                  >
                    INITIALIZE CONTENT GRID →
                  </Button>
                </div>

                <div className="rounded-[2.5rem] bg-white/5 border border-white/10 p-8 space-y-6 backdrop-blur-3xl">
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">SYSTEM INTEGRITY</h4>
                  <div className="space-y-4">
                    {[
                      { label: 'SCHEMA VALIDATION', status: 'ACTIVE' },
                      { label: 'NEURAL SYNC', status: 'READY' },
                      { label: 'UPLINK STATUS', status: 'ENCRYPTED' }
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between border-b border-white/5 pb-4">
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{item.label}</span>
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full">{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ChapterManager
              chapters={chapters}
              onChaptersChange={setChapters}
              courseId={courseId || ""}
            />

            <div className="flex justify-between items-center bg-white/5 border border-white/10 p-8 rounded-[3rem] backdrop-blur-3xl">
              <Button
                variant="outline"
                onClick={() => setActiveTab("details")}
                className="h-12 border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/5"
              >
                ← CORE CONFIG
              </Button>
              <Button
                onClick={() => setActiveTab("students")}
                className="h-14 px-10 rounded-2xl bg-purple-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-purple-400 transition-all border-none shadow-[0_0_30px_rgba(168,85,247,0.3)]"
              >
                SYNC ACCESS NODES →
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="rounded-[4rem] bg-white/5 border border-white/10 p-20 text-center backdrop-blur-3xl shadow-2xl border-dashed">
              <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-10">
                <Users className="h-10 w-10 text-cyan-400" />
              </div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 italic">ACCESS CONTROL <span className="text-glow-blue">INACTIVE.</span></h1>
              <p className="text-blue-100/40 font-black uppercase text-xs tracking-[0.2em] max-w-sm mx-auto mb-12">
                User management metrics will initialize upon system deployment.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                {[
                  { title: 'TRACK PROGRESS', icon: TrendingUp, color: 'blue' },
                  { title: 'ANALYZE DATA', icon: Users, color: 'purple' },
                  { title: 'MANAGE ACCESS', icon: Settings, color: 'pink' }
                ].map(item => (
                  <div key={item.title} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-4">
                    <item.icon className="h-6 w-6 text-white/40 mx-auto" />
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">{item.title}</h4>
                    <div className="h-1 w-8 bg-white/10 mx-auto rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center bg-white/5 border border-white/10 p-8 rounded-[3rem] backdrop-blur-3xl">
              <Button
                variant="outline"
                onClick={() => setActiveTab("content")}
                className="h-12 border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/5"
              >
                ← CONTENT GRID
              </Button>
              <Button
                onClick={() => setActiveTab("preview")}
                className="h-14 px-10 rounded-2xl bg-cyan-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-all border-none shadow-[0_0_30px_rgba(6,182,212,0.3)]"
              >
                FULL SYSTEM VIEW →
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {watchedValues.title ? (
              <div className="space-y-10">
                <div className="rounded-[4rem] bg-gradient-to-br from-blue-500 to-purple-600 p-1 lg:p-1.5 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                  <div className="bg-[#020617] rounded-[3.9rem] p-12 lg:p-20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10 flex flex-col md:flex-row gap-16 items-start">
                      {watchedValues.coverImage ? (
                        <div className="w-full md:w-80 aspect-[16/10] bg-white/5 rounded-[2.5rem] overflow-hidden border border-white/10 flex-shrink-0">
                          <img src={watchedValues.coverImage} className="w-full h-full object-cover grayscale-[0.5]" onClick={() => console.log('preview image click')} />
                        </div>
                      ) : (
                        <div className="w-full md:w-80 aspect-[16/10] bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-white/10 flex-shrink-0">
                          <BookOpen className="h-12 w-12 text-white/10" />
                        </div>
                      )}

                      <div className="flex-1 space-y-8">
                        <div className="space-y-4">
                          <Badge className="bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">{watchedValues.category || 'PENDING'}</Badge>
                          <h2 className="text-4xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-tight italic">{watchedValues.title}</h2>
                          <p className="text-blue-100/40 font-medium text-lg leading-relaxed max-w-2xl">{watchedValues.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-8 items-center border-t border-white/5 pt-10">
                          <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                              <Users className="h-6 w-6 text-blue-400" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">ARCHITECT</p>
                              <p className="text-sm font-black text-white uppercase tracking-widest">{user?.name || 'UNKNOWN'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                              <TrendingUp className="h-6 w-6 text-purple-400" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">UNIT CREDIT</p>
                              <p className="text-sm font-black text-white uppercase tracking-widest">${watchedValues.price || '0.00'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                              <Video className="h-6 w-6 text-cyan-400" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">RUNTIME</p>
                              <p className="text-sm font-black text-white uppercase tracking-widest">{formatDuration(stats.totalDuration)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {chapters.length > 0 && (
                  <div className="space-y-8">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic border-l-4 border-blue-500 pl-6">CONTENT ARCHIVE</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {chapters.map((chapter, index) => (
                        <div key={chapter.id} className="rounded-[2.5rem] bg-white/5 border border-white/10 p-8 space-y-6 backdrop-blur-3xl transition-all hover:bg-white/10">
                          <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <div className="space-y-1">
                              <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">SECTOR {index + 1}</p>
                              <h4 className="text-xl font-black text-white uppercase tracking-tighter">{chapter.title}</h4>
                            </div>
                            <Badge className="bg-white/5 border border-white/10 text-white/60 text-[10px] font-black">{chapter.lessons.length} UNITS</Badge>
                          </div>

                          <div className="space-y-3">
                            {chapter.lessons.map((lesson, lessonIndex) => (
                              <div key={lesson.id} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-none">
                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/40">
                                  {lessonIndex + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-black text-white uppercase tracking-widest line-clamp-1">{lesson.title}</p>
                                </div>
                                {lesson.type === 'video' && <Video className="h-3 w-3 text-blue-400 opacity-40" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-center pt-16">
                  <Button
                    onClick={async (e) => {
                      e.preventDefault();
                      let formIsValid = true;
                      try {
                        await handleSubmit(() => { }, (errors) => {
                          formIsValid = false;
                        })();
                      } catch (error) {
                        formIsValid = false;
                      }

                      if (!formIsValid) {
                        setActiveTab("details");
                        return;
                      }

                      if (chapters.length === 0) {
                        toast({ title: "No Content Added", description: "Please add at least one chapter before publishing.", variant: "destructive" });
                        setActiveTab("content");
                        return;
                      }

                      handleSubmit(onSubmit)();
                    }}
                    disabled={isLoading || chapters.length === 0}
                    className="h-20 px-20 rounded-3xl bg-white text-black font-black text-sm uppercase tracking-[0.4em] shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:bg-blue-500 hover:text-white transition-all border-none"
                  >
                    {isLoading ? "DEPLOYING NANO-BOTS..." : "INITIALIZE FULL SYSTEM DEPLOYMENT"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-[4rem] bg-white/5 border border-white/10 p-32 text-center backdrop-blur-3xl shadow-2xl border-dashed">
                <div className="w-24 h-24 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-10 translate-y-0 animate-bounce">
                  <Eye className="h-10 w-10 text-pink-400" />
                </div>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 italic">NO DATA TO SHOW.</h1>
                <p className="text-blue-100/40 font-black uppercase text-xs tracking-[0.2em] max-w-sm mx-auto mb-12">
                  Initialize core configuration parameters to generate a live system preview.
                </p>
                <Button
                  onClick={() => setActiveTab("details")}
                  className="h-14 px-10 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-blue-400 hover:text-white transition-all border-none shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  RETURN TO CONFIG →
                </Button>
              </div>
            )}
            <div className="flex justify-start pt-10">
              <Button
                variant="outline"
                onClick={() => setActiveTab("students")}
                className="h-12 border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/5"
              >
                ← ACCESS NODES
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
