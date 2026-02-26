import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Search,
  MoreHorizontal,
  Users,
  DollarSign,
  Calendar,
  User,
  Play,
  Eye,
  CheckCircle,
  XCircle
} from "lucide-react";

interface CourseWithDetails {
  id: string;
  title: string;
  description: string;
  price: string;
  coverImageUrl?: string;
  category: string;
  status: string;
  createdAt: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  enrollmentCount: number;
  lessonCount: number;
}

export default function AdminCourses() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  // Fetch all courses with details
  const { data: courses, isLoading: coursesLoading } = useQuery<CourseWithDetails[]>({
    queryKey: ["/api/admin/courses"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Update course status mutation
  const updateCourseStatusMutation = useMutation({
    mutationFn: async ({ courseId, status }: { courseId: string; status: string }) => {
      const response = await fetch(`/api/admin/courses/${courseId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update course status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({
        title: "Success",
        description: "Course status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update course status",
        variant: "destructive",
      });
    },
  });

  // Filter courses based on search term
  const filteredCourses = courses?.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-8" />
            <div className="h-96 bg-muted rounded-lg" />
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
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 w-full pt-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <Badge className="mb-6 bg-purple-500/10 text-purple-400 border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
              CURRICULUM CONTROL // ARCHIVE
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter mb-6">PUBLICATION <span className="text-glow-blue text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">CORE.</span></h1>
            <p className="text-xl text-blue-100/40 font-medium leading-relaxed">
              Monitoring global <span className="text-blue-400 font-black uppercase tracking-widest">data streams</span> and institutional output protocols.
            </p>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20 h-4 w-4 group-focus-within:text-blue-400 transition-colors" />
            <Input
              placeholder="SCAN ARCHIVES..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 w-80 h-14 rounded-2xl bg-white/5 border-white/10 text-white font-black text-xs tracking-widest focus:ring-blue-400 focus:border-blue-400 placeholder:text-white/10"
            />
          </div>
        </div>

        {/* Course Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            { label: "STREAMS", value: courses?.length || 0, icon: BookOpen, color: "blue", border: "neon-border-blue" },
            { label: "LIVE", value: courses?.filter(c => c.status === 'published').length || 0, icon: CheckCircle, color: "green", border: "neon-border-purple" },
            { label: "NODES", value: courses?.reduce((sum, course) => sum + course.enrollmentCount, 0) || 0, icon: Users, color: "blue", border: "neon-border-blue" },
            { label: "VOLUME", value: `$${courses?.reduce((sum, course) => sum + (parseFloat(course.price) * course.enrollmentCount), 0).toLocaleString()}`, icon: DollarSign, color: "purple", border: "neon-border-purple" }
          ].map((stat, i) => (
            <div key={i} className={`p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl group hover:bg-white/10 transition-all cursor-default relative overflow-hidden ${stat.border}`}>
              <div className="flex items-center justify-between mb-8">
                <div className={`w-12 h-12 rounded-2xl bg-${stat.color === 'blue' ? 'blue' : stat.color === 'green' ? 'green' : 'purple'}-500/20 border border-${stat.color === 'blue' ? 'blue' : stat.color === 'green' ? 'green' : 'purple'}-500/20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color === 'blue' ? 'blue' : stat.color === 'green' ? 'green' : 'purple'}-400`} />
                </div>
                <div className={`text-[10px] font-black text-${stat.color}-400/40 uppercase tracking-widest`}>{stat.label}</div>
              </div>
              <div className="text-3xl font-black text-white tracking-tighter">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Courses Table Section */}
        <div className="rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden neon-border-blue">
          <div className="p-10 border-b border-white/10 flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <h3 className="text-xl font-black text-white uppercase tracking-widest">
              Publication Registry ({filteredCourses.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            {coursesLoading ? (
              <div className="p-10 space-y-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-white/5 border-white/10">
                  <TableRow className="hover:bg-transparent border-white/10">
                    <TableHead className="py-6 px-10 text-[10px] font-black text-white/40 uppercase tracking-widest">Stream</TableHead>
                    <TableHead className="py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Architect</TableHead>
                    <TableHead className="py-6 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Engagement</TableHead>
                    <TableHead className="py-6 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Value</TableHead>
                    <TableHead className="py-6 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Protocol</TableHead>
                    <TableHead className="py-6 px-10 text-right text-[10px] font-black text-white/40 uppercase tracking-widest">Override</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="py-6 px-10">
                        <div className="flex items-center gap-6">
                          <div className="h-16 w-24 bg-white/5 rounded-xl overflow-hidden border border-white/10 shadow-2xl flex-shrink-0 group-hover:scale-105 group-hover:rotate-1 transition-all">
                            {course.coverImageUrl ? (
                              <img src={course.coverImageUrl} alt={course.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-white/10" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-white uppercase tracking-wide group-hover:text-blue-400 transition-colors line-clamp-1">{course.title}</div>
                            <div className="text-[10px] font-black text-blue-400/40 uppercase tracking-[0.2em]">{course.category}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-white/10">
                            <AvatarFallback className="bg-blue-500/20 text-blue-400 text-[10px] font-black">{course.teacherName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-xs font-black text-white uppercase tracking-wider mb-0.5">{course.teacherName}</div>
                            <div className="text-[9px] font-black text-white/10 uppercase tracking-widest">{course.teacherEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-6 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-black text-white">{course.enrollmentCount}</span>
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">NODES</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-6 text-right">
                        <div className="font-black text-blue-400 text-lg">${course.price}</div>
                      </TableCell>
                      <TableCell className="py-6 text-center">
                        <Badge className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border-none ${course.status === 'published' ? 'bg-green-500/10 text-green-400' :
                          course.status === 'draft' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-red-500/10 text-red-400'
                          }`}>
                          {course.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-6 px-10 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white/10 text-white/40">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#020617] border-white/10 rounded-2xl shadow-2xl p-2 min-w-[200px]">
                            <DropdownMenuItem className="p-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-white/60 focus:bg-white/10 focus:text-white cursor-pointer" onClick={() => setLocation(`/courses/${course.id}`)}>
                              <Eye className="h-4 w-4 mr-3" />
                              REVIEWS STREAM
                            </DropdownMenuItem>
                            {course.status === 'published' ? (
                              <DropdownMenuItem
                                className="p-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                                onClick={() => updateCourseStatusMutation.mutate({ courseId: course.id, status: 'archived' })}
                              >
                                <XCircle className="h-4 w-4 mr-3" />
                                REVOKE PROTOCOL
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="p-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-green-400 focus:bg-green-500/10 focus:text-green-400 cursor-pointer"
                                onClick={() => updateCourseStatusMutation.mutate({ courseId: course.id, status: 'published' })}
                              >
                                <CheckCircle className="h-4 w-4 mr-3" />
                                AUTHORIZE LIVE
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!coursesLoading && filteredCourses.length === 0 && (
              <div className="text-center py-24 flex flex-col items-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10">
                  <BookOpen className="h-10 w-10 text-white/10" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">No Matching Archives</h3>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Adjust scan parameters or synchronize database</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
