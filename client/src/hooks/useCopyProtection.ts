import { useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface CopyProtectionOptions {
  lessonId: string
  onCopyAttempt?: (lessonId: string, attemptedUrl?: string) => void
  fakeUrlBase?: string
}

export function useCopyProtection({ 
  lessonId, 
  onCopyAttempt,
  fakeUrlBase = 'https://learnova.com/protected-content'
}: CopyProtectionOptions) {
  const { toast } = useToast()

  const generateFakeUrl = useCallback(() => {
    return `${fakeUrlBase}/${lessonId}`
  }, [fakeUrlBase, lessonId])

  const showProtectionToast = useCallback(() => {
    toast({
      title: 'Content Protected',
      description: 'Video content is protected and cannot be copied or shared directly.',
      variant: 'default'
    })
  }, [toast])

  const logCopyAttempt = useCallback((attemptedUrl?: string) => {
    console.log(`[Copy Protection] Attempt blocked for lesson ${lessonId}`, {
      lessonId,
      attemptedUrl,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
    
    // Call custom callback if provided
    if (onCopyAttempt) {
      onCopyAttempt(lessonId, attemptedUrl)
    }
  }, [lessonId, onCopyAttempt])

  const interceptClipboardWrite = useCallback(async (text: string): Promise<boolean> => {
    // Check if this is a YouTube URL that should be replaced
    if (text.includes('youtube.com') || text.includes('youtu.be') || text.includes('embed/')) {
      const fakeUrl = generateFakeUrl()
      
      try {
        await navigator.clipboard.writeText(fakeUrl)
        logCopyAttempt(text)
        
        toast({
          title: 'Link Copied',
          description: 'You can only access the video through Learnova.',
          variant: 'default'
        })
        
        return true
      } catch (error) {
        console.error('Failed to write fake URL to clipboard:', error)
        logCopyAttempt(text)
        showProtectionToast()
        return false
      }
    }
    
    // Allow normal clipboard operations for non-video URLs
    return false
  }, [generateFakeUrl, logCopyAttempt, toast, showProtectionToast])

  const setupClipboardInterception = useCallback(() => {
    // Store original clipboard API
    const originalWriteText = navigator.clipboard?.writeText
    
    if (navigator.clipboard && originalWriteText) {
      // Override clipboard writeText
      navigator.clipboard.writeText = async (text: string) => {
        const wasIntercepted = await interceptClipboardWrite(text)
        
        if (!wasIntercepted) {
          // Use original function for non-protected content
          return originalWriteText.call(navigator.clipboard, text)
        }
      }
    }

    // Intercept copy events
    const handleCopyEvent = (e: ClipboardEvent) => {
      const selection = window.getSelection()?.toString() || ''
      
      // Only intercept if selection contains YouTube URLs
      if (selection.includes('youtube.com') || selection.includes('youtu.be')) {
        e.preventDefault()
        e.stopPropagation()
        
        const fakeUrl = generateFakeUrl()
        
        if (e.clipboardData) {
          e.clipboardData.setData('text/plain', fakeUrl)
          e.clipboardData.setData('text/html', `<a href="${fakeUrl}">${fakeUrl}</a>`)
        }
        
        logCopyAttempt(selection)
        
        toast({
          title: 'Link Copied',
          description: 'You can only access the video through Learnova.',
          variant: 'default'
        })
        
        return false
      }
    }

    // Intercept keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        const selection = window.getSelection()?.toString() || ''
        
        if (selection.includes('youtube.com') || selection.includes('youtu.be')) {
          e.preventDefault()
          e.stopPropagation()
          
          interceptClipboardWrite(selection)
          return false
        }
      }
    }

    document.addEventListener('copy', handleCopyEvent, true)
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      // Restore original clipboard API
      if (navigator.clipboard && originalWriteText) {
        navigator.clipboard.writeText = originalWriteText
      }
      
      document.removeEventListener('copy', handleCopyEvent, true)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [interceptClipboardWrite, generateFakeUrl, logCopyAttempt, toast])

  const setupIframeProtection = useCallback((iframe: HTMLIFrameElement) => {
    try {
      const iframeWindow = iframe.contentWindow
      const iframeDoc = iframe.contentDocument
      
      if (!iframeWindow || !iframeDoc) return () => {}

      // Override iframe clipboard API
      const originalIframeWriteText = iframeWindow.navigator.clipboard?.writeText
      
      if (iframeWindow.navigator.clipboard && originalIframeWriteText) {
        iframeWindow.navigator.clipboard.writeText = async (text: string) => {
          const wasIntercepted = await interceptClipboardWrite(text)
          
          if (!wasIntercepted) {
            return originalIframeWriteText.call(iframeWindow.navigator.clipboard, text)
          }
        }
      }

      // Intercept iframe copy events
      const handleIframeCopy = (e: any) => {
        e.preventDefault()
        e.stopPropagation()
        
        const fakeUrl = generateFakeUrl()
        
        if (e.clipboardData) {
          e.clipboardData.setData('text/plain', fakeUrl)
        }
        
        logCopyAttempt('iframe-copy-event')
        showProtectionToast()
        
        return false
      }

      // Intercept iframe keyboard shortcuts
      const handleIframeKeyDown = (e: any) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X')) {
          e.preventDefault()
          e.stopPropagation()
          
          interceptClipboardWrite('iframe-keyboard-shortcut')
          return false
        }
      }

      iframeDoc.addEventListener('copy', handleIframeCopy, true)
      iframeDoc.addEventListener('cut', handleIframeCopy, true)
      iframeDoc.addEventListener('keydown', handleIframeKeyDown, true)

      return () => {
        // Restore iframe clipboard API
        if (iframeWindow.navigator.clipboard && originalIframeWriteText) {
          iframeWindow.navigator.clipboard.writeText = originalIframeWriteText
        }
        
        iframeDoc.removeEventListener('copy', handleIframeCopy, true)
        iframeDoc.removeEventListener('cut', handleIframeCopy, true)
        iframeDoc.removeEventListener('keydown', handleIframeKeyDown, true)
      }
    } catch (error) {
      // Cross-origin restrictions - this is expected
      console.log('[Copy Protection] Cross-origin iframe access blocked (expected)')
      return () => {}
    }
  }, [interceptClipboardWrite, generateFakeUrl, logCopyAttempt, showProtectionToast])

  // Main setup effect
  useEffect(() => {
    const cleanup = setupClipboardInterception()
    
    // Make showProtectionToast globally available for iframe communication
    ;(window as any).showProtectionToast = showProtectionToast
    ;(window as any).interceptClipboardWrite = interceptClipboardWrite
    
    return () => {
      cleanup()
      delete (window as any).showProtectionToast
      delete (window as any).interceptClipboardWrite
    }
  }, [setupClipboardInterception, showProtectionToast, interceptClipboardWrite])

  return {
    generateFakeUrl,
    setupIframeProtection,
    interceptClipboardWrite,
    showProtectionToast,
    logCopyAttempt
  }
}
