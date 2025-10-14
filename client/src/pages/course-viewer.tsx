import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { copyLinkBlocker } from "@/utils/copyLinkBlocker";
// import Navigation from "@/components/navigation"; // Removed for full-screen video experience
// import Footer from "@/components/footer"; // Removed for full-screen video experience
import VideoPlayer from "@/components/video-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  CheckCircle, 
  Lock, 
  Clock, 
  BookOpen, 
  Video,
  ChevronDown,
  ChevronRight,
  Award,
  AlertCircle,
  X,
  ArrowLeft,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  Pause,
  Gauge,
  ChevronUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  videoDuration?: number;
  type: 'video' | 'text';
  content?: string;
  completed: boolean;
  locked: boolean;
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  expanded: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  coverImageUrl?: string;
  chapters: Chapter[];
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

export default function CourseViewer() {
  const [match, params] = useRoute("/courses/:id/learn");
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimer, setControlsTimer] = useState<NodeJS.Timeout | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Handle autoplay state - don't reset it automatically
  useEffect(() => {
    if (currentLesson && autoplayEnabled) {
      console.log('Video selected with autoplay:', currentLesson.title)
      // Set playing state to true when autoplay starts
      setIsPlaying(true)
    }
  }, [currentLesson, autoplayEnabled])


  // Controls visibility management
  const showControlsTemporarily = () => {
    // Clear existing timer
    if (controlsTimer) {
      clearTimeout(controlsTimer)
    }
    
    // Always show controls when user interacts
    setShowControls(true)
    
    // Hide controls after 10 seconds in both fullscreen and normal view
    const timer = setTimeout(() => {
      setShowControls(false)
    }, 10000) // Changed to 10 seconds
    setControlsTimer(timer)
  }

  // Fullscreen functionality with cross-browser support
  const toggleFullscreen = async () => {
    const videoContainer = document.querySelector('.video-container') as HTMLElement
    if (!videoContainer) {
      console.log('Video container not found')
      return
    }

    try {
      // Check if currently in fullscreen (cross-browser)
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )

      if (!isCurrentlyFullscreen) {
        console.log('Entering fullscreen...')
        
        // Try different fullscreen methods for cross-browser compatibility
        if (videoContainer.requestFullscreen) {
          await videoContainer.requestFullscreen()
        } else if ((videoContainer as any).webkitRequestFullscreen) {
          await (videoContainer as any).webkitRequestFullscreen()
        } else if ((videoContainer as any).mozRequestFullScreen) {
          await (videoContainer as any).mozRequestFullScreen()
        } else if ((videoContainer as any).msRequestFullscreen) {
          await (videoContainer as any).msRequestFullscreen()
        }
        
        console.log('Fullscreen enabled')
      } else {
        console.log('Exiting fullscreen...')
        
        // Try different exit fullscreen methods
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen()
        }
        
        console.log('Fullscreen disabled')
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
      // Reset state based on actual fullscreen status
      const actualFullscreenState = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )
      setIsFullscreen(actualFullscreenState)
    }
  }

  // Play/Pause toggle function
  const togglePlayPause = () => {
    const iframe = document.querySelector('iframe[src*="youtube"]') as HTMLIFrameElement
    if (iframe && iframe.contentWindow) {
      try {
        if (isPlaying) {
          iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
          setIsPlaying(false)
          console.log('Video paused')
        } else {
          iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
          setIsPlaying(true)
          console.log('Video playing')
        }
      } catch (error) {
        console.log('Could not toggle play/pause:', error)
        // Retry after a short delay
        setTimeout(() => {
          try {
            if (isPlaying) {
              iframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
            } else {
              iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
            }
          } catch (retryError) {
            console.log('Retry failed:', retryError)
          }
        }, 500)
      }
    } else {
      console.log('No iframe found for play/pause toggle')
    }
  }

  // Speed control function
  const changePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed)
    const iframe = document.querySelector('iframe[src*="youtube"]') as HTMLIFrameElement
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage(`{"event":"command","func":"setPlaybackRate","args":[${speed}]}`, '*')
        console.log(`Playback speed changed to ${speed}x`)
      } catch (error) {
        console.log('Could not change playback speed:', error)
        // Retry after a short delay
        setTimeout(() => {
          try {
            iframe.contentWindow?.postMessage(`{"event":"command","func":"setPlaybackRate","args":[${speed}]}`, '*')
          } catch (retryError) {
            console.log('Speed change retry failed:', retryError)
          }
        }, 500)
      }
    } else {
      console.log('No iframe found for speed control')
    }
  }

  // Seek to specific time function
  const seekToTime = (timeInSeconds: number) => {
    const iframe = document.querySelector('iframe[src*="youtube"]') as HTMLIFrameElement
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage(`{"event":"command","func":"seekTo","args":[${timeInSeconds}, true]}`, '*')
        setCurrentTime(timeInSeconds)
        console.log(`Seeked to ${timeInSeconds} seconds`)
      } catch (error) {
        console.log('Could not seek video:', error)
        // Retry after a short delay
        setTimeout(() => {
          try {
            iframe.contentWindow?.postMessage(`{"event":"command","func":"seekTo","args":[${timeInSeconds}, true]}`, '*')
          } catch (retryError) {
            console.log('Seek retry failed:', retryError)
          }
        }, 500)
      }
    } else {
      console.log('No iframe found for seeking')
    }
  }

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Video control functions
  const sendVideoCommand = (command: string, args?: any) => {
    const iframe = document.querySelector('iframe[src*="youtube"]') as HTMLIFrameElement
    if (iframe && iframe.contentWindow) {
      try {
        const message = JSON.stringify({
          event: 'command',
          func: command,
          args: args || ''
        })
        iframe.contentWindow.postMessage(message, '*')
      } catch (error) {
        console.log('Could not send video command:', error)
      }
    }
  }

  const seekVideo = (seconds: number) => {
    // Get current time first, then seek relative to it
    sendVideoCommand('getCurrentTime')
    setTimeout(() => {
      sendVideoCommand('seekTo', seconds)
    }, 100)
  }

  const skipForward = () => {
    sendVideoCommand('getCurrentTime')
    // We'll handle the actual seeking in a message listener
    const iframe = document.querySelector('iframe[src*="youtube"]') as HTMLIFrameElement
    if (iframe && iframe.contentWindow) {
      // Send a custom message to skip forward 10 seconds
      iframe.contentWindow.postMessage('{"event":"command","func":"getCurrentTime","args":""}', '*')
    }
  }

  const skipBackward = () => {
    sendVideoCommand('getCurrentTime')
    // We'll handle the actual seeking in a message listener  
    const iframe = document.querySelector('iframe[src*="youtube"]') as HTMLIFrameElement
    if (iframe && iframe.contentWindow) {
      // Send a custom message to skip backward 10 seconds
      iframe.contentWindow.postMessage('{"event":"command","func":"getCurrentTime","args":""}', '*')
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      // Cross-browser fullscreen detection
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )
      
      console.log('Fullscreen change detected:', isCurrentlyFullscreen)
      setIsFullscreen(isCurrentlyFullscreen)
      
      // Reset controls visibility when exiting fullscreen
      if (!isCurrentlyFullscreen) {
        setShowControls(true)
      }
    }

    const handleFullscreenError = (e: Event) => {
      console.error('Fullscreen error event:', e)
      setIsFullscreen(false)
    }

    // Listen to multiple fullscreen events for better compatibility
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)
    
    document.addEventListener('fullscreenerror', handleFullscreenError)
    document.addEventListener('webkitfullscreenerror', handleFullscreenError)
    document.addEventListener('mozfullscreenerror', handleFullscreenError)
    document.addEventListener('MSFullscreenError', handleFullscreenError)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
      
      document.removeEventListener('fullscreenerror', handleFullscreenError)
      document.removeEventListener('webkitfullscreenerror', handleFullscreenError)
      document.removeEventListener('mozfullscreenerror', handleFullscreenError)
      document.removeEventListener('MSFullscreenError', handleFullscreenError)
    }
  }, [])

  // Auto-hide controls in fullscreen
  useEffect(() => {
    // Clear any existing timer when fullscreen state changes
    if (controlsTimer) {
      clearTimeout(controlsTimer)
      setControlsTimer(null)
    }
    
    if (isFullscreen) {
      // Show controls initially when entering fullscreen
      setShowControls(true)
      // Start auto-hide timer
      showControlsTemporarily()
    } else {
      // Always show controls when not in fullscreen
      setShowControls(true)
    }
  }, [isFullscreen])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (controlsTimer) {
        clearTimeout(controlsTimer)
      }
    }
  }, [controlsTimer])

  // Listen for YouTube player state changes
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com' && event.origin !== 'https://www.youtube-nocookie.com') {
        return
      }
      
      try {
        const data = JSON.parse(event.data)
        
        // Handle different YouTube API events
        if (data.event === 'video-progress') {
          // YouTube sends progress updates
          if (data.info) {
            // Update player state
            if (typeof data.info.playerState !== 'undefined') {
              // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
              const playerState = data.info.playerState
              setIsPlaying(playerState === 1) // 1 = playing
            }
            
            // Update current time and duration
            if (typeof data.info.currentTime !== 'undefined' && !isDragging) {
              setCurrentTime(data.info.currentTime)
            }
            
            if (typeof data.info.duration !== 'undefined') {
              setDuration(data.info.duration)
            }
          }
        } else if (data.event === 'infoDelivery') {
          // Handle direct API responses
          if (data.info) {
            if (typeof data.info.currentTime !== 'undefined' && !isDragging) {
              setCurrentTime(data.info.currentTime)
            }
            if (typeof data.info.duration !== 'undefined') {
              setDuration(data.info.duration)
            }
          }
        } else if (typeof data === 'number') {
          // Sometimes YouTube sends just the time as a number
          if (!isDragging) {
            setCurrentTime(data)
          }
        }
      } catch (error) {
        // Try to parse as a simple number (current time)
        try {
          const timeValue = parseFloat(event.data)
          if (!isNaN(timeValue) && !isDragging) {
            setCurrentTime(timeValue)
          }
        } catch (parseError) {
          // Ignore parsing errors
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [isDragging])

  // Periodic video progress sync
  useEffect(() => {
    if (!currentLesson) return

    const updateProgress = () => {
      const iframe = document.querySelector('iframe[src*="youtube"]') as HTMLIFrameElement
      if (iframe && iframe.contentWindow) {
        try {
          // Request current time and duration from YouTube
          iframe.contentWindow.postMessage('{"event":"command","func":"getCurrentTime","args":""}', '*')
          iframe.contentWindow.postMessage('{"event":"command","func":"getDuration","args":""}', '*')
        } catch (error) {
          console.log('Could not request video progress:', error)
        }
      }
    }

    // Update progress every second
    const interval = setInterval(updateProgress, 1000)
    return () => clearInterval(interval)
  }, [currentLesson])

  // Periodic fullscreen state sync (fallback)
  useEffect(() => {
    const syncFullscreenState = () => {
      const actualFullscreenState = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )
      
      if (actualFullscreenState !== isFullscreen) {
        console.log('Syncing fullscreen state:', actualFullscreenState)
        setIsFullscreen(actualFullscreenState)
      }
    }

    const interval = setInterval(syncFullscreenState, 1000) // Check every second
    return () => clearInterval(interval)
  }, [isFullscreen])

  // Global security measures for the entire course page
  useEffect(() => {
    // Activate aggressive copy link blocker for this page
    copyLinkBlocker.start();
    
    // Block all function keys and developer tools shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block all F keys (F1-F12)
      if (e.key.startsWith('F') && e.key.length <= 3) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Show controls on any key press in fullscreen
      if (isFullscreen) {
        showControlsTemporarily()
      }

      // Allow video control shortcuts but block developer tools
      if (e.key === ' ' || e.key === 'Spacebar') {
        // Allow spacebar for play/pause toggle
        e.preventDefault();
        togglePlayPause();
        return false;
      }
      
      if (e.key === 'ArrowLeft') {
        // Allow left arrow for skip backward (5 seconds for fine control)
        e.preventDefault();
        const iframe = document.querySelector('iframe[src*="youtube"]') as HTMLIFrameElement
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage('{"event":"command","func":"seekBy","args":[-5]}', '*')
        }
        return false;
      }
      
      if (e.key === 'ArrowRight') {
        // Allow right arrow for skip forward (5 seconds for fine control)
        e.preventDefault();
        const iframe = document.querySelector('iframe[src*="youtube"]') as HTMLIFrameElement
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage('{"event":"command","func":"seekBy","args":[5]}', '*')
        }
        return false;
      }
      
      if (e.key === 'j' || e.key === 'J') {
        // J key for 10 seconds backward (YouTube standard)
        e.preventDefault();
        const iframe = document.querySelector('iframe[src*="youtube"]') as HTMLIFrameElement
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage('{"event":"command","func":"seekBy","args":[-10]}', '*')
        }
        return false;
      }
      
      if (e.key === 'l' || e.key === 'L') {
        // L key for 10 seconds forward (YouTube standard)
        e.preventDefault();
        const iframe = document.querySelector('iframe[src*="youtube"]') as HTMLIFrameElement
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage('{"event":"command","func":"seekBy","args":[10]}', '*')
        }
        return false;
      }
      
      if (e.key === 'k' || e.key === 'K') {
        // K key for play/pause (YouTube standard)
        e.preventDefault();
        togglePlayPause();
        return false;
      }
      
      if (e.key === 'f' || e.key === 'F') {
        // Allow F for fullscreen
        e.preventDefault();
        toggleFullscreen();
        return false;
      }
      
      if (e.key === '+' || e.key === '=') {
        // Increase speed with + key
        e.preventDefault();
        const newSpeed = Math.min(playbackSpeed + 0.25, 2)
        changePlaybackSpeed(newSpeed)
        return false;
      }
      
      if (e.key === '-' || e.key === '_') {
        // Decrease speed with - key
        e.preventDefault();
        const newSpeed = Math.max(playbackSpeed - 0.25, 0.25)
        changePlaybackSpeed(newSpeed)
        return false;
      }
      
      if (e.key === '1') {
        // Reset to normal speed with 1 key
        e.preventDefault();
        changePlaybackSpeed(1)
        return false;
      }

      // Block developer tools shortcuts
      if ((e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) ||
          (e.ctrlKey && (e.key === 'u' || e.key === 'U')) ||
          (e.ctrlKey && (e.key === 's' || e.key === 'S')) ||
          ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X' || e.key === 'v' || e.key === 'V'))) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Disable right-click but allow on buttons
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Allow right-click on buttons for accessibility
      if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('[role="button"]')) {
        return true;
      }
      e.preventDefault();
      return false;
    };

    // Block clipboard operations
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Disable text selection but allow button clicks
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      // Allow selection on buttons and interactive elements
      if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('[role="button"]')) {
        return true;
      }
      return false;
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Allow mouse down on buttons and interactive elements
      if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('[role="button"]') || target.closest('.plyr__control')) {
        return true;
      }
      return false;
    };

    // Detect developer tools (exclude mobile devices)
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(navigator.userAgent) || 
                    window.innerWidth <= 768 || 
                    'ontouchstart' in window || 
                    navigator.maxTouchPoints > 0;
    
    // Only run developer tools detection on desktop devices
    let devtools = { open: false };
    const threshold = 160;
    const detectDevTools = () => {
      // Skip detection for mobile devices
      if (isMobile) return;
      
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          document.body.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;z-index:999999;">Access Denied - Developer Tools Detected</div>';
        }
      }
    };

    // Override clipboard API
    if (navigator.clipboard) {
      (navigator.clipboard as any).writeText = () => Promise.reject('Clipboard access denied');
    }

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('cut', handleCopy, true);
    document.onselectstart = handleSelectStart;
    document.onmousedown = handleMouseDown;
    
    const devToolsInterval = setInterval(detectDevTools, 500);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('cut', handleCopy, true);
      document.onselectstart = null;
      document.onmousedown = null;
      clearInterval(devToolsInterval);
    };
  }, []);

  // Check if user is enrolled in the course or has approved enrollment request
  const { data: enrollment, isLoading: enrollmentLoading, error: enrollmentError } = useQuery({
    queryKey: ['enrollment', params?.id, user?.id],
    queryFn: async () => {
      if (!params?.id || !user?.id) return null;
      
      console.log('Checking enrollment for course:', params.id, 'user:', user.id);
      
      // First check for direct enrollment
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', params.id)
        .eq('student_id', user.id)
        .maybeSingle();
      
      console.log('Enrollment query result:', { data: enrollmentData, error: enrollmentError });
      
      if (enrollmentData) {
        return enrollmentData;
      }
      
      // If no direct enrollment, check for approved enrollment request
      const { data: requestData, error: requestError } = await supabase
        .from('enrollment_requests')
        .select('*')
        .eq('course_id', params.id)
        .eq('student_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();
      
      console.log('Approved request query result:', { data: requestData, error: requestError });
      
      if (requestData) {
        // If we have an approved request, treat it as valid access
        // Return a mock enrollment object to grant access
        return {
          id: `approved-request-${requestData.id}`,
          student_id: user.id,
          course_id: params.id,
          enrolled_at: requestData.reviewed_at || requestData.requested_at,
          created_at: requestData.requested_at
        };
      }
      
      return null;
    },
    enabled: !!params?.id && !!user?.id && isAuthenticated,
  });

  // Fetch course data with chapters and lessons
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course-content', params?.id],
    queryFn: async () => {
      if (!params?.id) return null;
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          teacher:users!courses_teacher_id_fkey (
            id,
            name
          ),
          chapters (
            id,
            title,
            description,
            position,
            lessons (
              id,
              title,
              description,
              type,
              content,
              video_url,
              youtube_video_id,
              youtube_video_url,
              video_duration,
              position,
              is_free
            )
          )
        `)
        .eq('id', params.id)
        .eq('is_published', true)
        .single();
      
      if (error) throw error;
      
      console.log('Raw course data from database:', data);
      
      // Transform the data to match our interface
      const transformedData = {
        ...data,
        teacher: Array.isArray(data.teacher) ? data.teacher[0] : data.teacher,
        chapters: data.chapters?.map((chapter: any) => ({
          ...chapter,
          lessons: chapter.lessons?.map((lesson: any) => {
            console.log('Lesson data:', lesson);
            console.log('YouTube Video ID:', lesson.youtube_video_id);
            console.log('YouTube Video URL:', lesson.youtube_video_url);
            console.log('Legacy Video URL:', lesson.video_url);
            return lesson;
          }) || []
        })) || []
      };
      
      console.log('Transformed course data:', transformedData);
      
      return transformedData;
    },
    enabled: !!params?.id,
  });

  const isLoading = enrollmentLoading || courseLoading;

  // Set first lesson as current when course loads
  useEffect(() => {
    if (course && course.chapters.length > 0) {
      const firstChapter = course.chapters[0];
      if (firstChapter.lessons.length > 0) {
        const firstLesson = firstChapter.lessons[0];
        setCurrentLesson({
          id: firstLesson.id,
          title: firstLesson.title,
          description: firstLesson.description,
          type: firstLesson.type,
          content: firstLesson.content,
          videoUrl: firstLesson.video_url,
          videoDuration: firstLesson.video_duration,
          completed: false,
          locked: false
        });
        setExpandedChapters(new Set([firstChapter.id]));
      }
    }
  }, [course]);

  // Check authentication and enrollment
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access course content.",
        variant: "destructive",
      });
      setLocation("/signin");
      return;
    }

    // Only check enrollment after both enrollment and course queries are complete
    if (!enrollmentLoading && !courseLoading && !enrollment && course && isAuthenticated) {
      toast({
        title: "Access Denied",
        description: "You need to enroll in this course to access the content.",
        variant: "destructive",
      });
      setLocation(`/courses/${params?.id}`);
      return;
    }
  }, [isAuthenticated, enrollment, enrollmentLoading, courseLoading, course, isLoading, toast, setLocation, params?.id]);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const selectLesson = (lesson: Lesson) => {
    if (lesson.locked) {
      toast({
        title: "Lesson Locked",
        description: "Complete previous lessons to unlock this content.",
        variant: "destructive",
      });
      return;
    }
    setCurrentLesson(lesson);
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!user?.id || !params?.id) return;

    try {
      // Update lesson progress in database
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          student_id: user.id,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Lesson Completed!",
        description: "Great job! Moving to the next lesson.",
      });

      // Auto-advance to next lesson
      setTimeout(() => {
        const nextLesson = getNextLesson(lessonId);
        if (nextLesson) {
          setCurrentLesson(nextLesson);
        }
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark lesson as complete. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getNextLesson = (currentLessonId: string): Lesson | null => {
    if (!course) return null;
    
    const allLessons = course.chapters.flatMap((chapter: any) => chapter.lessons);
    const currentIndex = allLessons.findIndex((lesson: any) => lesson.id === currentLessonId);
    
    if (currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      return {
        id: nextLesson.id,
        title: nextLesson.title,
        description: nextLesson.description,
        type: nextLesson.type,
        content: nextLesson.content,
        videoUrl: nextLesson.video_url,
        videoDuration: nextLesson.video_duration,
        completed: false,
        locked: false
      };
    }
    
    return null;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const calculateStats = (chapters: any[]) => {
    return chapters.reduce((total: number, chapter: any) => {
      return total + chapter.lessons.length;
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if not enrolled
  if (!isLoading && !enrollment && course) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You need to enroll in this course to access the content.</p>
            <Button onClick={() => setLocation(`/courses/${params?.id}`)}>
              Go to Course Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
            <p className="text-muted-foreground">The course you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Minimal Header with Exit Button */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(`/courses/${params?.id}`)}
          className="bg-black/50 hover:bg-black/70 text-white border-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar - Course Content */}
        <div className="w-full lg:w-80 border-r lg:border-b-0 border-b bg-muted/30 lg:h-screen overflow-y-auto">
          <div className="p-4 lg:p-6">
            <div className="mb-4 lg:mb-6">
              <h2 className="font-bold text-base lg:text-lg mb-2">{course.title}</h2>
              <p className="text-xs lg:text-sm text-muted-foreground mb-4">by {course.teacher?.name}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs lg:text-sm">
                  <span>Progress</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 of {course.chapters.reduce((total, chapter) => total + chapter.lessons.length, 0)} lessons</span>
                </div>
              </div>
            </div>

            <Separator className="mb-4 lg:mb-6" />

            {/* Chapter List */}
            <div className="space-y-3 lg:space-y-4">
              {course.chapters.map((chapter: any) => (
                <div key={chapter.id}>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-2 lg:p-3 h-auto text-left"
                    onClick={() => toggleChapter(chapter.id)}
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm lg:text-base">{chapter.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {chapter.lessons.length} lessons
                      </div>
                    </div>
                    {expandedChapters.has(chapter.id) ? (
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    )}
                  </Button>

                  {expandedChapters.has(chapter.id) && (
                    <div className="ml-2 lg:ml-4 mt-2 space-y-1 lg:space-y-2">
                      {chapter.lessons.map((lesson: any) => (
                        <div key={lesson.id} className="space-y-2">
                          <Button
                            variant={currentLesson?.id === lesson.id ? "secondary" : "ghost"}
                            className="w-full justify-start p-2 lg:p-3 h-auto text-left"
                            onClick={(e) => {
                              console.log('Lesson selected:', lesson.title)
                              
                              // Simulate user interaction for autoplay
                              e.preventDefault()
                              e.stopPropagation()
                              
                              // Reset all video states when switching lessons
                              setAutoplayEnabled(true) // Enable autoplay for this selection
                              setPlaybackSpeed(1) // Reset speed to normal
                              setIsPlaying(false) // Reset playing state
                              setShowControls(true) // Ensure controls are visible
                              setCurrentTime(0) // Reset video progress
                              setDuration(0) // Reset duration
                              setVideoKey(prev => prev + 1) // Force iframe reload
                              setCurrentLesson(lesson)
                              
                              // Auto-scroll to video player on mobile
                              setTimeout(() => {
                                const videoElement = document.querySelector('.aspect-video')
                                if (videoElement) {
                                  videoElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                }
                              }, 100)
                              
                              // Try to trigger autoplay after iframe loads
                              setTimeout(() => {
                                const iframe = document.querySelector('iframe[src*="youtube"]') as HTMLIFrameElement
                                if (iframe && iframe.contentWindow) {
                                  try {
                                    // Send play command to YouTube iframe
                                    iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
                                    console.log('Sent autoplay command to new video')
                                  } catch (error) {
                                    console.log('Could not send play command:', error)
                                  }
                                }
                              }, 2000) // Increased delay for better reliability
                            }}
                          >
                            <div className="flex items-center gap-2 lg:gap-3 w-full min-w-0">
                              <div className="flex-shrink-0">
                                {lesson.type === 'video' ? (
                                  <Video className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
                                ) : (
                                  <BookOpen className="h-3 w-3 lg:h-4 lg:w-4 text-secondary" />
                                )}
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="text-xs lg:text-sm font-medium truncate">{lesson.title}</div>
                                <div className="flex items-center gap-1 lg:gap-2 text-xs text-muted-foreground">
                                  {lesson.video_duration && (
                                    <>
                                      <Clock className="h-3 w-3" />
                                      <span>{formatDuration(lesson.video_duration)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Button>
                          
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="p-4 lg:p-6">
            {currentLesson ? (
              <div className="space-y-4 lg:space-y-6">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold mb-2">{currentLesson.title}</h1>
                  <p className="text-sm lg:text-base text-muted-foreground">{currentLesson.description}</p>
                </div>

                {currentLesson.type === 'video' && (currentLesson as any).youtube_video_id ? (
                  <div className="space-y-4">
                    {/* Developer Tools Prevention */}
                    <script
                      dangerouslySetInnerHTML={{
                        __html: `
                          // Disable F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S
                          document.addEventListener('keydown', function(e) {
                            if (e.key === 'F12' || 
                                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                                (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                                (e.ctrlKey && e.key === 'u') ||
                                (e.ctrlKey && e.key === 's')) {
                              e.preventDefault();
                              e.stopPropagation();
                              return false;
                            }
                          });
                          
                          // Disable right-click globally
                          document.addEventListener('contextmenu', function(e) {
                            e.preventDefault();
                            return false;
                          });
                          
                          // Detect developer tools (exclude mobile devices)
                          const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(navigator.userAgent) || 
                                          window.innerWidth <= 768 || 
                                          'ontouchstart' in window || 
                                          navigator.maxTouchPoints > 0;
                          
                          // Only run developer tools detection on desktop devices
                          if (!isMobile) {
                            let devtools = {open: false, orientation: null};
                            const threshold = 160;
                            setInterval(function() {
                              if (window.outerHeight - window.innerHeight > threshold || 
                                  window.outerWidth - window.innerWidth > threshold) {
                                if (!devtools.open) {
                                  devtools.open = true;
                                  document.body.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;z-index:999999;">Access Denied - Developer Tools Detected</div>';
                                }
                              }
                            }, 500);
                          }
                          
                          // Disable text selection
                          document.onselectstart = function() { return false; };
                          document.onmousedown = function() { return false; };
                        `
                      }}
                    />
                    <div 
                      className={`video-container aspect-video rounded-lg overflow-hidden bg-black shadow-lg relative select-none ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
                      style={{ 
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none'
                      }}
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                      onMouseMove={() => {
                        // Always show controls on mouse move, regardless of fullscreen state
                        showControlsTemporarily()
                      }}
                      onMouseEnter={() => {
                        // Always show controls when mouse enters video area
                        showControlsTemporarily()
                      }}
                      onMouseLeave={() => {
                        // No action needed for mouse leave
                      }}
                      onClick={() => {
                        // Always show controls on click
                        showControlsTemporarily()
                      }}
                      onTouchStart={() => {
                        // Show controls on touch start
                        showControlsTemporarily()
                      }}
                      onTouchMove={() => {
                        // Show controls on touch move
                        showControlsTemporarily()
                      }}
                      onTouchEnd={() => {
                        // Show controls on touch end
                        showControlsTemporarily()
                      }}
                    >
                      {/* Loading indicator */}
                      {autoplayEnabled && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                          <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                            <p className="text-sm">Starting video...</p>
                          </div>
                        </div>
                      )}
                      


                      {/* Controls hint when hidden in fullscreen */}
                      {isFullscreen && !showControls && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded text-sm opacity-70 z-20 animate-fade-in">
                          <div className="text-center">
                            <div>Move mouse or press any key to show controls</div>
                            <div className="text-xs mt-1 opacity-80">
                              <div>Speed: {playbackSpeed}x | +/- to adjust | 1 to reset</div>
                              <div>←→ 5s | J/L 10s | K/Space play/pause | F fullscreen</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Custom Video Controls */}
                      {currentLesson && showControls && (
                        <div className={`video-controls absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-30 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex items-center gap-2 text-white text-xs mb-1">
                              <span>{formatTime(currentTime)}</span>
                              <span>/</span>
                              <span>{formatTime(duration || 100)}</span>
                              {duration === 0 && <span className="text-yellow-400 ml-2">(Loading...)</span>}
                            </div>
                            <div 
                              className="relative w-full h-2 bg-white/30 rounded-full cursor-pointer group hover:h-3 transition-all duration-200"
                              style={{ touchAction: 'none', pointerEvents: 'auto' }}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (duration > 0 && e.currentTarget) {
                                  try {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    if (rect && typeof rect.width === 'number' && rect.width > 0 && typeof rect.left === 'number') {
                                      const clickX = e.clientX - rect.left
                                      const percentage = Math.max(0, Math.min(1, clickX / rect.width))
                                      const newTime = percentage * duration
                                      seekToTime(newTime)
                                    }
                                  } catch (error) {
                                    console.log('Error in progress bar click:', error)
                                  }
                                }
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (!e.currentTarget || duration <= 0) return
                                
                                setIsDragging(true)
                                const progressBar = e.currentTarget
                                
                                const handleMouseMove = (moveEvent: MouseEvent) => {
                                  if (duration > 0 && progressBar) {
                                    try {
                                      const rect = progressBar.getBoundingClientRect()
                                      if (rect && typeof rect.width === 'number' && rect.width > 0 && typeof rect.left === 'number') {
                                        const moveX = moveEvent.clientX - rect.left
                                        const percentage = Math.max(0, Math.min(1, moveX / rect.width))
                                        const newTime = percentage * duration
                                        setCurrentTime(newTime)
                                      }
                                    } catch (error) {
                                      console.log('Error in mouse move:', error)
                                    }
                                  }
                                }
                                
                                const handleMouseUp = (upEvent: MouseEvent) => {
                                  if (duration > 0 && progressBar) {
                                    try {
                                      const rect = progressBar.getBoundingClientRect()
                                      if (rect && typeof rect.width === 'number' && rect.width > 0 && typeof rect.left === 'number') {
                                        const upX = upEvent.clientX - rect.left
                                        const percentage = Math.max(0, Math.min(1, upX / rect.width))
                                        const newTime = percentage * duration
                                        seekToTime(newTime)
                                      }
                                    } catch (error) {
                                      console.log('Error in mouse up:', error)
                                    }
                                  }
                                  setIsDragging(false)
                                  document.removeEventListener('mousemove', handleMouseMove)
                                  document.removeEventListener('mouseup', handleMouseUp)
                                }
                                
                                document.addEventListener('mousemove', handleMouseMove)
                                document.addEventListener('mouseup', handleMouseUp)
                              }}
                              onTouchStart={(e) => {
                                e.preventDefault()
                                if (!e.currentTarget || duration <= 0) return
                                
                                setIsDragging(true)
                                const progressBar = e.currentTarget
                                const touch = e.touches[0]
                                
                                const handleTouchMove = (moveEvent: TouchEvent) => {
                                  if (duration > 0 && progressBar && moveEvent.touches[0]) {
                                    try {
                                      const rect = progressBar.getBoundingClientRect()
                                      if (rect && typeof rect.width === 'number' && rect.width > 0 && typeof rect.left === 'number') {
                                        const moveX = moveEvent.touches[0].clientX - rect.left
                                        const percentage = Math.max(0, Math.min(1, moveX / rect.width))
                                        const newTime = percentage * duration
                                        setCurrentTime(newTime)
                                      }
                                    } catch (error) {
                                      console.log('Error in touch move:', error)
                                    }
                                  }
                                }
                                
                                const handleTouchEnd = (endEvent: TouchEvent) => {
                                  // Use the current time that was set during dragging, not touch position
                                  if (duration > 0) {
                                    seekToTime(currentTime)
                                  }
                                  setIsDragging(false)
                                  document.removeEventListener('touchmove', handleTouchMove)
                                  document.removeEventListener('touchend', handleTouchEnd)
                                }
                                
                                document.addEventListener('touchmove', handleTouchMove, { passive: false })
                                document.addEventListener('touchend', handleTouchEnd)
                              }}
                            >
                              {/* Progress fill */}
                              <div 
                                className="absolute top-0 left-0 h-full bg-red-600 rounded-full transition-all duration-100"
                                style={{ 
                                  width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                                  pointerEvents: 'none'
                                }}
                              />
                              {/* Scrubber handle */}
                              <div 
                                className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                                style={{ 
                                  left: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%', 
                                  marginLeft: '-8px',
                                  pointerEvents: 'none'
                                }}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            {/* Left controls - Skip backward */}
                            <div className="flex items-center gap-2">
                              <button
                                className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200 hover:scale-110"
                                onClick={() => {
                                  // Skip backward 10 seconds using seekToTime
                                  const newTime = Math.max(0, currentTime - 10)
                                  seekToTime(newTime)
                                  console.log(`Skipping backward from ${currentTime}s to ${newTime}s`)
                                  
                                  // Show controls when button is clicked
                                  showControlsTemporarily()
                                }}
                                title="Skip backward 10 seconds"
                              >
                                <SkipBack className="h-5 w-5" />
                              </button>
                              <span className="text-white text-sm">-10s</span>
                            </div>

                            {/* Center controls - Play/Pause */}
                            <div className="flex items-center gap-4">
                              <button
                                className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
                                onClick={togglePlayPause}
                                title={isPlaying ? "Pause" : "Play"}
                              >
                                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                              </button>
                            </div>

                            {/* Right controls - Skip forward, Speed, and Fullscreen */}
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm">+10s</span>
                              <button
                                className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200 hover:scale-110"
                                onClick={() => {
                                  // Skip forward 10 seconds using seekToTime
                                  const newTime = Math.min(duration || currentTime + 10, currentTime + 10)
                                  seekToTime(newTime)
                                  console.log(`Skipping forward from ${currentTime}s to ${newTime}s`)
                                  
                                  // Show controls when button is clicked
                                  showControlsTemporarily()
                                }}
                                title="Skip forward 10 seconds"
                              >
                                <SkipForward className="h-5 w-5" />
                              </button>
                              
                              {/* Speed Control */}
                              <div className="flex items-center gap-1">
                                {/* Preset Speed Buttons */}
                                <div className="flex gap-1">
                                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                                    <button
                                      key={speed}
                                      className={`px-2 py-1 rounded text-xs font-mono transition-all duration-200 ${
                                        playbackSpeed === speed 
                                          ? 'bg-red-600 text-white' 
                                          : 'bg-black/50 text-white hover:bg-black/70'
                                      }`}
                                      onClick={() => changePlaybackSpeed(speed)}
                                      title={`${speed}x speed`}
                                    >
                                      {speed}x
                                    </button>
                                  ))}
                                </div>
                                
                                {/* Fine Control */}
                                <div className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-1 ml-2">
                                  <Gauge className="h-4 w-4 text-white" />
                                  <div className="flex flex-col gap-0">
                                    <button
                                      className="p-0.5 hover:bg-white/20 rounded text-white transition-all duration-200"
                                      onClick={() => {
                                        const newSpeed = Math.min(playbackSpeed + 0.25, 2)
                                        changePlaybackSpeed(newSpeed)
                                      }}
                                      title="Increase speed (+0.25x)"
                                    >
                                      <ChevronUp className="h-3 w-3" />
                                    </button>
                                    <button
                                      className="p-0.5 hover:bg-white/20 rounded text-white transition-all duration-200"
                                      onClick={() => {
                                        const newSpeed = Math.max(playbackSpeed - 0.25, 0.25)
                                        changePlaybackSpeed(newSpeed)
                                      }}
                                      title="Decrease speed (-0.25x)"
                                    >
                                      <ChevronDown className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <span className="text-white text-xs font-mono min-w-[2rem] text-center">
                                    {playbackSpeed}x
                                  </span>
                                </div>
                              </div>
                              
                              <button
                                className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200"
                                onClick={toggleFullscreen}
                                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                              >
                                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <iframe
                        key={`video-${currentLesson?.id}-${videoKey}`} // Force complete re-render when lesson changes
                        src={`https://www.youtube-nocookie.com/embed/${(currentLesson as any).youtube_video_id}?autoplay=1&rel=0&modestbranding=1&showinfo=0&controls=1&disablekb=0&fs=1&iv_load_policy=3&cc_load_policy=0&playsinline=1&origin=${window.location.origin}&enablejsapi=1&title=0&mute=0&start=0&widget_referrer=${window.location.origin}`}
                        title=""
                        className="w-full h-full select-none"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen={true}
                        sandbox="allow-scripts allow-same-origin allow-presentation"
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        onLoad={() => {
                          console.log('Video iframe loaded for lesson:', currentLesson?.title)
                          // Initialize video controls after iframe loads
                          setTimeout(() => {
                            setAutoplayEnabled(false)
                            // Ensure the iframe is ready for commands
                            const iframe = document.querySelector('iframe[src*="youtube"]') as HTMLIFrameElement
                            if (iframe && iframe.contentWindow) {
                              try {
                                // Initialize YouTube API listener
                                iframe.contentWindow.postMessage('{"event":"listening","id":"' + currentLesson?.id + '"}', '*')
                                console.log('YouTube API listener initialized for new video')
                              } catch (error) {
                                console.log('Could not initialize YouTube API:', error)
                              }
                            }
                          }, 1000)
                        }}
                        style={{ 
                          pointerEvents: 'auto',
                          userSelect: 'none',
                          WebkitUserSelect: 'none'
                        }}
                        onMouseMove={() => {
                          // Show controls when mouse moves over iframe
                          showControlsTemporarily()
                        }}
                        onMouseEnter={() => {
                          // Show controls when mouse enters iframe
                          showControlsTemporarily()
                        }}
                      />
                      
                      {/* Mouse event capture overlay - ensures controls appear on mouse movement */}
                      <div 
                        className="absolute inset-0 pointer-events-auto"
                        style={{ 
                          background: 'transparent',
                          zIndex: 2,
                          cursor: 'default'
                        }}
                        onMouseMove={() => {
                          // Always show controls when mouse moves over video
                          showControlsTemporarily()
                        }}
                        onMouseEnter={() => {
                          // Always show controls when mouse enters video
                          showControlsTemporarily()
                        }}
                        onClick={() => {
                          // Show controls and pass click through to iframe
                          showControlsTemporarily()
                        }}
                      />
                      
                      {/* Multiple security overlays */}
                      <div 
                        className="absolute inset-0 pointer-events-none select-none"
                        style={{ 
                          background: 'transparent',
                          zIndex: 1,
                          userSelect: 'none',
                          WebkitUserSelect: 'none'
                        }}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                      />
                      {/* Block YouTube logo area only - prevent redirect to YouTube */}
                      <div 
                        className="absolute bottom-2 right-2 w-12 h-4 pointer-events-auto select-none"
                        style={{ 
                          zIndex: 7,
                          userSelect: 'none',
                          background: 'transparent'
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }}
                      />
                      {/* Block YouTube copy link icon specifically */}
                      <div 
                        className="absolute bottom-3 right-14 w-6 h-6 pointer-events-auto select-none"
                        style={{ 
                          zIndex: 8,
                          background: 'transparent',
                          userSelect: 'none'
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }}
                        onMouseUp={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }}
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }}
                      />
                      {/* Block share/more options menu area */}
                      <div 
                        className="absolute bottom-3 right-8 w-6 h-6 pointer-events-auto select-none"
                        style={{ 
                          zIndex: 8,
                          background: 'transparent',
                          userSelect: 'none'
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }}
                      />
                      {/* Additional security overlay */}
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{ 
                          zIndex: 1,
                          background: 'linear-gradient(45deg, transparent 49%, rgba(0,0,0,0.01) 50%, transparent 51%)'
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {(currentLesson as any).video_duration && `Duration: ${formatDuration((currentLesson as any).video_duration)}`}
                      </div>
                      <Button onClick={() => markLessonComplete(currentLesson.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Complete
                      </Button>
                    </div>
                  </div>
                ) : currentLesson.type === 'video' && currentLesson.videoUrl ? (
                  <VideoPlayer
                    videoUrl={currentLesson.videoUrl}
                    title={currentLesson.title}
                    onComplete={() => markLessonComplete(currentLesson.id)}
                    onProgress={(currentTime, duration) => {
                      // Mark as complete when 90% watched
                      if (currentTime / duration > 0.9 && !currentLesson.completed) {
                        markLessonComplete(currentLesson.id);
                      }
                    }}
                    allowDownload={false}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Lesson Content
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <p>{currentLesson.content || "Lesson content will be available here."}</p>
                      </div>
                      
                      <div className="mt-6">
                        <Button onClick={() => markLessonComplete(currentLesson.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Complete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Lesson Navigation */}
                <div className="flex justify-between items-center pt-6 border-t">
                  <div>
                    {currentLesson.completed && (
                      <Badge variant="secondary" className="text-sm">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {getNextLesson(currentLesson.id) && (
                      <Button 
                        onClick={() => {
                          const nextLesson = getNextLesson(currentLesson.id);
                          if (nextLesson) selectLesson(nextLesson);
                        }}
                      >
                        Next Lesson
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Lesson</h3>
                <p className="text-muted-foreground">
                  Choose a lesson from the sidebar to start learning
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
