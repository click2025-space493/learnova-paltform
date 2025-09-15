import React, { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Play, Pause, Volume2, VolumeX, Maximize, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SecureVideoPlayerProps {
  lessonId: string
  courseId: string
  studentName: string
  studentId: string
  onVideoEnd?: () => void
  onProgress?: (progress: number) => void
  className?: string
}

interface VideoToken {
  token: string
  expiresAt: string
  videoId: string
}

export function SecureVideoPlayer({
  lessonId,
  courseId,
  studentName,
  studentId,
  onVideoEnd,
  onProgress,
  className
}: SecureVideoPlayerProps) {
  const [videoToken, setVideoToken] = useState<VideoToken | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Debug logging
  console.log('SecureVideoPlayer props:', { lessonId, courseId, studentName, studentId });
  const [player, setPlayer] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 20, y: 20 })
  
  const playerRef = useRef<HTMLDivElement>(null)
  const watermarkRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Disable right-click and keyboard shortcuts
  useEffect(() => {
    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    const disableKeyboardShortcuts = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, PrintScreen
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's') ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault()
        return false
      }
    }

    const disableTextSelection = (e: Event) => {
      e.preventDefault()
      return false
    }

    document.addEventListener('contextmenu', disableRightClick)
    document.addEventListener('keydown', disableKeyboardShortcuts)
    document.addEventListener('selectstart', disableTextSelection)
    document.addEventListener('dragstart', disableTextSelection)

    return () => {
      document.removeEventListener('contextmenu', disableRightClick)
      document.removeEventListener('keydown', disableKeyboardShortcuts)
      document.removeEventListener('selectstart', disableTextSelection)
      document.removeEventListener('dragstart', disableTextSelection)
    }
  }, [])

  // Animate watermark position
  useEffect(() => {
    const animateWatermark = () => {
      if (!playerRef.current) return

      const container = playerRef.current
      const containerWidth = container.offsetWidth
      const containerHeight = container.offsetHeight
      const watermarkWidth = 200
      const watermarkHeight = 40

      const maxX = containerWidth - watermarkWidth - 40
      const maxY = containerHeight - watermarkHeight - 40

      const newX = Math.random() * Math.max(0, maxX) + 20
      const newY = Math.random() * Math.max(0, maxY) + 20

      setWatermarkPosition({ x: newX, y: newY })
    }

    // Change watermark position every 30 seconds
    const interval = setInterval(animateWatermark, 30000)
    return () => clearInterval(interval)
  }, [])

  // Generate video access token
  const generateToken = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Authentication required')
      }

      const response = await supabase.functions.invoke('video-token', {
        body: { lessonId, courseId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate video token')
      }

      setVideoToken(response.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load video'
      setError(errorMessage)
      toast({
        title: 'Video Access Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [lessonId, courseId, toast])

  // Initialize YouTube player
  useEffect(() => {
    if (!videoToken || !window.YT) return

    const initializePlayer = () => {
      if (!playerRef.current) return

      const ytPlayer = new window.YT.Player(playerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoToken.videoId,
        playerVars: {
          autoplay: 0,
          controls: 0, // Disable YouTube controls
          disablekb: 1, // Disable keyboard controls
          fs: 0, // Disable fullscreen
          iv_load_policy: 3, // Disable annotations
          modestbranding: 1, // Remove YouTube logo
          rel: 0, // Don't show related videos
          showinfo: 0, // Don't show video info
          origin: window.location.origin,
          enablejsapi: 1
        },
        events: {
          onReady: (event: any) => {
            setPlayer(event.target)
            setLoading(false)
          },
          onStateChange: (event: any) => {
            const state = event.data
            setIsPlaying(state === window.YT.PlayerState.PLAYING)
            
            if (state === window.YT.PlayerState.ENDED && onVideoEnd) {
              onVideoEnd()
            }
          },
          onError: (event: any) => {
            setError('Video failed to load. Please try again.')
            toast({
              title: 'Video Error',
              description: 'The video could not be loaded.',
              variant: 'destructive'
            })
          }
        }
      })
    }

    // Load YouTube API if not already loaded
    if (!window.YT) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      document.body.appendChild(script)

      window.onYouTubeIframeAPIReady = initializePlayer
    } else {
      initializePlayer()
    }
  }, [videoToken, onVideoEnd, toast])

  // Track video progress
  useEffect(() => {
    if (!player || !onProgress) return

    const trackProgress = () => {
      if (player.getCurrentTime && player.getDuration) {
        const currentTime = player.getCurrentTime()
        const duration = player.getDuration()
        if (duration > 0) {
          const progress = (currentTime / duration) * 100
          onProgress(progress)
        }
      }
    }

    const interval = setInterval(trackProgress, 1000)
    return () => clearInterval(interval)
  }, [player, onProgress])

  // Token expiry check
  useEffect(() => {
    if (!videoToken) return

    const checkTokenExpiry = () => {
      const expiryTime = new Date(videoToken.expiresAt).getTime()
      const now = Date.now()
      
      if (now >= expiryTime - 60000) { // Refresh 1 minute before expiry
        generateToken()
      }
    }

    const interval = setInterval(checkTokenExpiry, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [videoToken, generateToken])

  // Initialize token generation
  useEffect(() => {
    generateToken()
  }, [generateToken])

  // Player controls
  const togglePlay = () => {
    if (!player) return
    
    if (isPlaying) {
      player.pauseVideo()
    } else {
      player.playVideo()
    }
  }

  const toggleMute = () => {
    if (!player) return
    
    if (isMuted) {
      player.unMute()
    } else {
      player.mute()
    }
    setIsMuted(!isMuted)
  }

  const handleFullscreen = () => {
    if (!playerRef.current) return
    
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      playerRef.current.requestFullscreen()
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading secure video...</p>
          <p className="text-xs text-gray-500 mt-2">Debug: lessonId={lessonId}, courseId={courseId}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 bg-red-50 rounded-lg ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <p className="text-xs text-gray-500 mb-4">Debug: lessonId={lessonId}, courseId={courseId}</p>
          <Button
            onClick={generateToken}
            size="sm"
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video Player Container */}
      <div className="relative w-full h-0 pb-[56.25%]"> {/* 16:9 aspect ratio */}
        <div
          ref={playerRef}
          className="absolute top-0 left-0 w-full h-full"
          style={{ pointerEvents: 'none' }} // Disable direct interaction with YouTube player
        />
        
        {/* Watermark Overlay */}
        <div
          ref={watermarkRef}
          className="absolute pointer-events-none select-none z-10 transition-all duration-1000 ease-in-out"
          style={{
            left: `${watermarkPosition.x}px`,
            top: `${watermarkPosition.y}px`,
            transform: 'translate(0, 0)'
          }}
        >
          <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm font-medium">
            {studentName} • ID: {studentId}
          </div>
        </div>

        {/* Custom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={togglePlay}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleMute}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleFullscreen}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Anti-screenshot overlay (semi-transparent) */}
        <div className="absolute inset-0 pointer-events-none z-5 bg-transparent" />
      </div>

      {/* Token expiry warning */}
      {videoToken && (
        <div className="absolute top-2 right-2 z-30">
          <div className="bg-red-600 text-white text-xs px-2 py-1 rounded">
            Expires: {new Date(videoToken.expiresAt).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  )
}

// Extend window type for YouTube API
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}
