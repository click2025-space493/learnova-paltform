import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  SkipBack, 
  SkipForward,
  Settings,
  Download
} from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
  allowDownload?: boolean;
  autoPlay?: boolean;
}

export default function VideoPlayer({ 
  videoUrl, 
  title, 
  onProgress, 
  onComplete,
  allowDownload = false,
  autoPlay = false 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasError, setHasError] = useState(false);

  // Debug video URL
  console.log('VideoPlayer received URL:', videoUrl);
  
  // Validate video URL
  if (!videoUrl || videoUrl.trim() === '') {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No video available for this lesson</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if it's a blob URL (invalid for playback)
  if (videoUrl.startsWith('blob:')) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Video upload incomplete</p>
            <p className="text-sm mt-2">The video was not properly uploaded to Cloudinary</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      setCurrentTime(current);
      onProgress?.(current, video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onComplete?.();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    const handleError = () => {
      setHasError(true);
      setIsPlaying(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [onProgress, onComplete]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = (value[0] / 100) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0] / 100;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Show error state if video failed to load
  if (hasError) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Failed to load video</p>
            <p className="text-sm mt-2">Please check the video URL or try again later</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div 
          className="relative bg-black group"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full aspect-video object-contain"
            autoPlay={autoPlay}
            onClick={togglePlay}
            onError={() => setHasError(true)}
          />

          {/* Video Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            {!isPlaying && (
              <Button
                size="lg"
                className="bg-black/50 hover:bg-black/70 text-white border-0 rounded-full w-16 h-16"
                onClick={togglePlay}
              >
                <Play className="h-8 w-8 ml-1" />
              </Button>
            )}
          </div>

          {/* Controls */}
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 lg:p-4 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Progress Bar */}
            <div className="mb-2 lg:mb-4">
              <Slider
                value={[progressPercentage]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/70 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 lg:space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 h-8 w-8 lg:h-auto lg:w-auto p-1 lg:p-2"
                  onClick={() => skip(-10)}
                >
                  <SkipBack className="h-3 w-3 lg:h-4 lg:w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 h-8 w-8 lg:h-auto lg:w-auto p-1 lg:p-2"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause className="h-3 w-3 lg:h-4 lg:w-4" /> : <Play className="h-3 w-3 lg:h-4 lg:w-4" />}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 h-8 w-8 lg:h-auto lg:w-auto p-1 lg:p-2"
                  onClick={() => skip(10)}
                >
                  <SkipForward className="h-3 w-3 lg:h-4 lg:w-4" />
                </Button>

                <div className="hidden sm:flex items-center space-x-2 ml-2 lg:ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 h-8 w-8 lg:h-auto lg:w-auto p-1 lg:p-2"
                    onClick={toggleMute}
                  >
                    {isMuted ? <VolumeX className="h-3 w-3 lg:h-4 lg:w-4" /> : <Volume2 className="h-3 w-3 lg:h-4 lg:w-4" />}
                  </Button>
                  <div className="w-16 lg:w-20">
                    <Slider
                      value={[isMuted ? 0 : volume * 100]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1 lg:space-x-2">
                {/* Playback Speed - Hidden on mobile */}
                <div className="relative group hidden sm:block">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 h-8 w-8 lg:h-auto lg:w-auto p-1 lg:p-2"
                  >
                    <Settings className="h-3 w-3 lg:h-4 lg:w-4" />
                  </Button>
                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="text-white text-xs mb-2">Playback Speed</div>
                    <div className="space-y-1">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => changePlaybackRate(rate)}
                          className={`block w-full text-left px-2 py-1 text-xs rounded hover:bg-white/20 ${
                            playbackRate === rate ? 'bg-white/20' : ''
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {allowDownload && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 h-8 w-8 lg:h-auto lg:w-auto p-1 lg:p-2 hidden sm:flex"
                    onClick={() => window.open(videoUrl, '_blank')}
                  >
                    <Download className="h-3 w-3 lg:h-4 lg:w-4" />
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 h-8 w-8 lg:h-auto lg:w-auto p-1 lg:p-2"
                  onClick={toggleFullscreen}
                >
                  <Maximize className="h-3 w-3 lg:h-4 lg:w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Title Overlay */}
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-black/50 text-white">
              {title}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
