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
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create New Course</h1>
          <p className="text-muted-foreground">
            Share your knowledge with students around the world
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Complete Web Development Bootcamp"
                  {...register("title")}
                  data-testid="input-course-title"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a clear, descriptive title for your course
                </p>
              </div>

              <div>
                <Label htmlFor="description">Course Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what students will learn in your course..."
                  className="min-h-[120px]"
                  {...register("description")}
                  data-testid="textarea-course-description"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Explain what students will gain from taking your course
                </p>
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <select 
                  {...register("category")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  data-testid="select-course-category"
                >
                  <option value="">Select a category</option>
                  <option value="Programming">Programming</option>
                  <option value="Design">Design</option>
                  <option value="Business">Business</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Photography">Photography</option>
                  <option value="Music">Music</option>
                  <option value="Other">Other</option>
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("price")}
                  data-testid="input-course-price"
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Set to 0.00 for free courses
                </p>
              </div>

              <div>
                <Label htmlFor="coverImage">Cover Image URL (Optional)</Label>
                <Input
                  id="coverImage"
                  placeholder="https://example.com/image.jpg"
                  {...register("coverImage")}
                  data-testid="input-course-image"
                />
                {errors.coverImage && (
                  <p className="text-red-500 text-sm mt-1">{errors.coverImage.message}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Add a cover image to make your course more appealing
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={createCourseMutation.isPending}
                  data-testid="button-create-course"
                >
                  {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/teacher-dashboard")}
                  data-testid="button-cancel-create"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
