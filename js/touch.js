// Touch Detection - Gesture recognition

class TouchHandler {
  constructor(canvas, callback) {
    this.canvas = canvas;
    this.callback = callback;
    
    this.touchStart = { x: 0, y: 0, time: 0 };
    this.isTouching = false;
    
    // Config
    this.swipeThreshold = 50;
    this.longPressThreshold = 500;
    this.doubleTapThreshold = 300;
    
    this.lastTapTime = 0;
    
    this.bindEvents();
  }

  bindEvents() {
    const c = this.canvas;
    
    // Touch events
    c.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    c.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    c.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
    
    // Mouse fallback for desktop testing
    c.addEventListener('mousedown', (e) => this.onMouseDown(e));
    c.addEventListener('mousemove', (e) => this.onMouseMove(e));
    c.addEventListener('mouseup', (e) => this.onMouseUp(e));
  }

  onTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.startTouch(touch.clientX, touch.clientY);
  }

  onTouchMove(e) {
    e.preventDefault();
  }

  onTouchEnd(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    this.endTouch(touch.clientX, touch.clientY);
  }

  onMouseDown(e) {
    this.startTouch(e.clientX, e.clientY);
  }

  onMouseMove(e) {
    // Optional: visual feedback
  }

  onMouseUp(e) {
    this.endTouch(e.clientX, e.clientY);
  }

  startTouch(x, y) {
    this.isTouching = true;
    this.touchStart = { x, y, time: Date.now() };
  }

  endTouch(x, y) {
    if (!this.isTouching) return;
    this.isTouching = false;
    
    const duration = Date.now() - this.touchStart.time;
    const dx = x - this.touchStart.x;
    const dy = y - this.touchStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Determine gesture type
    if (duration < 200 && distance < 10) {
      // TAP
      const zone = this.getZone(x, y);
      this.callback('tap', zone);
      
      // Check double tap
      const now = Date.now();
      if (now - this.lastTapTime < this.doubleTapThreshold) {
        this.callback('doubletap', zone);
      }
      this.lastTapTime = now;
      
    } else if (duration > this.longPressThreshold && distance < 20) {
      // LONG PRESS
      this.callback('longpress', this.getZone(x, y));
      
    } else if (distance > this.swipeThreshold) {
      // SWIPE
      const direction = this.getSwipeDirection(dx, dy);
      this.callback('swipe', direction);
    }
  }

  getZone(x, y) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    
    const relX = x - cx;
    const relY = y - cy;
    
    // Define zones based on Y position relative to center
    if (relY < -50) return 'top';
    if (relY > 50) return 'bottom';
    return 'middle';
  }

  getSwipeDirection(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }
}

window.TouchHandler = TouchHandler;
