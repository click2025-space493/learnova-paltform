/**
 * Global Copy Link Blocker for YouTube Videos
 * This utility aggressively blocks all YouTube copy link and sharing functionality
 * across the entire website to prevent content piracy.
 */

export class CopyLinkBlocker {
  private static instance: CopyLinkBlocker | null = null
  private observer: MutationObserver | null = null
  private interval: NodeJS.Timeout | null = null
  private isActive = false

  // Comprehensive list of selectors to block - ONLY YouTube specific elements
  private readonly blockSelectors = [
    // YouTube copy/share buttons - SPECIFIC to YouTube iframes only
    'iframe[src*="youtube"] .ytp-copylink-button',
    'iframe[src*="youtube"] .ytp-share-button',
    'iframe[src*="youtube"] .ytp-share-panel',
    'iframe[src*="youtube"] .ytp-share-button-visible',
    
    // YouTube specific elements only - NOT generic buttons
    'iframe[src*="youtube"] button[aria-label*="Copy link"]',
    'iframe[src*="youtube"] button[aria-label*="Share"]',
    'iframe[src*="youtube"] button[title*="Copy link"]',
    'iframe[src*="youtube"] button[title*="Share"]',
    
    // YouTube UI elements
    '.ytp-contextmenu',
    '.ytp-popup',
    '.ytp-chrome-top',
    '.ytp-chrome-bottom',
    '.ytp-watermark',
    '.ytp-title',
    '.ytp-title-link',
    '.ytp-title-channel',
    '.ytp-pause-overlay',
    '.ytp-gradient-top',
    '.ytp-gradient-bottom',
    '.ytp-show-cards-title',
    '.ytp-cards-teaser',
    '.ytp-ce-element',
    '.ytp-suggested-action',
    '.ytp-endscreen-element',
    '.ytp-videowall-still',
    '.ytp-impression-link',
    '.iv-click-target',
    '.iv-promo',
    '.annotation',
    
    // Menu items
    '.ytp-menuitem[aria-label*="Copy"]',
    '.ytp-menuitem[aria-label*="Share"]',
    '.ytp-menuitem-label',
    '.ytp-menuitem-content',
    
    // Tooltip elements
    '[data-tooltip-target-id*="copy"]',
    '[data-tooltip-target-id*="share"]',
    
    // Additional YouTube elements
    '.ytp-watch-later-button',
    '.ytp-button[data-tooltip-target-id*="share"]',
    '.ytp-button[data-tooltip-target-id*="copy"]',
    '.ytp-button[aria-label*="Share"]',
    '.ytp-button[aria-label*="Copy"]'
  ]

  private constructor() {
    this.blockElements = this.blockElements.bind(this)
  }

  public static getInstance(): CopyLinkBlocker {
    if (!CopyLinkBlocker.instance) {
      CopyLinkBlocker.instance = new CopyLinkBlocker()
    }
    return CopyLinkBlocker.instance
  }

  /**
   * Start the copy link blocker
   */
  public start(): void {
    if (this.isActive) return

    console.log('🛡️ Copy Link Blocker: Starting aggressive protection...')
    this.isActive = true

    // Block elements immediately
    this.blockElements()

    // Set up continuous monitoring
    this.setupContinuousBlocking()
    this.setupMutationObserver()
    this.setupKeyboardBlocking()
    this.setupContextMenuBlocking()

    console.log('🛡️ Copy Link Blocker: Protection active')
  }

  /**
   * Stop the copy link blocker
   */
  public stop(): void {
    if (!this.isActive) return

    console.log('🛡️ Copy Link Blocker: Stopping protection...')
    this.isActive = false

    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }

    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }

    console.log('🛡️ Copy Link Blocker: Protection stopped')
  }

  /**
   * Block all copy/share elements
   */
  private blockElements(): void {
    this.blockSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector)
        elements.forEach(element => {
          if (element instanceof HTMLElement) {
            this.hideElement(element)
          }
        })
      } catch (error) {
        // Ignore selector errors for complex selectors
      }
    })

    // Block YouTube iframes specifically
    this.blockYouTubeIframes()
  }

  /**
   * Hide an element completely
   */
  private hideElement(element: HTMLElement): void {
    element.style.display = 'none'
    element.style.visibility = 'hidden'
    element.style.opacity = '0'
    element.style.pointerEvents = 'none'
    element.style.position = 'absolute'
    element.style.left = '-9999px'
    element.style.top = '-9999px'
    element.style.width = '0'
    element.style.height = '0'
    element.style.zIndex = '-999999'
    
    // Remove from DOM completely
    try {
      element.remove()
    } catch (error) {
      // Element might already be removed
    }
  }

  /**
   * Block YouTube iframe interactions
   */
  private blockYouTubeIframes(): void {
    const iframes = document.querySelectorAll('iframe[src*="youtube"]')
    iframes.forEach(iframe => {
      if (iframe instanceof HTMLIFrameElement) {
        iframe.style.pointerEvents = 'none'
        
        // Add overlay to block interactions
        const overlay = document.createElement('div')
        overlay.style.position = 'absolute'
        overlay.style.top = '0'
        overlay.style.left = '0'
        overlay.style.width = '100%'
        overlay.style.height = '100%'
        overlay.style.backgroundColor = 'transparent'
        overlay.style.pointerEvents = 'none'
        overlay.style.zIndex = '999'
        
        const parent = iframe.parentElement
        if (parent && parent.style.position !== 'relative') {
          parent.style.position = 'relative'
        }
        
        if (parent && !parent.querySelector('.youtube-overlay')) {
          overlay.className = 'youtube-overlay'
          parent.appendChild(overlay)
        }
      }
    })
  }

  /**
   * Set up continuous blocking every 500ms
   */
  private setupContinuousBlocking(): void {
    this.interval = setInterval(() => {
      if (this.isActive) {
        this.blockElements()
      }
    }, 500)
  }

  /**
   * Set up DOM mutation observer
   */
  private setupMutationObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      if (!this.isActive) return

      let shouldBlock = false
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldBlock = true
        } else if (mutation.type === 'attributes') {
          const target = mutation.target as HTMLElement
          if (target && (
            target.className?.includes('copy') ||
            target.className?.includes('share') ||
            target.getAttribute('aria-label')?.includes('Copy') ||
            target.getAttribute('aria-label')?.includes('Share')
          )) {
            shouldBlock = true
          }
        }
      })

      if (shouldBlock) {
        setTimeout(() => this.blockElements(), 0)
      }
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'aria-label', 'title', 'data-tooltip-target-id']
    })
  }

  /**
   * Block keyboard shortcuts for copying - ONLY when focused on video
   */
  private setupKeyboardBlocking(): void {
    document.addEventListener('keydown', (e) => {
      if (!this.isActive) return

      // Only block if the target is within a video player
      const target = e.target as HTMLElement
      if (target && (
        target.closest('.plyr') ||
        target.closest('iframe[src*="youtube"]') ||
        target.closest('.video-player')
      )) {
        // Block Ctrl+C, Ctrl+U, F12, etc. ONLY in video context
        if (
          (e.ctrlKey && (e.key === 'c' || e.key === 'u')) ||
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) ||
          e.key === 'F12' ||
          e.key === 'PrintScreen'
        ) {
          e.preventDefault()
          e.stopPropagation()
          return false
        }
      }
    }, true)
  }

  /**
   * Block right-click context menu
   */
  private setupContextMenuBlocking(): void {
    document.addEventListener('contextmenu', (e) => {
      if (!this.isActive) return

      // Check if the target is within a video player
      const target = e.target as HTMLElement
      if (target && (
        target.closest('.plyr') ||
        target.closest('iframe[src*="youtube"]') ||
        target.closest('.video-player') ||
        target.closest('.course-viewer')
      )) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }, true)
  }
}

// Export the blocker instance but don't auto-start
export const copyLinkBlocker = CopyLinkBlocker.getInstance()

// Don't auto-start - only start when explicitly called
// This prevents interference with regular website buttons
