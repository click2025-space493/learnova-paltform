import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Play,
  Search,
  MoreHorizontal,
  Eye,
  Download,
  Calendar,
  User,
  BookOpen,
  Clock,
  Video
} from "lucide-react";

interface VideoData {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  courseId: string;
  courseTitle: string;
  teacherId: string;
  teacherName: string;
  createdAt: string;
}

export default function AdminVideos() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all videos
  const { data: videos, isLoading: videosLoading } = useQuery<VideoData[]>({
    queryKey: ["/api/admin/videos"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Filter videos based on search term
  const filteredVideos = videos?.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Format duration from seconds to readable format
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate total duration
  const totalDuration = videos?.reduce((sum, video) => sum + (video.duration || 0), 0) || 0;
  const totalHours = Math.floor(totalDuration / 3600);

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
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 pt-40 w-full">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
          <div className="text-center md:text-left">
            <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
              CONTENT ARCHIVE ACCESS
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter uppercase leading-tight">VIDEO <span className="text-glow-blue text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 italic">INDEX.</span></h1>
            <p className="text-blue-100/40 font-medium tracking-tight uppercase text-xs mt-2">Monitoring Global Knowledge Streams // {videos?.length || 0} Entities</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 h-4 w-4 group-focus-within:text-blue-400 transition-colors" />
              <Input
                placeholder="PROBE ARCHIVE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest focus-visible:ring-blue-500/20 placeholder:text-white/10"
              />
            </div>
            <Button className="h-14 px-10 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/10 hover:bg-blue-400 hover:text-white transition-all border-none w-full md:w-auto">
              REFRESH DATA
            </Button>
          </div>
        </div>

        {/* Video Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          {[
            { label: "TOTAL STREAMS", value: videos?.length || 0, icon: Video, color: "blue" },
            { label: "CORE DURATION", value: `${totalHours}H`, icon: Clock, color: "purple" },
            { label: "TARGET COURSES", value: new Set(videos?.map(v => v.courseId)).size || 0, icon: BookOpen, color: "cyan" },
            { label: "AUTHORIZED TEACHERS", value: new Set(videos?.map(v => v.teacherId)).size || 0, icon: User, color: "emerald" }
          ].map((stat, i) => (
            <div key={i} className={`bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-3xl relative overflow-hidden group hover:bg-white/10 transition-all neon-border-${stat.color === 'emerald' ? 'blue' : stat.color}`}>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">{stat.label}</p>
                <div className="flex items-center justify-between">
                  <h3 className="text-4xl font-black text-white tracking-tighter">{stat.value}</h3>
                  <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center border border-${stat.color}-500/10`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Videos Table */}
        <div className="rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden shadow-2xl">
          <div className="p-10 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-black text-white tracking-widest flex items-center gap-4">
              <Play className="h-5 w-5 text-blue-400" />
              ALL DATA STREAMS // 0{filteredVideos.length}
            </h2>
            <Badge variant="outline" className="border-white/10 text-white/20 font-black text-[10px] uppercase px-4 py-1.5 rounded-full">
              LIVE MONITORING
            </Badge>
          </div>
          <div className="p-0">
            {videosLoading ? (
              <div className="p-10 space-y-8">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-8 animate-pulse">
                    <div className="h-20 w-32 bg-white/5 rounded-2xl border border-white/5" />
                    <div className="flex-1 space-y-4">
                      <div className="h-4 bg-white/5 rounded w-1/3" />
                      <div className="h-3 bg-white/5 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-white/5">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="text-white/20 font-black text-[10px] uppercase tracking-widest pl-10 h-16">STREAM ENTITY</TableHead>
                      <TableHead className="text-white/20 font-black text-[10px] uppercase tracking-widest h-16">SOURCE COURSE</TableHead>
                      <TableHead className="text-white/20 font-black text-[10px] uppercase tracking-widest h-16">ARCHITECT</TableHead>
                      <TableHead className="text-white/20 font-black text-[10px] uppercase tracking-widest h-16">LATENCY</TableHead>
                      <TableHead className="text-white/20 font-black text-[10px] uppercase tracking-widest h-16">SYNC DATE</TableHead>
                      <TableHead className="text-white/20 font-black text-[10px] uppercase tracking-widest h-16">STATUS</TableHead>
                      <TableHead className="text-right pr-10 h-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVideos.map((video) => (
                      <TableRow key={video.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                        <TableCell className="pl-10 py-8">
                          <div className="flex items-center space-x-6">
                            <div className="h-20 w-32 bg-[#020617] rounded-2xl overflow-hidden relative border border-white/10 group-hover:border-blue-500/30 transition-all">
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] group-hover:bg-transparent transition-all">
                                <Play className="h-8 w-8 text-white/20 group-hover:text-blue-400 group-hover:scale-110 transition-all" />
                              </div>
                              {video.videoUrl && (
                                <video
                                  className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all"
                                  poster=""
                                  preload="none"
                                >
                                  <source src={video.videoUrl} type="video/mp4" />
                                </video>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-black text-white uppercase tracking-tight text-sm mb-1 group-hover:text-blue-400 transition-colors">
                                {video.title}
                              </div>
                              <div className="text-[10px] text-white/20 font-black uppercase tracking-widest">
                                ID-{video.id.slice(0, 8)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-4 group/course">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/10 flex items-center justify-center group-hover/course:bg-purple-500/20 transition-all">
                              <BookOpen className="h-4 w-4 text-purple-400" />
                            </div>
                            <div>
                              <div className="font-black text-white text-[10px] uppercase tracking-widest mb-1">{video.courseTitle}</div>
                              <div className="text-[10px] text-white/20 font-black uppercase">
                                {video.courseId.slice(0, 8)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/40">
                              {video.teacherName?.[0]}
                            </div>
                            <span className="text-[10px] font-black text-white/60 tracking-widest uppercase">{video.teacherName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Clock className="h-3 w-3 text-blue-400" />
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{video.duration ? formatDuration(video.duration) : 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Calendar className="h-3 w-3 text-purple-400" />
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{new Date(video.createdAt).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`border-none text-[8px] font-black px-3 py-1 rounded-md uppercase tracking-widest ${video.videoUrl ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)]' : 'bg-amber-500/10 text-amber-400'}`}>
                            {video.videoUrl ? 'ENCRYPTED' : 'PROCESSING'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/20 hover:text-white transition-all">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0f172a] border-white/10 text-white p-2 rounded-2xl backdrop-blur-3xl shadow-2xl">
                              <DropdownMenuItem
                                className="focus:bg-blue-500/20 focus:text-blue-400 rounded-xl font-black text-[10px] uppercase tracking-widest p-3 cursor-pointer"
                                onClick={() => setLocation(`/courses/${video.courseId}/learn`)}
                              >
                                <Eye className="h-4 w-4 mr-3" />
                                VIEW STREAM
                              </DropdownMenuItem>
                              {video.videoUrl && (
                                <DropdownMenuItem
                                  className="focus:bg-purple-500/20 focus:text-purple-400 rounded-xl font-black text-[10px] uppercase tracking-widest p-3 cursor-pointer"
                                  onClick={() => window.open(video.videoUrl, '_blank')}
                                >
                                  <Play className="h-4 w-4 mr-3" />
                                  EXECUTE PLAYBACK
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="focus:bg-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest p-3 cursor-pointer"
                                onClick={() => setLocation(`/courses/${video.courseId}`)}
                              >
                                <BookOpen className="h-4 w-4 mr-3" />
                                SOURCE PARAMETERS
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!videosLoading && filteredVideos.length === 0 && (
              <div className="text-center py-32 flex flex-col items-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-10 border border-white/10">
                  <Video className="h-10 w-10 text-white/5" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">NO DATA STREAMS DETECTED</h3>
                <p className="text-blue-100/20 font-medium max-w-sm uppercase text-[10px] tracking-[0.2em]">
                  {searchTerm ? "Neural probe failed to find matches in current coordinates." : "The Nexus archives are currently empty."}
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
