import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateCourse } from "@/hooks/useSupabase";

const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  price: z.string().min(1, "Price is required"),
  coverImage: z.string().optional(),
});

type CreateCourseForm = z.infer<typeof createCourseSchema>;

export default function CreateCourse() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const createCourseMutation = useCreateCourse();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCourseForm>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      price: "",
      coverImage: "",
    },
  });

  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("Unauthorized - redirecting to login");
      setTimeout(() => {
        setLocation("/signin");
      }, 500);
      return;
    }

    if (!isLoading && user?.role !== 'teacher' && user?.role !== 'admin') {
      console.log("Access denied - not a teacher");
      setLocation("/");
      return;
    }
  }, [isAuthenticated, isLoading, user, setLocation]);

  const onSubmit = async (data: CreateCourseForm) => {
    try {
      await createCourseMutation.mutateAsync({
        title: data.title,
        description: data.description,
        category: data.category,
        price: parseFloat(data.price),
        cover_image_url: data.coverImage || null,
        is_published: false
      });
      reset();
    } catch (error) {
      console.error("Failed to create course:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-8" />
            <div className="space-y-6">
              <div className="h-12 bg-muted rounded" />
              <div className="h-32 bg-muted rounded" />
              <div className="h-12 bg-muted rounded" />
              <div className="h-12 bg-muted rounded" />
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
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 pt-40 w-full">
        <div className="mb-16">
          <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
            KNOWLEDGE CREATION CONSOLE
          </Badge>
          <h1 className="text-4xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-tight">ORGANIZE <span className="text-glow-purple text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 italic">SYLLABUS.</span></h1>
          <p className="text-blue-100/40 font-medium tracking-tight uppercase text-xs mt-2">Initialize Global Knowledge Stream // Access Level: Educator</p>
        </div>

        <div className="rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden shadow-2xl neon-border-blue">
          <div className="p-10 border-b border-white/10">
            <h2 className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-4">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              COURSE PARAMETERS
            </h2>
          </div>
          <div className="p-10 lg:p-12">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              <div className="space-y-4">
                <Label htmlFor="title" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">COURSE DESIGNATION *</Label>
                <Input
                  id="title"
                  placeholder="E.G., NEURAL NETWORK ARCHITECTURES..."
                  {...register("title")}
                  className="h-16 bg-white/5 border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest focus-visible:ring-blue-500/20 placeholder:text-white/10"
                  data-testid="input-course-title"
                />
                {errors.title && (
                  <p className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <Label htmlFor="description" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">STREAM SYNOPSIS *</Label>
                <Textarea
                  id="description"
                  placeholder="TRANSMIT THE CORE LEARNING OBJECTIVES..."
                  className="min-h-[160px] bg-white/5 border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest focus-visible:ring-blue-500/20 placeholder:text-white/10 p-6"
                  {...register("description")}
                  data-testid="textarea-course-description"
                />
                {errors.description && (
                  <p className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <Label htmlFor="category" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">CLASSIFICATION *</Label>
                  <select
                    {...register("category")}
                    className="flex h-16 w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-2 text-xs font-black uppercase tracking-widest text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 appearance-none cursor-pointer"
                    data-testid="select-course-category"
                  >
                    <option value="" className="bg-[#0f172a] text-white/20">SELECT SECTOR</option>
                    <option value="Programming" className="bg-[#0f172a]">Programming</option>
                    <option value="Design" className="bg-[#0f172a]">Design</option>
                    <option value="Business" className="bg-[#0f172a]">Business</option>
                    <option value="Marketing" className="bg-[#0f172a]">Marketing</option>
                    <option value="Data Science" className="bg-[#0f172a]">Data Science</option>
                    <option value="Photography" className="bg-[#0f172a]">Photography</option>
                    <option value="Music" className="bg-[#0f172a]">Music</option>
                    <option value="Other" className="bg-[#0f172a]">Other</option>
                  </select>
                  {errors.category && (
                    <p className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2">{errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <Label htmlFor="price" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">ACCESS FEE (USD) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("price")}
                    className="h-16 bg-white/5 border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest focus-visible:ring-blue-500/20 placeholder:text-white/10"
                    data-testid="input-course-price"
                  />
                  {errors.price && (
                    <p className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2">{errors.price.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="coverImage" className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">VISUAL UPLINK (OPTIONAL)</Label>
                <Input
                  id="coverImage"
                  placeholder="HTTPS://CDN.LEARNOVA.IO/ASSET.JPG"
                  {...register("coverImage")}
                  className="h-16 bg-white/5 border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest focus-visible:ring-blue-500/20 placeholder:text-white/10"
                  data-testid="input-course-image"
                />
                {errors.coverImage && (
                  <p className="text-red-400 text-[10px] font-black uppercase tracking-widest ml-2">{errors.coverImage.message}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-6 pt-6">
                <Button
                  type="submit"
                  disabled={createCourseMutation.isPending}
                  className="h-16 flex-1 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-blue-400 hover:text-white transition-all border-none"
                  data-testid="button-create-course"
                >
                  {createCourseMutation.isPending ? "INITIALIZING..." : "EXECUTE DEPLOYMENT"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setLocation("/teacher-dashboard")}
                  className="h-16 px-10 rounded-2xl text-white/40 font-black text-xs uppercase tracking-[0.3em] hover:text-white hover:bg-white/5 transition-all"
                  data-testid="button-cancel-create"
                >
                  ABORT
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
