import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import CourseCard from "@/components/course-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { useState } from "react";

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Courses");

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          category,
          price,
          cover_image_url,
          created_at,
          teacher:users!courses_teacher_id_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to handle array responses
      const transformedData = data?.map(course => ({
        ...course,
        teacher: Array.isArray(course.teacher) ? course.teacher[0] : course.teacher
      })) || [];
      
      return transformedData;
    },
  });

  const categories = ["All Courses", "Programming", "Design", "Business", "Marketing"];

  const filteredCourses = courses?.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All Courses" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (error) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Error Loading Courses</h1>
            <p className="text-muted-foreground">
              We encountered an error while loading courses. Please try again later.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Discover Amazing Courses
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse through thousands of high-quality courses taught by expert instructors.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 mb-4 lg:mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 lg:h-11"
                data-testid="input-search-courses"
              />
            </div>
            <Button variant="outline" className="w-full sm:w-auto h-10 lg:h-11">
              <Filter className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Advanced </span>Filters
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 lg:gap-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                data-testid={`button-category-${category.toLowerCase().replace(' ', '-')}`}
                className="text-xs lg:text-sm px-3 lg:px-4 h-8 lg:h-9"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border animate-pulse">
                <div className="w-full h-40 sm:h-48 bg-muted" />
                <div className="p-4 sm:p-6">
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-6 bg-muted rounded mb-2" />
                  <div className="h-12 sm:h-16 bg-muted rounded mb-4" />
                  <div className="flex justify-between">
                    <div className="h-4 bg-muted rounded w-20" />
                    <div className="h-6 bg-muted rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses && filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {filteredCourses.map((course: any) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-foreground mb-2">No courses found</h2>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== "All Courses" 
                ? "Try adjusting your search criteria or filters."
                : "No courses are available at the moment."}
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
