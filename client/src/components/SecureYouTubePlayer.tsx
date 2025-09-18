import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertCircle, Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

interface SecureYouTubePlayerProps {
  videoId: string
  studentName: string
  studentId: string
  onVideoEnd?: () => void
  onProgress?: (progress: number) => void
  className?: string
  autoplay?: boolean
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export function SecureYouTubePlayer({
  videoId,
  studentName,
  studentId,
  onVideoEnd,
  onProgress,
  className,
  autoplay = false
}: SecureYouTubePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null)
  const ytPlayerRef = useRef<any>(null)
  const watermarkRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 20, y: 20 })
  const { toast } = useToast()

  // Disable right-click and keyboard shortcuts for security
  useEffect(() => {
    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    const disableKeyboardShortcuts = (e: KeyboardEvent) => {
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

    document.addEventListener('contextmenu', disableRightClick)
    document.addEventListener('keydown', disableKeyboardShortcuts)

    return () => {
      document.removeEventListener('contextmenu', disableRightClick)
      document.removeEventListener('keydown', disableKeyboardShortcuts)
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

    const interval = setInterval(animateWatermark, 30000)
    return () => clearInterval(interval)
  }, [])

  // Initialize YouTube player with maximum restrictions
  useEffect(() => {
    if (!videoId) return

    const initializePlayer = () => {
      if (!playerRef.current) return

      // Create a hidden iframe container
      const iframeContainer = document.createElement('div')
      iframeContainer.style.position = 'absolute'
      iframeContainer.style.top = '0'
      iframeContainer.style.left = '0'
      iframeContainer.style.width = '100%'
      iframeContainer.style.height = '100%'
      iframeContainer.style.pointerEvents = 'none'
      iframeContainer.style.overflow = 'hidden'

      playerRef.current.appendChild(iframeContainer)

      ytPlayerRef.current = new window.YT.Player(iframeContainer, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          controls: 0, // Completely disable YouTube controls
          disablekb: 1, // Disable keyboard controls
          fs: 0, // Disable fullscreen
          iv_load_policy: 3, // Disable annotations
          modestbranding: 1, // Remove YouTube logo
          rel: 0, // Don't show related videos
          showinfo: 0, // Don't show video info
          cc_load_policy: 0, // Disable captions
          playsinline: 1, // Play inline on mobile
          origin: window.location.origin,
          enablejsapi: 1,
          start: 0,
          end: 0,
          loop: 0,
          color: 'white',
          hl: 'en',
          // Additional restrictions
          widget_referrer: window.location.origin,
          host: window.location.hostname,
          // Disable all interactive elements
          autohide: 0,
          theme: 'dark'
        },
        events: {
          onReady: (event: any) => {
            setLoading(false)
            setDuration(event.target.getDuration())

            // Override global clipboard API to intercept ALL YouTube URL copies
            const fakeUrl = 'https://learnova.com/protected-content'
            const originalWriteText = navigator.clipboard?.writeText
            if (originalWriteText) {
              navigator.clipboard.writeText = async (text: string) => {
                if (text.includes('youtube.com') || text.includes('youtu.be')) {
                  await originalWriteText.call(navigator.clipboard, fakeUrl)
                  toast({
                    title: 'Link Copied',
                    description: 'Content protected',
                    variant: 'default'
                  })
                  return
                }
                return originalWriteText.call(navigator.clipboard, text)
              }
            }
            
            // Aggressive continuous monitoring and removal
            const iframeElement = event.target.getIframe()
            
            // Set up continuous monitoring to remove copy buttons
            const aggressiveMonitoring = setInterval(() => {
              try {
                // Remove from main document
                const mainCopyButtons = document.querySelectorAll(
                  '.ytp-copylink-button, .ytp-share-button, [aria-label*="Copy"], [aria-label*="Share"], [title*="Copy"], [title*="Share"]'
                )
                mainCopyButtons.forEach((btn: any) => {
                  btn.remove()
                })
                
                // Try to access iframe and remove from there too
                if (iframeElement && iframeElement.contentDocument) {
                  const iframeCopyButtons = iframeElement.contentDocument.querySelectorAll(
                    '.ytp-copylink-button, .ytp-share-button, [aria-label*="Copy"], [aria-label*="Share"], [title*="Copy"], [title*="Share"], .ytp-chrome-bottom, .ytp-chrome-controls'
                  )
                  iframeCopyButtons.forEach((btn: any) => {
                    btn.remove()
                  })
                  
                  // Also hide by setting styles directly
                  const allButtons = iframeElement.contentDocument.querySelectorAll('button, [role="button"]')
                  allButtons.forEach((btn: any) => {
                    const ariaLabel = btn.getAttribute('aria-label') || ''
                    const title = btn.getAttribute('title') || ''
                    if (ariaLabel.toLowerCase().includes('copy') || 
                        ariaLabel.toLowerCase().includes('share') ||
                        title.toLowerCase().includes('copy') ||
                        title.toLowerCase().includes('share')) {
                      btn.style.display = 'none !important'
                      btn.style.visibility = 'hidden !important'
                      btn.style.opacity = '0 !important'
                      btn.style.pointerEvents = 'none !important'
                      btn.remove()
                    }
                  })
                }
              } catch (e) {
                // Cross-origin restrictions
              }
            }, 100) // Check every 100ms
            
            // Clean up after 5 minutes
            setTimeout(() => clearInterval(aggressiveMonitoring), 300000)
            
            // Also try iframe-level interception as backup
            if (iframeElement && iframeElement.contentWindow && iframeElement.contentWindow.document) {
              try {
                iframeElement.contentWindow.document.addEventListener(
                  'click',
                  (ev: any) => {
                    const btn = ev.target?.closest?.('.ytp-copylink-button')
                    if (btn) {
                      ev.preventDefault()
                      ev.stopPropagation()
                      // write fake URL to clipboard
                      if (navigator.clipboard?.writeText) {
                        navigator.clipboard.writeText(fakeUrl).catch(() => {})
                      }
                      toast({
                        title: 'Link Copied',
                        description: 'Content protected',
                        variant: 'default'
                      })
                    }
                  },
                  true
                )
              } catch (e) {
                console.log('Copy-link interception failed:', e)
              }
            }
            
            // Completely hide the iframe to prevent any YouTube UI
            const iframe = iframeElement
            if (iframe) {
              iframe.style.pointerEvents = 'none'
              iframe.style.border = 'none'
              iframe.style.outline = 'none'
              
              // Add CSS to hide YouTube controls
              const style = document.createElement('style')
              style.textContent = `
                /* Completely hide ALL YouTube UI elements */
                .ytp-chrome-top,
                .ytp-chrome-bottom,
                .ytp-chrome-controls,
                .ytp-gradient-bottom,
                .ytp-watermark,
                .ytp-gradient-top,
                .ytp-show-cards-title,
                .ytp-pause-overlay,
                .ytp-share-button,
                .ytp-watch-later-button,
                .ytp-copylink-button,
                .ytp-copylink-button-icon,
                .ytp-copylink-button-text,
                .ytp-share-panel,
                .ytp-contextmenu,
                .ytp-popup,
                .ytp-endscreen-element,
                .ytp-title,
                .ytp-title-link,
                .ytp-title-channel,
                .ytp-right-controls,
                .ytp-left-controls,
                .ytp-center-controls,
                .ytp-progress-bar-container,
                .ytp-button[data-tooltip-target-id*="share"],
                .ytp-button[data-tooltip-target-id*="copy"],
                .ytp-button[aria-label*="Share"],
                .ytp-button[aria-label*="Copy"],
                .ytp-button[aria-label*="نسخ"],
                .ytp-button[title*="Copy"],
                .ytp-button[title*="نسخ"],
                button[aria-label*="Copy link"],
                button[aria-label*="نسخ الرابط"],
                svg[aria-label*="Copy"],
                svg[aria-label*="نسخ"],
                /* Target any button with copy-related content */
                *[class*="copy"],
                *[class*="Copy"],
                *[class*="share"],
                *[class*="Share"],
                /* Hide entire control bar */
                .html5-video-controls,
                .ytp-chrome-controls {
                  display: none !important;
                  visibility: hidden !important;
                  opacity: 0 !important;
                  pointer-events: none !important;
                  position: absolute !important;
                  left: -9999px !important;
                  top: -9999px !important;
                  width: 0 !important;
                  height: 0 !important;
                  z-index: -9999 !important;
                }
                
                /* Force hide iframe content */
                iframe[src*="youtube"] * {
                  pointer-events: none !important;
                }
              `
              document.head.appendChild(style)
            }
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
            setLoading(false)
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

    return () => {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy()
        ytPlayerRef.current = null
      }
    }
  }, [videoId, autoplay, onVideoEnd, toast])

  // Track video progress
  useEffect(() => {
    if (!ytPlayerRef.current) return

    const trackProgress = () => {
      if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
        const current = ytPlayerRef.current.getCurrentTime()
        const total = ytPlayerRef.current.getDuration()
        setCurrentTime(current)
        if (total > 0 && onProgress) {
          const progress = (current / total) * 100
          onProgress(progress)
        }
      }
    }

    const interval = setInterval(trackProgress, 1000)
    return () => clearInterval(interval)
  }, [onProgress])

  // Control functions
  const togglePlay = () => {
    if (!ytPlayerRef.current) return
    
    if (isPlaying) {
      ytPlayerRef.current.pauseVideo()
    } else {
      ytPlayerRef.current.playVideo()
    }
  }

  const handleSeek = (value: number[]) => {
    if (!ytPlayerRef.current || !duration) return
    
    const newTime = (value[0] / 100) * duration
    ytPlayerRef.current.seekTo(newTime, true)
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    if (!ytPlayerRef.current) return
    
    const newVolume = value[0]
    ytPlayerRef.current.setVolume(newVolume)
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (!ytPlayerRef.current) return
    
    if (isMuted) {
      ytPlayerRef.current.unMute()
      ytPlayerRef.current.setVolume(volume)
      setIsMuted(false)
    } else {
      ytPlayerRef.current.mute()
      setIsMuted(true)
    }
  }

  const toggleFullscreen = () => {
    if (!playerRef.current) return
    
    if (!isFullscreen) {
      if (playerRef.current.requestFullscreen) {
        playerRef.current.requestFullscreen()
        setIsFullscreen(true)
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading secure video...</p>
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
          <Button
            onClick={() => window.location.reload()}
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
      <div 
        className="relative w-full group cursor-pointer"
        style={{ aspectRatio: '16/9' }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onClick={togglePlay}
      >
        <div
          ref={playerRef}
          className="absolute inset-0 w-full h-full"
        />
        
        {/* Watermark Overlay */}
        <div
          ref={watermarkRef}
          className="absolute pointer-events-none select-none z-50 transition-all duration-1000 ease-in-out"
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

        {/* Complete YouTube UI blocking overlay */}
        <div className="absolute inset-0 pointer-events-none z-30 bg-transparent">
          {/* Block ALL YouTube interactions - complete overlay */}
          <div className="absolute inset-0 bg-transparent pointer-events-auto z-40"
               onClick={(e) => { e.stopPropagation(); togglePlay(); }}
               onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
               onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
               onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
               onMouseUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
               style={{ cursor: 'pointer' }} />
          
          {/* Extra blocking for bottom area */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-black pointer-events-auto z-50"
               onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
               style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.9))' }} />
        </div>

        {/* Play button overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center z-40">
            <Button
              size="lg"
              className="bg-black/50 hover:bg-black/70 text-white border-0 rounded-full w-16 h-16"
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            >
              <Play className="h-8 w-8 ml-1" />
            </Button>
          </div>
        )}

        {/* Custom Controls */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 z-40 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div className="mb-4">
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
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>

              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                />
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
