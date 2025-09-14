import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, CheckCircle, AlertCircle, Play } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface VideoUploadProps {
  onUploadComplete: (videoData: {
    url: string
    publicId: string
    duration?: number
    format?: string
    bytes?: number
  }) => void
  maxSizeGB?: number
  acceptedFormats?: string[]
  className?: string
}

interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export function VideoUploadCloudinary({ 
  onUploadComplete, 
  maxSizeGB = 2,
  acceptedFormats = ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  className 
}: VideoUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 })
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadMessage, setUploadMessage] = useState<string>('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { toast } = useToast()

  const validateFile = useCallback((file: File): string | null => {
    // Check file size (convert GB to bytes)
    const maxSizeBytes = maxSizeGB * 1024 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeGB}GB limit. Current size: ${(file.size / (1024 * 1024 * 1024)).toFixed(2)}GB`
    }

    // Check file format
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!fileExtension || !acceptedFormats.includes(fileExtension)) {
      return `Unsupported format. Accepted formats: ${acceptedFormats.join(', ')}`
    }

    // Check if it's actually a video file
    if (!file.type.startsWith('video/')) {
      return 'Selected file is not a video file'
    }

    return null
  }, [maxSizeGB, acceptedFormats])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    const validationError = validateFile(selectedFile)
    if (validationError) {
      setError(validationError)
      toast({
        title: 'Invalid File',
        description: validationError,
        variant: 'destructive'
      })
      return
    }

    setFile(selectedFile)
    setError(null)
    setUploadStatus('idle')
    
    // Create preview URL
    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)
  }, [validateFile, toast])

  const uploadToSupabase = useCallback(async (file: File) => {
    console.log('🚀 Starting upload to Supabase Edge Function')
    console.log('📁 File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    })
    
    const formData = new FormData()
    formData.append('video', file)
    
    const { data, error } = await supabase.functions.invoke('upload-video', {
      body: formData
    })
    
    if (error) {
      console.error('❌ Upload failed:', error)
      throw new Error(error.message || 'Upload failed')
    }
    
    console.log('✅ Upload successful:', data)
    return data
  }, [])

  const handleUpload = useCallback(async () => {
    if (!file) return

    setUploading(true)
    setUploadStatus('uploading')
    setError(null)
    setUploadMessage('Uploading to server...')

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev.percentage < 90) {
            return {
              ...prev,
              percentage: Math.min(prev.percentage + 5, 90)
            }
          }
          return prev
        })
      }, 500)

      const result = await uploadToSupabase(file)
      
      clearInterval(progressInterval)
      setUploadProgress({ loaded: file.size, total: file.size, percentage: 100 })
      
      setUploadStatus('success')
      setUploadMessage('Upload completed successfully!')
      
      onUploadComplete({
        url: result.secure_url,
        publicId: result.public_id,
        duration: Math.round(result.duration || 0),
        format: result.format,
        bytes: result.bytes
      })

      toast({
        title: 'Upload successful!',
        description: `Video uploaded successfully. Duration: ${Math.round(result.duration || 0)}s`,
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      console.error('Upload failed:', error)
      
      setUploadStatus('error')
      setError(errorMessage)
      setUploadMessage('')
      
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }, [file, onUploadComplete, toast, uploadToSupabase])

  const resetUpload = () => {
    setFile(null)
    setUploadProgress({ loaded: 0, total: 0, percentage: 0 })
    setUploadStatus('idle')
    setError(null)
    setUploading(false)
    setPreviewUrl(null)
    setUploadMessage('')
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* File Input */}
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="video-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  {acceptedFormats.join(', ').toUpperCase()} (Max {maxSizeGB}GB)
                </p>
              </div>
              <input
                id="video-upload"
                type="file"
                className="hidden"
                accept={acceptedFormats.map(format => `.${format}`).join(',')}
                onChange={handleFileSelect}
                ref={fileInputRef}
                disabled={uploading}
              />
            </label>
          </div>

          {/* File Info */}
          {file && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">{file.name}</p>
                  <p className="text-sm text-blue-700">
                    {(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB • {file.type}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetUpload}
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Preview Video */}
          {previewUrl && (
            <div className="space-y-2">
              <video
                ref={videoRef}
                src={previewUrl}
                controls
                className="w-full max-h-64 rounded-lg"
                preload="metadata"
              />
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress.percentage}%</span>
              </div>
              <Progress value={uploadProgress.percentage} className="w-full" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{uploadMessage}</span>
                <span>
                  {(uploadProgress.loaded / (1024 * 1024)).toFixed(1)}MB / {(uploadProgress.total / (1024 * 1024)).toFixed(1)}MB
                </span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success Display */}
          {uploadStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">Video uploaded successfully!</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1"
            >
              {uploading ? 'Uploading...' : 'Upload Video'}
            </Button>
            
            {file && (
              <Button
                variant="outline"
                onClick={resetUpload}
                disabled={uploading}
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Upload Info */}
          <div className="text-xs text-gray-500 text-center">
            Server-side chunked upload via Supabase Edge Functions
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
