import React, { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SecureYouTubePlayer } from './SecureYouTubePlayer'

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
  const { toast } = useToast()


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
    <SecureYouTubePlayer
      videoId={videoToken?.videoId || ''}
      studentName={studentName}
      studentId={studentId}
      onVideoEnd={onVideoEnd}
      onProgress={onProgress}
      className={className}
      autoplay={false}
    />
  )
}

