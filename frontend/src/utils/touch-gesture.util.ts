/**
 * Touch Gesture Utility for Mobile Interactions
 * Implements swipe and pull-to-refresh functionality
 * Part of V4-405: Add touch gestures (swipe drawer, pull-to-refresh) (5 SP)
 */

export interface SwipeGestureOptions {
  element: HTMLElement;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance to trigger swipe (default: 50px)
}

export interface PullToRefreshOptions {
  element: HTMLElement;
  onRefresh: () => void;
  resistance?: number; // How resistant the pull feels (default: 2.5)
  maxDistance?: number; // Maximum distance user can pull (default: 100px)
}

export class TouchGestureUtil {
  private activeGestures: Map<HTMLElement, () => void> = new Map();

  /**
   * Adds swipe gesture functionality to an element
   */
  addSwipeGesture(options: SwipeGestureOptions) {
    const { 
      element, 
      onSwipeLeft, 
      onSwipeRight, 
      onSwipeUp, 
      onSwipeDown, 
      threshold = 50 
    } = options;

    let startX = 0;
    let startY = 0;
    let isSwiping = false;

    const touchStartHandler = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isSwiping = true;
    };

    const touchMoveHandler = (e: TouchEvent) => {
      if (!isSwiping) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;

      const diffX = currentX - startX;
      const diffY = currentY - startY;

      // Only consider horizontal or vertical swipes (whichever is greater)
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
        if (diffX > threshold && onSwipeRight) {
          onSwipeRight();
          isSwiping = false;
        } else if (diffX < -threshold && onSwipeLeft) {
          onSwipeLeft();
          isSwiping = false;
        }
      } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > threshold) {
        if (diffY > threshold && onSwipeDown) {
          onSwipeDown();
          isSwiping = false;
        } else if (diffY < -threshold && onSwipeUp) {
          onSwipeUp();
          isSwiping = false;
        }
      }
    };

    const touchEndHandler = () => {
      isSwiping = false;
    };

    element.addEventListener('touchstart', touchStartHandler);
    element.addEventListener('touchmove', touchMoveHandler);
    element.addEventListener('touchend', touchEndHandler);

    // Store cleanup function
    const cleanup = () => {
      element.removeEventListener('touchstart', touchStartHandler);
      element.removeEventListener('touchmove', touchMoveHandler);
      element.removeEventListener('touchend', touchEndHandler);
    };
    
    this.activeGestures.set(element, cleanup);
  }

  /**
   * Adds pull-to-refresh functionality to an element
   */
  addPullToRefresh(options: PullToRefreshOptions) {
    const { 
      element, 
      onRefresh, 
      resistance = 2.5, 
      maxDistance = 100 
    } = options;

    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    let pullDistance = 0;

    // Create the refresh indicator element
    const indicator = document.createElement('div');
    indicator.className = 'pull-to-refresh-indicator';
    indicator.innerHTML = '↓ Pull to refresh';
    indicator.style.cssText = `
      position: absolute;
      top: -40px;
      left: 0;
      right: 0;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--background, #fff);
      color: var(--foreground, #000);
      font-size: 14px;
      transition: transform 0.2s ease-out;
    `;
    element.prepend(indicator);

    const touchStartHandler = (e: TouchEvent) => {
      // Only start pull-to-refresh if at the top of the scrollable area
      if (element.scrollTop === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };

    const touchMoveHandler = (e: TouchEvent) => {
      if (!isPulling) return;

      currentY = e.touches[0].clientY;
      pullDistance = Math.min(maxDistance, (currentY - startY) / resistance);

      // Update the indicator
      indicator.style.transform = `translateY(${pullDistance}px)`;
      
      if (pullDistance > 30) {
        indicator.innerHTML = '✓ Release to refresh';
      } else {
        indicator.innerHTML = '↓ Pull to refresh';
      }
    };

    const touchEndHandler = () => {
      if (!isPulling) return;

      isPulling = false;

      if (pullDistance > 30) {
        // Trigger refresh
        indicator.innerHTML = 'Refreshing...';
        onRefresh();
      }

      // Reset the indicator position
      indicator.style.transition = 'transform 0.3s ease-out';
      indicator.style.transform = 'translateY(0)';
      
      // Reset after a short delay
      setTimeout(() => {
        indicator.style.transition = '';
      }, 300);
    };

    element.addEventListener('touchstart', touchStartHandler);
    element.addEventListener('touchmove', touchMoveHandler);
    element.addEventListener('touchend', touchEndHandler);

    // Store cleanup function
    const cleanup = () => {
      element.removeEventListener('touchstart', touchStartHandler);
      element.removeEventListener('touchmove', touchMoveHandler);
      element.removeEventListener('touchend', touchEndHandler);
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    };
    
    this.activeGestures.set(element, cleanup);
  }

  /**
   * Removes all gesture handlers from an element
   */
  removeGesture(element: HTMLElement) {
    const cleanup = this.activeGestures.get(element);
    if (cleanup) {
      cleanup();
      this.activeGestures.delete(element);
    }
  }

  /**
   * Removes all gesture handlers
   */
  destroy() {
    this.activeGestures.forEach(cleanup => cleanup());
    this.activeGestures.clear();
  }
}