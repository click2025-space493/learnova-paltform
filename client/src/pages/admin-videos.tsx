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
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Video Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage all videos across the platform
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>

        {/* Video Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {videos?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Videos</div>
                </div>
                <Video className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-secondary">
                    {totalHours}h
                  </div>
                  <div className="text-sm text-muted-foreground">Total Duration</div>
                </div>
                <Clock className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-accent">
                    {new Set(videos?.map(v => v.courseId)).size || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Courses</div>
                </div>
                <BookOpen className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {new Set(videos?.map(v => v.teacherId)).size || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Teachers</div>
                </div>
                <User className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Videos Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              All Videos ({filteredVideos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {videosLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="h-16 w-28 bg-muted rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Video</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVideos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-16 w-28 bg-muted rounded overflow-hidden relative">
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Play className="h-6 w-6 text-white" />
                            </div>
                            {video.videoUrl && (
                              <video 
                                className="h-full w-full object-cover"
                                poster=""
                                preload="none"
                              >
                                <source src={video.videoUrl} type="video/mp4" />
                              </video>
                            )}
                          </div>
                          <div>
                            <div className="font-medium line-clamp-2 max-w-xs">
                              {video.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {video.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{video.courseTitle}</div>
                            <div className="text-xs text-muted-foreground">
                              {video.courseId.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {video.teacherName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {video.duration ? formatDuration(video.duration) : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(video.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={video.videoUrl ? 'default' : 'secondary'}>
                          {video.videoUrl ? 'Available' : 'Processing'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setLocation(`/courses/${video.courseId}/learn`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View in Course
                            </DropdownMenuItem>
                            {video.videoUrl && (
                              <DropdownMenuItem
                                onClick={() => window.open(video.videoUrl, '_blank')}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Play Video
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setLocation(`/courses/${video.courseId}`)}
                            >
                              <BookOpen className="h-4 w-4 mr-2" />
                              View Course
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!videosLoading && filteredVideos.length === 0 && (
              <div className="text-center py-8">
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "No videos found matching your search." : "No videos found."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
