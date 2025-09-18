import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useCopyProtection } from '@/hooks/useCopyProtection'

interface VideoProtectionOverlayProps {
  lessonId: string
  playerRef: React.RefObject<HTMLDivElement>
  onCopyAttempt?: (lessonId: string, attemptedUrl?: string) => void
}

export function VideoProtectionOverlay({ 
  lessonId, 
  playerRef, 
  onCopyAttempt 
}: VideoProtectionOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [overlayDimensions, setOverlayDimensions] = useState({ width: 0, height: 0 })
  
  const { 
    generateFakeUrl, 
    interceptClipboardWrite, 
    showProtectionToast, 
    logCopyAttempt 
  } = useCopyProtection({ 
    lessonId, 
    onCopyAttempt 
  })

  // Update overlay dimensions to match player
  const updateOverlayDimensions = useCallback(() => {
    if (playerRef.current && overlayRef.current) {
      const playerRect = playerRef.current.getBoundingClientRect()
      const parentRect = playerRef.current.offsetParent?.getBoundingClientRect() || { left: 0, top: 0 }
      
      setOverlayDimensions({
        width: playerRect.width,
        height: playerRect.height
      })
      
      // Position overlay to match player
      overlayRef.current.style.left = `${playerRect.left - parentRect.left}px`
      overlayRef.current.style.top = `${playerRect.top - parentRect.top}px`
      overlayRef.current.style.width = `${playerRect.width}px`
      overlayRef.current.style.height = `${playerRect.height}px`
    }
  }, [playerRef])

  // Handle clicks on the overlay (especially in control areas)
  const handleOverlayClick = useCallback(async (e: React.MouseEvent) => {
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Define control areas where copy buttons typically appear
    const controlHeight = 60 // Bottom control bar height
    const rightControlWidth = 120 // Right side control area width
    
    const isInBottomControls = y > rect.height - controlHeight
    const isInRightControls = x > rect.width - rightControlWidth
    const isInTopRightCorner = y < 60 && x > rect.width - rightControlWidth
    
    // If click is in a control area, treat it as a potential copy attempt
    if (isInBottomControls || isInRightControls || isInTopRightCorner) {
      e.preventDefault()
      e.stopPropagation()
      
      const fakeUrl = generateFakeUrl()
      
      try {
        await navigator.clipboard.writeText(fakeUrl)
        logCopyAttempt(`overlay-click-${x},${y}`)
        
        // Show success toast
        showProtectionToast()
      } catch (error) {
        console.error('Failed to write fake URL:', error)
        logCopyAttempt(`overlay-click-failed-${x},${y}`)
        showProtectionToast()
      }
    }
  }, [generateFakeUrl, logCopyAttempt, showProtectionToast])

  // Handle context menu (right-click)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    logCopyAttempt('context-menu')
    showProtectionToast()
    
    return false
  }, [logCopyAttempt, showProtectionToast])

  // Set up ResizeObserver for responsive overlay
  useEffect(() => {
    if (!playerRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      updateOverlayDimensions()
    })

    resizeObserver.observe(playerRef.current)
    
    // Initial setup
    updateOverlayDimensions()

    return () => {
      resizeObserver.disconnect()
    }
  }, [updateOverlayDimensions, playerRef])

  // Set up MutationObserver to watch for DOM changes
  useEffect(() => {
    if (!playerRef.current) return

    const mutationObserver = new MutationObserver(() => {
      // Re-sync overlay when player DOM changes
      setTimeout(updateOverlayDimensions, 100)
    })

    mutationObserver.observe(playerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    })

    return () => {
      mutationObserver.disconnect()
    }
  }, [updateOverlayDimensions, playerRef])

  // Periodic check to ensure overlay stays in sync
  useEffect(() => {
    const interval = setInterval(updateOverlayDimensions, 2000)
    return () => clearInterval(interval)
  }, [updateOverlayDimensions])

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setTimeout(updateOverlayDimensions, 100)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateOverlayDimensions])

  return (
    <div
      ref={overlayRef}
      className="absolute pointer-events-auto z-30"
      style={{
        background: 'transparent',
        cursor: 'default'
      }}
      onClick={handleOverlayClick}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleOverlayClick}
    >
      {/* Invisible clickable areas for control zones */}
      
      {/* Bottom control bar area */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16 bg-transparent"
        style={{ pointerEvents: 'auto' }}
        title="Protected video controls"
      />
      
      {/* Right control area */}
      <div
        className="absolute top-0 bottom-0 right-0 w-32 bg-transparent"
        style={{ pointerEvents: 'auto' }}
        title="Protected video controls"
      />
      
      {/* Top right corner (where overflow menu appears) */}
      <div
        className="absolute top-0 right-0 w-32 h-16 bg-transparent"
        style={{ pointerEvents: 'auto' }}
        title="Protected video controls"
      />
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
          Protection Active: {lessonId}
        </div>
      )}
    </div>
  )
}
