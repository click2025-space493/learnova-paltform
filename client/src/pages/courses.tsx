import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import CourseCard from "@/components/course-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-screen bg-[#020617] relative overflow-hidden flex flex-col">
      <Navigation />

      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative z-10 w-full pt-40">
        <div className="text-center mb-24">
          <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
            EXPLORE THE KNOWLEDGE NEXUS
          </Badge>
          <h1 className="text-5xl lg:text-8xl font-black text-white mb-8 tracking-tighter uppercase">
            THE <span className="text-glow-purple text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 italic">CURRICULUM.</span>
          </h1>
          <p className="text-xl text-blue-100/40 font-medium max-w-2xl mx-auto leading-relaxed">
            Expand your horizon with high-fidelity <span className="text-blue-400 font-black tracking-widest uppercase text-sm">Data Streams</span> taught by global industry architects.
          </p>
        </div>

        {/* Search and Filter UI */}
        <div className="mb-24">
          <div className="bg-white/5 p-2 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-2xl flex flex-col md:flex-row items-center gap-2 max-w-4xl mx-auto mb-12 group focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-white/20 h-5 w-5 group-focus-within:text-blue-400 transition-colors" />
              <Input
                placeholder="PROBE THE ARCHIVES..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-16 h-16 bg-transparent border-none text-white font-black text-xs uppercase tracking-widest focus-visible:ring-0 placeholder:text-white/10"
                data-testid="input-search-courses"
              />
            </div>
            <Button className="h-14 px-10 rounded-[1.8rem] bg-blue-500 hover:bg-blue-400 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 w-full md:w-auto border-none transition-all">
              EXECUTE SEARCH
            </Button>
          </div>

          {/* Category Scroller */}
          <div className="flex flex-wrap justify-center gap-4 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                variant="outline"
                onClick={() => setSelectedCategory(category)}
                data-testid={`button-category-${category.toLowerCase().replace(' ', '-')}`}
                className={`h-12 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10 ${selectedCategory === category
                    ? "bg-purple-500 text-white border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-105"
                    : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
                  }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Course Grid */}
        <div className="relative">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-white/5 rounded-[3rem] animate-pulse border border-white/5" />
              ))}
            </div>
          ) : filteredCourses && filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
              {filteredCourses.map((course: any) => (
                <div key={course.id} className="group cursor-pointer">
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 rounded-[4rem] bg-white/5 border border-dashed border-white/10 backdrop-blur-3xl max-w-2xl mx-auto flex flex-col items-center">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-10 border border-white/10 shadow-inner group overflow-hidden">
                <Search className="h-10 w-10 text-white/5 group-hover:text-blue-400/20 transition-colors" />
              </div>
              <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-tighter">DATA STREAM NOT FOUND</h2>
              <p className="text-lg text-blue-100/40 font-medium mb-12 max-w-sm">
                {searchTerm || selectedCategory !== "All Courses"
                  ? "Neural probe failed to find matches in current coordinates. Adjust parameters."
                  : "The Nexus curriculum is currently synchronizing. Re-uplink shortly."}
              </p>
              <Button
                variant="outline"
                onClick={() => { setSearchTerm(""); setSelectedCategory("All Courses"); }}
                className="h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] px-10 border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                INITIALIZED RESET
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
