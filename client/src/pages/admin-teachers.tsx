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
  Users,
  Search,
  MoreHorizontal,
  UserCheck,
  UserX,
  Mail,
  BookOpen,
  Calendar
} from "lucide-react";

interface Teacher {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  role: string;
  createdAt: string;
  courseCount: number;
}

export default function AdminTeachers() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  // Fetch all teachers
  const { data: teachers, isLoading: teachersLoading } = useQuery<Teacher[]>({
    queryKey: ["/api/admin/teachers"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Update teacher status mutation
  const updateTeacherStatusMutation = useMutation({
    mutationFn: async ({ teacherId, status }: { teacherId: string; status: string }) => {
      const response = await fetch(`/api/admin/teachers/${teacherId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update teacher status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teachers"] });
      toast({
        title: "Success",
        description: "Teacher status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update teacher status",
        variant: "destructive",
      });
    },
  });

  // Filter teachers based on search term
  const filteredTeachers = teachers?.filter(teacher =>
    `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 w-full pt-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
              IDENTITY PROTOCOLS // REGISTRY
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter mb-6">TEACHER <span className="text-glow-purple text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">INDEX.</span></h1>
            <p className="text-xl text-blue-100/40 font-medium leading-relaxed">
              Managing authorized <span className="text-purple-400 font-black uppercase tracking-widest">educator entities</span> and their neural output.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20 h-4 w-4 group-focus-within:text-purple-400 transition-colors" />
              <Input
                placeholder="FIND ENTITY..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 w-80 h-14 rounded-2xl bg-white/5 border-white/10 text-white font-black text-xs tracking-widest focus:ring-purple-400 focus:border-purple-400 placeholder:text-white/10"
              />
            </div>
          </div>
        </div>

        {/* Teachers Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl group hover:bg-white/10 transition-all cursor-default relative overflow-hidden neon-border-blue">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-[10px] font-black text-blue-400/40 uppercase tracking-widest">POPULATION</div>
            </div>
            <div className="text-4xl font-black text-white tracking-tighter">
              {teachers?.length || 0}
            </div>
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-2 block">REGISTERED EDUCATORS</span>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl group hover:bg-white/10 transition-all cursor-default relative overflow-hidden neon-border-purple">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-green-500/20 border border-green-500/20 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-400" />
              </div>
              <div className="text-[10px] font-black text-green-400/40 uppercase tracking-widest">ACTIVE</div>
            </div>
            <div className="text-4xl font-black text-white tracking-tighter">
              {teachers?.filter(t => t.role === 'teacher').length || 0}
            </div>
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-2 block">VERIFIED PROTOCOLS</span>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl group hover:bg-white/10 transition-all cursor-default relative overflow-hidden neon-border-blue">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/20 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-purple-400" />
              </div>
              <div className="text-[10px] font-black text-purple-400/40 uppercase tracking-widest">OUTPUT</div>
            </div>
            <div className="text-4xl font-black text-white tracking-tighter">
              {teachers?.reduce((sum, teacher) => sum + teacher.courseCount, 0) || 0}
            </div>
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-2 block">TOTAL DATA STREAMS</span>
          </div>
        </div>

        {/* Teachers Table Area */}
        <div className="rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden neon-border-purple">
          <div className="p-10 border-b border-white/10">
            <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              Entity Registry List ({filteredTeachers.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            {teachersLoading ? (
              <div className="p-10 space-y-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-white/5 border-white/10">
                  <TableRow className="hover:bg-transparent border-white/10">
                    <TableHead className="py-6 px-10 text-[10px] font-black text-white/40 uppercase tracking-widest">Entity</TableHead>
                    <TableHead className="py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Comms</TableHead>
                    <TableHead className="py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Streams</TableHead>
                    <TableHead className="py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Status</TableHead>
                    <TableHead className="py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Initialization</TableHead>
                    <TableHead className="py-6 px-10 text-right text-[10px] font-black text-white/40 uppercase tracking-widest">Override</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="py-6 px-10">
                        <div className="flex items-center gap-6">
                          <Avatar className="h-12 w-12 border border-white/10 shadow-xl group-hover:scale-110 transition-transform">
                            <AvatarImage src={teacher.profileImageUrl} />
                            <AvatarFallback className="bg-purple-500/20 text-purple-400 font-black text-xs uppercase">
                              {teacher.firstName[0]}{teacher.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-black text-white uppercase tracking-wide group-hover:text-purple-400 transition-colors">
                              {teacher.firstName} {teacher.lastName}
                            </div>
                            <div className="text-[9px] font-black text-white/10 uppercase tracking-widest">
                              ID: {teacher.id.slice(0, 16)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex items-center gap-3 text-white/40 text-[10px] font-black uppercase tracking-widest">
                          <Mail className="h-3.5 w-3.5 text-blue-400" />
                          {teacher.email}
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex items-center gap-3 text-white/40 text-[10px] font-black uppercase tracking-widest">
                          <BookOpen className="h-3.5 w-3.5 text-purple-400" />
                          {teacher.courseCount} STREAMS
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <Badge
                          className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border-none ${teacher.role === 'teacher' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/40'}`}
                        >
                          {teacher.role === 'teacher' ? 'VERIFIED' : teacher.role.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex items-center gap-3 text-white/40 text-[10px] font-black uppercase tracking-widest">
                          <Calendar className="h-3.5 w-3.5 text-blue-400" />
                          {new Date(teacher.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="py-6 px-10 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white/10 text-white/40 hover:text-white">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#020617] border-white/10 rounded-2xl shadow-2xl p-2 min-w-[180px]">
                            {teacher.role === 'teacher' ? (
                              <DropdownMenuItem
                                onClick={() => updateTeacherStatusMutation.mutate({
                                  teacherId: teacher.id,
                                  status: 'student'
                                })}
                                className="text-red-400 focus:bg-red-500/10 focus:text-red-400 rounded-xl font-black text-xs uppercase tracking-widest p-3 cursor-pointer"
                              >
                                <UserX className="h-4 w-4 mr-3" />
                                SUSPEND ENTITY
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => updateTeacherStatusMutation.mutate({
                                  teacherId: teacher.id,
                                  status: 'teacher'
                                })}
                                className="text-green-400 focus:bg-green-500/10 focus:text-green-400 rounded-xl font-black text-xs uppercase tracking-widest p-3 cursor-pointer"
                              >
                                <UserCheck className="h-4 w-4 mr-3" />
                                VERIFY ENTITY
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

            {!teachersLoading && filteredTeachers.length === 0 && (
              <div className="text-center py-24 flex flex-col items-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10">
                  <Users className="h-10 w-10 text-white/10" />
                </div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                  {searchTerm ? "No Matching Entities Found in Registry" : "Registry Database Empty"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
