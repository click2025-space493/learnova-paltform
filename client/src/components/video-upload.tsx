import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, CheckCircle, AlertCircle, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoUploadProps {
  onVideoUploaded: (videoUrl: string, duration?: number) => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
}

interface UploadedVideo {
  file: File;
  url: string;
  uploadProgress: number;
  status: 'uploading' | 'completed' | 'error';
  duration?: number;
}

export default function VideoUpload({ 
  onVideoUploaded, 
  maxSizeMB = 500,
  acceptedFormats = ['video/mp4', 'video/webm', 'video/ogg']
}: VideoUploadProps) {
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideo | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Please select a video file smaller than ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      toast({
        title: "Invalid file format",
        description: "Please select a valid video file (MP4, WebM, or OGG)",
        variant: "destructive",
      });
      return;
    }

    const videoUrl = URL.createObjectURL(file);
    
    setUploadedVideo({
      file,
      url: videoUrl,
      uploadProgress: 0,
      status: 'uploading'
    });

    // Simulate upload progress
    simulateUpload(file, videoUrl);
  }, [maxSizeMB, acceptedFormats, toast]);

  const simulateUpload = async (file: File, videoUrl: string) => {
    try {
      // Get video duration
      const video = document.createElement('video');
      video.src = videoUrl;
      
      video.onloadedmetadata = () => {
        const duration = Math.round(video.duration);
        
        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 15;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            setUploadedVideo(prev => prev ? {
              ...prev,
              uploadProgress: 100,
              status: 'completed',
              duration
            } : null);
            
            onVideoUploaded(videoUrl, duration);
            
            toast({
              title: "Video uploaded successfully!",
              description: `${file.name} has been uploaded and is ready to use.`,
            });
          } else {
            setUploadedVideo(prev => prev ? {
              ...prev,
              uploadProgress: Math.round(progress)
            } : null);
          }
        }, 200);
      };
      
      video.onerror = () => {
        setUploadedVideo(prev => prev ? {
          ...prev,
          status: 'error'
        } : null);
        
        toast({
          title: "Upload failed",
          description: "There was an error processing your video file.",
          variant: "destructive",
        });
      };
    } catch (error) {
      setUploadedVideo(prev => prev ? {
        ...prev,
        status: 'error'
      } : null);
    }
  };

  // Simple file input without dropzone for now
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onDrop([file]);
    }
  };

  const removeVideo = () => {
    if (uploadedVideo?.url) {
      URL.revokeObjectURL(uploadedVideo.url);
    }
    setUploadedVideo(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (uploadedVideo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{uploadedVideo.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(uploadedVideo.file.size)}
                    {uploadedVideo.duration && ` • ${formatDuration(uploadedVideo.duration)}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {uploadedVideo.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {uploadedVideo.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeVideo}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {uploadedVideo.status === 'uploading' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadedVideo.uploadProgress}%</span>
                </div>
                <Progress value={uploadedVideo.uploadProgress} className="h-2" />
              </div>
            )}

            {uploadedVideo.status === 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  ✓ Video uploaded successfully and ready to use
                </p>
              </div>
            )}

            {uploadedVideo.status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  ✗ Upload failed. Please try again.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50">
      <input 
        type="file" 
        accept="video/*" 
        onChange={handleFileChange}
        className="hidden" 
        id="video-upload"
      />
      <div className="space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <Upload className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <p className="text-lg font-medium">Upload course video</p>
          <p className="text-sm text-muted-foreground">
            Click to browse and select your video file
          </p>
          <p className="text-xs text-muted-foreground">
            Supports MP4, WebM, OGG • Max size: {maxSizeMB}MB
          </p>
        </div>

        <label htmlFor="video-upload">
          <Button variant="outline" className="mt-4" asChild>
            <span>Choose Video File</span>
          </Button>
        </label>
      </div>
    </div>
  );
}
