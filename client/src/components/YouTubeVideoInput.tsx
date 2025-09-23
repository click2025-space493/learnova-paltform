import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Youtube, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface YouTubeVideoInputProps {
  onVideoSelect: (videoData: {
    youtubeVideoId: string
    youtubeVideoUrl: string
    title?: string
    duration?: number
    thumbnail?: string
  }) => void
  initialUrl?: string
  className?: string
}

interface VideoInfo {
  id: string
  title: string
  duration: number
  thumbnail: string
  channelTitle: string
}

export function YouTubeVideoInput({ 
  onVideoSelect, 
  initialUrl = '',
  className 
}: YouTubeVideoInputProps) {
  const [url, setUrl] = useState(initialUrl || '')
  const [loading, setLoading] = useState(false)
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const { toast } = useToast()

  // Extract YouTube video ID from various URL formats
  const extractVideoId = useCallback((url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1]
      }
    }
    return null
  }, [])

  // Validate YouTube URL and extract video info
  const validateAndExtractInfo = useCallback(async (inputUrl: string) => {
    setLoading(true)
    setError(null)
    setVideoInfo(null)

    try {
      const videoId = extractVideoId((inputUrl || '').trim())
      
      if (!videoId) {
        throw new Error('Invalid YouTube URL. Please provide a valid YouTube video URL or video ID.')
      }

      // Check if video ID format is valid (11 characters, alphanumeric + underscore + hyphen)
      if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        throw new Error('Invalid YouTube video ID format.')
      }

      // Create a proper YouTube URL
      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`

      // For now, we'll create mock video info since we can't access YouTube API directly
      // In production, you would use YouTube Data API v3 to get real video information
      const mockVideoInfo: VideoInfo = {
        id: videoId,
        title: 'YouTube Video', // Would be fetched from API
        duration: 0, // Would be fetched from API
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        channelTitle: 'Unknown Channel' // Would be fetched from API
      }

      setVideoInfo(mockVideoInfo)
      
      // Call the parent callback with video data
      console.log('YouTube video selected:', { youtubeVideoId: videoId, youtubeVideoUrl: youtubeUrl });
      onVideoSelect({
        youtubeVideoId: videoId,
        youtubeVideoUrl: youtubeUrl,
        duration: 0 // We don't get duration from YouTube API in this simple implementation
      });

      toast({
        title: 'Video Added',
        description: `YouTube video ${videoId} has been added to the lesson.`,
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process YouTube URL'
      setError(errorMessage)
      toast({
        title: 'Invalid YouTube URL',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [extractVideoId, onVideoSelect, toast])

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value
    setUrl(newUrl)
    setError(null)
    
    // Clear video info if URL is cleared
    if (!(newUrl || '').trim()) {
      setVideoInfo(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((url || '').trim()) {
      validateAndExtractInfo(url || '')
    }
  }

  const clearVideo = () => {
    setUrl('')
    setVideoInfo(null)
    setError(null)
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-600" />
          YouTube Video
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="youtube-url">YouTube Video URL or ID</Label>
            <div className="flex gap-2">
              <Input
                id="youtube-url"
                type="text"
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ or dQw4w9WgXcQ"
                value={url}
                onChange={handleUrlChange}
                disabled={loading}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={!(url || '').trim() || loading}
                size="default"
              >
                {loading ? 'Validating...' : 'Add Video'}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Paste a YouTube URL or video ID. Make sure the video is set to <strong>Unlisted</strong> for security.
            </p>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Video Info Display */}
        {videoInfo && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-green-900">Video Added Successfully</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearVideo}
                    className="text-green-700 hover:text-green-900"
                  >
                    Change Video
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Video Thumbnail */}
                  <div className="space-y-2">
                    <img
                      src={videoInfo.thumbnail}
                      alt="Video thumbnail"
                      className="w-full h-32 object-cover rounded-lg border"
                      onError={(e) => {
                        // Fallback to default thumbnail if maxres doesn't exist
                        const target = e.target as HTMLImageElement
                        target.src = `https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg`
                      }}
                    />
                    <a
                      href={`https://www.youtube.com/watch?v=${videoInfo.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View on YouTube
                    </a>
                  </div>

                  {/* Video Details */}
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Video ID:</span>
                      <span className="ml-2 font-mono text-gray-900">{videoInfo.id}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Channel:</span>
                      <span className="ml-2 text-gray-900">{videoInfo.channelTitle}</span>
                    </div>
                    {videoInfo.duration > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">Duration:</span>
                        <span className="ml-2 text-gray-900">{formatDuration(videoInfo.duration)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 mb-2">Security Instructions:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Set your YouTube video to <strong>Unlisted</strong> (not Public or Private)</li>
            <li>• Unlisted videos can only be viewed by people with the link</li>
            <li>• Students will watch videos through Learnova's secure player</li>
            <li>• The original YouTube link will not be visible to students</li>
          </ul>
        </div>

        {/* YouTube API Note for Developers */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            <strong>Developer Note:</strong> To get real video titles, durations, and channel info, 
            integrate with YouTube Data API v3. Add your API key to environment variables and 
            implement the API calls in this component.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
