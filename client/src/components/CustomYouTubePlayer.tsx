import React, { useEffect, useRef, useState, useCallback } from 'react'
// @ts-ignore
import Plyr from 'plyr'
import 'plyr/dist/plyr.css'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CustomYouTubePlayerProps {
  videoId: string
  studentName: string
  studentId: string
  onVideoEnd?: () => void
  onProgress?: (progress: number) => void
  className?: string
  autoplay?: boolean
}

interface VideoToken {
  token: string
  expiresAt: string
  videoId: string
}

export function CustomYouTubePlayer({
  videoId,
  studentName,
  studentId,
  onVideoEnd,
  onProgress,
  className,
  autoplay = false
}: CustomYouTubePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null)
  const plyrRef = useRef<Plyr | null>(null)
  const watermarkRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 20, y: 20 })
  const { toast } = useToast()

  // Disable right-click and keyboard shortcuts for security
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

  // Aggressive copy link blocker - runs continuously
  useEffect(() => {
    const blockCopyLinkElements = () => {
      // Target ONLY YouTube copy/share elements - be specific!
      const selectors = [
        '.ytp-copylink-button',
        '.ytp-share-button',
        '.ytp-share-panel',
        'iframe[src*="youtube"] button[aria-label*="Copy link"]',
        'iframe[src*="youtube"] button[aria-label*="Share"]',
        'iframe[src*="youtube"] button[title*="Copy link"]',
        'iframe[src*="youtube"] button[title*="Share"]',
        '.ytp-contextmenu',
        '.ytp-popup',
        '.ytp-chrome-top',
        '.ytp-chrome-bottom',
        '.ytp-watermark',
        '.ytp-title',
        '.ytp-pause-overlay'
      ]

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        elements.forEach(element => {
          if (element instanceof HTMLElement) {
            element.style.display = 'none'
            element.style.visibility = 'hidden'
            element.style.opacity = '0'
            element.style.pointerEvents = 'none'
            element.style.position = 'absolute'
            element.style.left = '-9999px'
            element.style.top = '-9999px'
            element.style.width = '0'
            element.style.height = '0'
            element.remove() // Completely remove the element
          }
        })
      })

      // Block any iframe content that might show YouTube UI
      const iframes = document.querySelectorAll('iframe[src*="youtube"]')
      iframes.forEach(iframe => {
        if (iframe instanceof HTMLIFrameElement) {
          iframe.style.pointerEvents = 'none'
          
          // Try to access iframe content and block elements (if same-origin)
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
            if (iframeDoc) {
              selectors.forEach(selector => {
                const elements = iframeDoc.querySelectorAll(selector)
                elements.forEach(element => {
                  if (element instanceof HTMLElement) {
                    element.style.display = 'none'
                    element.remove()
                  }
                })
              })
            }
          } catch (e) {
            // Cross-origin iframe - can't access content, but that's expected
            console.log('Cross-origin iframe detected (expected for YouTube)')
          }
        }
      })
    }

    // Run immediately
    blockCopyLinkElements()

    // Run every 500ms to catch dynamically loaded elements
    const interval = setInterval(blockCopyLinkElements, 500)

    // Also run on DOM mutations
    const observer = new MutationObserver(blockCopyLinkElements)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'aria-label', 'title']
    })

    return () => {
      clearInterval(interval)
      observer.disconnect()
    }
  }, [])

  // Initialize Plyr player
  useEffect(() => {
    if (!playerRef.current || !videoId) return

    try {
      // Create iframe element for YouTube embed with maximum restrictions
      const iframe = document.createElement('iframe')
      iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?` + new URLSearchParams({
        autoplay: autoplay ? '1' : '0',
        controls: '0', // Disable YouTube controls completely
        disablekb: '1', // Disable keyboard controls
        fs: '0', // Disable fullscreen button
        iv_load_policy: '3', // Disable annotations
        modestbranding: '1', // Remove YouTube logo
        rel: '0', // Don't show related videos
        showinfo: '0', // Don't show video info
        cc_load_policy: '0', // Disable captions by default
        playsinline: '1', // Play inline on mobile
        origin: window.location.origin,
        enablejsapi: '1',
        start: '0',
        end: '0',
        loop: '0',
        playlist: '',
        color: 'white',
        hl: 'en',
        cc_lang_pref: 'en',
        widget_referrer: window.location.origin
      }).toString()
      
      iframe.width = '100%'
      iframe.height = '100%'
      iframe.frameBorder = '0'
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
      iframe.allowFullscreen = false // Disable YouTube's fullscreen
      iframe.style.pointerEvents = 'none' // Completely disable iframe interaction
      iframe.style.border = 'none'
      iframe.style.outline = 'none'
      iframe.style.userSelect = 'none'
      iframe.style.webkitUserSelect = 'none'
      
      // Clear previous content
      playerRef.current.innerHTML = ''
      playerRef.current.appendChild(iframe)

      // Initialize Plyr with custom configuration
      plyrRef.current = new Plyr(iframe, {
        youtube: {
          noCookie: true, // Use youtube-nocookie.com
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          modestbranding: 1
        },
        controls: [
          'play-large' // ONLY the large play button in center
        ],
        settings: [], // Remove settings menu
        tooltips: {
          controls: true,
          seek: true
        },
        keyboard: {
          focused: false, // Disable keyboard shortcuts when focused
          global: false // Disable global keyboard shortcuts
        },
        clickToPlay: false, // Disable click to play - only center button works
        hideControls: false, // Show the play button
        resetOnEnd: false,
        ratio: '16:9', // Maintain aspect ratio
        fullscreen: {
          enabled: true,
          fallback: true,
          iosNative: false // Use custom fullscreen on iOS
        }
      })

      // Event listeners
      plyrRef.current.on('ready', () => {
        setLoading(false)
        console.log('Custom YouTube player ready')
      })

      plyrRef.current.on('play', () => {
        console.log('Video started playing')
      })

      plyrRef.current.on('pause', () => {
        console.log('Video paused')
      })

      plyrRef.current.on('ended', () => {
        console.log('Video ended')
        if (onVideoEnd) {
          onVideoEnd()
        }
      })

      plyrRef.current.on('timeupdate', () => {
        if (onProgress && plyrRef.current) {
          const currentTime = plyrRef.current.currentTime
          const duration = plyrRef.current.duration
          if (duration > 0) {
            const progress = (currentTime / duration) * 100
            onProgress(progress)
          }
        }
      })

      plyrRef.current.on('error', (event: any) => {
        console.error('Plyr error:', event)
        setError('Video failed to load. Please try again.')
        setLoading(false)
        toast({
          title: 'Video Error',
          description: 'The video could not be loaded.',
          variant: 'destructive'
        })
      })

    } catch (err) {
      console.error('Error initializing player:', err)
      setError('Failed to initialize video player.')
      setLoading(false)
    }

    // Cleanup
    return () => {
      if (plyrRef.current) {
        plyrRef.current.destroy()
        plyrRef.current = null
      }
    }
  }, [videoId, autoplay, onVideoEnd, onProgress, toast])

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
      <div className="relative w-full">
        <div
          ref={playerRef}
          className="plyr__video-embed w-full"
          style={{ aspectRatio: '16/9' }}
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

        {/* Complete overlay - ONLY allow center play button */}
        <div className="absolute inset-0 z-30">
          {/* Block everything first */}
          <div className="absolute inset-0 bg-transparent pointer-events-auto cursor-default" 
               onClick={(e) => {
                 e.preventDefault()
                 e.stopPropagation()
                 return false
               }} />
          
          {/* Allow ONLY the center play button area - higher z-index */}
          <button 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full pointer-events-auto cursor-pointer z-40 bg-black bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center border-0 outline-none focus:ring-2 focus:ring-white"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Play button clicked!')
              // Trigger play using multiple methods
              try {
                if (plyrRef.current) {
                  console.log('Plyr instance found, current paused state:', plyrRef.current.paused)
                  if (plyrRef.current.paused) {
                    plyrRef.current.play()
                    console.log('Play triggered')
                  } else {
                    plyrRef.current.pause()
                    console.log('Pause triggered')
                  }
                } else {
                  console.log('No Plyr instance found')
                }
              } catch (error) {
                console.error('Error controlling video:', error)
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            <div className="w-8 h-8 text-white opacity-80 pointer-events-none">
              ▶️
            </div>
          </button>
        </div>

        {/* Anti-screenshot overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 bg-transparent" />
      </div>
    </div>
  )
}

// Custom CSS to aggressively hide YouTube branding and sharing options
const customStyles = `
  /* Hide YouTube logo and branding */
  .plyr__video-embed iframe {
    pointer-events: none !important;
  }
  
  /* Custom Plyr styling */
  .plyr--youtube .plyr__control--overlaid {
    background: rgba(0, 0, 0, 0.8);
    border-radius: 50%;
  }
  
  .plyr--youtube .plyr__control--overlaid:hover {
    background: rgba(0, 0, 0, 0.9);
  }
  
  /* Aggressively hide ALL YouTube elements that might appear */
  .plyr--youtube .ytp-chrome-top,
  .plyr--youtube .ytp-chrome-bottom,
  .plyr--youtube .ytp-watermark,
  .plyr--youtube .ytp-gradient-top,
  .plyr--youtube .ytp-gradient-bottom,
  .plyr--youtube .ytp-show-cards-title,
  .plyr--youtube .ytp-pause-overlay,
  .plyr--youtube .ytp-share-button,
  .plyr--youtube .ytp-watch-later-button,
  .plyr--youtube .ytp-copylink-button,
  .plyr--youtube .ytp-share-panel,
  .plyr--youtube .ytp-share-button-visible,
  .plyr--youtube .ytp-menuitem-label,
  .plyr--youtube .ytp-menuitem-content,
  .plyr--youtube .ytp-contextmenu,
  .plyr--youtube .ytp-popup,
  .plyr--youtube .ytp-cards-teaser,
  .plyr--youtube .ytp-ce-element,
  .plyr--youtube .ytp-suggested-action,
  .plyr--youtube .ytp-endscreen-element,
  .plyr--youtube .ytp-title,
  .plyr--youtube .ytp-title-link,
  .plyr--youtube .ytp-title-channel,
  .plyr--youtube .ytp-videowall-still,
  .plyr--youtube .ytp-impression-link,
  .plyr--youtube .iv-click-target,
  .plyr--youtube .iv-promo,
  .plyr--youtube .annotation,
  .plyr--youtube .ytp-button[data-tooltip-target-id*="share"],
  .plyr--youtube .ytp-button[data-tooltip-target-id*="copy"],
  .plyr--youtube .ytp-button[aria-label*="Share"],
  .plyr--youtube .ytp-button[aria-label*="Copy"],
  .plyr--youtube button[aria-label*="Copy"],
  .plyr--youtube button[title*="Copy"],
  .plyr--youtube *[class*="copy"],
  .plyr--youtube *[class*="share"],
  .plyr--youtube *[id*="copy"],
  .plyr--youtube *[id*="share"] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    position: absolute !important;
    left: -9999px !important;
    top: -9999px !important;
    width: 0 !important;
    height: 0 !important;
  }
  
  /* Hide any iframe content that might show YouTube UI */
  iframe[src*="youtube.com"],
  iframe[src*="youtube-nocookie.com"] {
    pointer-events: none !important;
  }
  
  /* Block any overlays or popups */
  .plyr--youtube::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 1;
  }
  
  /* Hide ALL Plyr controls - we use our custom button */
  .plyr__controls {
    display: none !important;
  }
  
  .plyr__control--overlaid {
    display: none !important;
  }
  
  /* Ensure our custom play button works */
  button[class*="rounded-full"] {
    pointer-events: auto !important;
    z-index: 9999 !important;
  }
  
  /* Make sure button clicks work */
  .video-player button {
    pointer-events: auto !important;
    user-select: none !important;
  }
  
  /* Progress bar styling */
  .plyr__progress {
    height: 4px;
  }
  
  .plyr__progress--buffer {
    color: rgba(255, 255, 255, 0.3);
  }
  
  .plyr__progress--played {
    color: #3b82f6;
  }
  
  /* Volume control */
  .plyr__volume {
    max-width: 90px;
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .plyr__controls {
      padding: 10px;
    }
    
    .plyr__volume {
      display: none;
    }
  }
`

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = customStyles
  document.head.appendChild(styleSheet)
}
