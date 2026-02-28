// Touch Detection - Gesture recognition with enhanced interactions

class TouchHandler {
  constructor(canvas, callback) {
    this.canvas = canvas;
    this.callback = callback;
    
    this.touchStart = { x: 0, y: 0, time: 0 };
    this.touchCurrent = { x: 0, y: 0 };
    this.isTouching = false;
    this.isDragging = false;
    this.isPetting = false;
    this.petStartTime = 0;
    this.petAccumulator = 0;
    
    // Config
    this.swipeThreshold = 50;
    this.longPressThreshold = 500;
    this.doubleTapThreshold = 300;
    this.petThreshold = 800; // ms to trigger pet
    this.dragThreshold = 15; // movement needed to start drag
    
    this.lastTapTime = 0;
    this.lastTouchPos = null;
    
    this.bindEvents();
  }

  bindEvents() {
    const c = this.canvas;
    
    // Touch events
    c.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    c.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    c.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
    c.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { passive: false });
    
    // Mouse fallback for desktop testing
    c.addEventListener('mousedown', (e) => this.onMouseDown(e));
    c.addEventListener('mousemove', (e) => this.onMouseMove(e));
    c.addEventListener('mouseup', (e) => this.onMouseUp(e));
    c.addEventListener('mouseleave', (e) => this.onMouseLeave(e));
  }

  onTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.startTouch(touch.clientX, touch.clientY);
  }

  onTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.moveTouch(touch.clientX, touch.clientY);
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
    this.moveTouch(e.clientX, e.clientY);
  }

  onMouseUp(e) {
    this.endTouch(e.clientX, e.clientY);
  }

  onMouseLeave(e) {
    if (this.isTouching) {
      this.endTouch(e.clientX, e.clientY);
    }
  }

  startTouch(x, y) {
    this.isTouching = true;
    this.isDragging = false;
    this.isPetting = false;
    this.petAccumulator = 0;
    this.touchStart = { x, y, time: Date.now() };
    this.touchCurrent = { x, y };
    this.lastTouchPos = { x, y };
    
    // Notify blob of touch start for follow mode
    const app = window.app;
    if (app && app.blob) {
      app.blob.onTouchStart(x, y);
    }
  }

  moveTouch(x, y) {
    if (!this.isTouching) return;
    
    const dx = x - this.touchCurrent.x;
    const dy = y - this.touchCurrent.y;
    const distFromStart = Math.sqrt(
      Math.pow(x - this.touchStart.x, 2) + 
      Math.pow(y - this.touchStart.y, 2)
    );
    
    // Start dragging if moved past threshold
    if (!this.isDragging && distFromStart > this.dragThreshold) {
      this.isDragging = true;
      const app = window.app;
      if (app && app.blob) {
        app.blob.onDragStart();
      }
    }
    
    // Update drag position
    if (this.isDragging) {
      const app = window.app;
      if (app && app.blob) {
        app.blob.onDrag(x, y);
      }
    }
    
    // Check if touching blob for petting
    const app = window.app;
    if (app && app.blob) {
      const blob = app.blob;
      const distToBlob = Math.sqrt(
        Math.pow(x - blob.x, 2) + 
        Math.pow(y - blob.y, 2)
      );
      
      if (distToBlob < 80) {
        // Petting - accumulate pet time
        const now = Date.now();
        if (!this.petStartTime) {
          this.petStartTime = now;
        }
        this.petAccumulator = now - this.petStartTime;
        
        if (this.petAccumulator > this.petThreshold) {
          this.isPetting = true;
          blob.onPet(x, y);
          this.petStartTime = now; // Reset for continuous petting
        }
      }
    }
    
    this.touchCurrent = { x, y };
    this.lastTouchPos = { x, y };
  }

  endTouch(x, y) {
    if (!this.isTouching) return;
    
    const duration = Date.now() - this.touchStart.time;
    const dx = x - this.touchStart.x;
    const dy = y - this.touchStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const app = window.app;
    
    // End any drag - apply fling if was dragging
    if (this.isDragging && app && app.blob) {
      const vx = (x - this.lastTouchPos.x) * 0.5;
      const vy = (y - this.lastTouchPos.y) * 0.5;
      app.blob.onDragEnd(x, y, vx, vy);
    }
    
    // End petting
    if (this.isPetting && app && app.blob) {
      app.blob.onPetEnd();
    }
    
    // Determine gesture type
    if (duration < 200 && distance < 10) {
      // TAP / POKE - quick tap on blob
      const zone = this.getZone(x, y);
      
      // Check if tap is on/near blob
      let onBlob = false;
      if (app && app.blob) {
        const distToBlob = Math.sqrt(
          Math.pow(x - app.blob.x, 2) + 
          Math.pow(y - app.blob.y, 2)
        );
        onBlob = distToBlob < 80;
      }
      
      if (onBlob) {
        // Poke the blob
        if (app && app.blob) app.blob.onPoke(x, y);
      }
      
      // Regular tap
      const now = Date.now();
      if (now - this.lastTapTime < this.doubleTapThreshold) {
        this.callback('doubletap', zone);
      }
      this.lastTapTime = now;
      this.callback('tap', zone);
      
    } else if (duration > this.longPressThreshold && distance < 20) {
      // LONG PRESS - squish
      if (app && app.blob) app.blob.onLongPress();
      this.callback('longpress', this.getZone(x, y));
      
    } else if (distance > this.swipeThreshold) {
      // SWIPE
      const direction = this.getSwipeDirection(dx, dy);
      this.callback('swipe', direction);
    }
    
    // Notify blob touch ended
    if (app && app.blob) {
      app.blob.onTouchEnd(x, y);
    }
    
    this.isTouching = false;
    this.isDragging = false;
    this.isPetting = false;
    this.petStartTime = 0;
    this.petAccumulator = 0;
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
