import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, CheckCircle, AlertCircle, Play } from 'lucide-react'
import { cloudinaryManager, type CloudinaryAccount } from '@/lib/cloudinary'
import { useToast } from '@/hooks/use-toast'

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
  const [currentAccount, setCurrentAccount] = useState<CloudinaryAccount | null>(null)
  
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

  const uploadToCloudinary = useCallback(async (file: File, account: CloudinaryAccount) => {
    return new Promise<any>((resolve, reject) => {
      const formData = new FormData()
      
      // Try upload preset first, fallback to basic upload
      formData.append('file', file)
      formData.append('resource_type', 'video')
      
      // Get preset configuration from environment based on account
      const accountIndex = cloudinaryManager.getAccountIndex(account.cloudName) + 1;
      const presetName = import.meta.env[`VITE_CLOUDINARY_UPLOAD_PRESET_${accountIndex}`] || 
                        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 
                        'learnova_videos'
      const isUnsigned = import.meta.env.VITE_CLOUDINARY_UNSIGNED === 'true'
      
      if (isUnsigned && presetName) {
        formData.append('upload_preset', presetName)
      } else {
        // Fallback to signed upload if no preset
        formData.append('api_key', account.apiKey)
        formData.append('timestamp', Math.round(Date.now() / 1000).toString())
        formData.append('folder', 'learnova/videos')
      }
      
      // Add debugging
      console.log('🚀 Starting upload to account:', account.cloudName)
      console.log('📋 Upload mode:', isUnsigned ? 'Unsigned preset' : 'Signed upload')
      console.log('📋 Preset name:', presetName)
      console.log('🔗 Upload URL:', `https://api.cloudinary.com/v1_1/${account.cloudName}/video/upload`)
      console.log('📁 File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      })
      
      const xhr = new XMLHttpRequest()
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100)
          setUploadProgress({
            loaded: event.loaded,
            total: event.total,
            percentage
          })
        }
      })
      
      xhr.addEventListener('load', () => {
        console.log('✅ Upload response status:', xhr.status)
        console.log('📄 Upload response:', xhr.responseText)
        
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            console.log('🎉 Parsed response:', response)
            console.log('🔗 Video URL:', response.secure_url)
            resolve(response)
          } catch (error) {
            console.error('❌ Failed to parse response:', error)
            reject(new Error('Failed to parse upload response'))
          }
        } else {
          console.error('❌ Upload failed with status:', xhr.status, xhr.responseText)
          try {
            const errorResponse = JSON.parse(xhr.responseText)
            console.error('❌ Error details:', errorResponse)
          } catch (e) {
            console.error('❌ Could not parse error response')
          }
          reject(new Error(`Upload failed with status: ${xhr.status} - ${xhr.responseText}`))
        }
      })
      
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed due to network error'))
      })
      
      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timed out'))
      })
      
      // Set timeout for large files (30 minutes)
      xhr.timeout = 30 * 60 * 1000
      
      const uploadUrl = cloudinaryManager.getUploadUrl(account)
      xhr.open('POST', uploadUrl)
      xhr.send(formData)
    })
  }, [])

  const handleUpload = useCallback(async () => {
    if (!file) return

    setUploading(true)
    setUploadStatus('uploading')
    setError(null)

    const maxRetries = cloudinaryManager.getAccountCount()
    let lastError: Error | null = null
    let currentUploadAccount: CloudinaryAccount | null = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        currentUploadAccount = cloudinaryManager.getOptimalAccount()
        setCurrentAccount(currentUploadAccount)
        
        console.log(`Upload attempt ${attempt + 1}/${maxRetries} using account: ${currentUploadAccount.cloudName}`)
        
        const result = await uploadToCloudinary(file, currentUploadAccount)
        
        // Mark account as successful (reset failure count)
        cloudinaryManager.markAccountSuccess(currentUploadAccount)
        
        setUploadStatus('success')
        onUploadComplete({
          url: result.secure_url,
          publicId: result.public_id,
          duration: Math.round(result.duration || 0), // Convert decimal to integer seconds
          format: result.format,
          bytes: result.bytes
        })

        toast({
          title: 'Upload successful!',
          description: `Video uploaded successfully to ${currentUploadAccount.cloudName}. Duration: ${Math.round(result.duration || 0)}s`,
        })

        return // Success, exit the retry loop

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Upload failed')
        console.error(`Upload failed on account ${currentUploadAccount?.cloudName}:`, error)
        
        // Mark this account as failed for health tracking
        if (currentUploadAccount) {
          cloudinaryManager.markAccountFailure(currentUploadAccount, lastError.message)
        }
        
        // Check if it's a storage/quota error that suggests trying another account
        const errorMessage = lastError.message.toLowerCase()
        const isStorageError = errorMessage.includes('quota') || 
                              errorMessage.includes('storage') || 
                              errorMessage.includes('limit') ||
                              errorMessage.includes('insufficient') ||
                              errorMessage.includes('exceeded')

        const shouldRetry = isStorageError || attempt < maxRetries - 1

        if (!shouldRetry) {
          break // Don't retry for other types of errors on last attempt
        }

        // Wait a bit before trying next account
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // All accounts failed
    setUploadStatus('error')
    setError(lastError?.message || 'Upload failed on all accounts')
    
    toast({
      title: 'Upload failed',
      description: `Failed on all ${maxRetries} account(s). ${lastError?.message || 'Please try again later.'}`,
      variant: 'destructive'
    })

    setUploading(false)
  }, [file, onUploadComplete, toast, uploadToCloudinary, currentAccount])

  const resetUpload = () => {
    setFile(null)
    setUploadProgress({ loaded: 0, total: 0, percentage: 0 })
    setUploadStatus('idle')
    setError(null)
    setUploading(false)
    setPreviewUrl(null)
    
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
                <span>Account: {currentAccount?.cloudName}</span>
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

          {/* Account Info */}
          <div className="text-xs text-gray-500 text-center">
            Load balancing across {cloudinaryManager.getAccountCount()} Cloudinary accounts
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
