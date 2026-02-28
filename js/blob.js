// Blob - Main character rendering and behavior

class Blob {
  constructor(canvas, state, animations) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = state;
    this.animations = animations;
    
    // Position
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.targetX = this.x;
    this.targetY = this.y;
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.gravity = 0.5;
    this.friction = 0.9;
    
    // Animation state
    this.scaleX = 1;
    this.scaleY = 1;
    this.rotation = 0;
    
    // Current action
    this.action = 'idle';
    this.actionTimer = 0;
  }

  resize() {
    this.x = this.canvas.width / 2;
    this.y = this.canvas.height / 2;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  handleGesture(gesture, zone) {
    const energy = this.state.getEnergyLevel();
    const jumpMultiplier = energy > 30 ? 1 : 0.5;
    
    switch (gesture) {
      case 'tap':
        if (zone === 'top') {
          this.jump(jumpMultiplier);
        } else if (zone === 'bottom') {
          this.splat();
        } else {
          this.bounce();
        }
        break;
        
      case 'doubletap':
        this.jump(1.5 * jumpMultiplier);
        break;
        
      case 'swipe':
        if (zone === 'left') this.slide(-1);
        else if (zone === 'right') this.slide(1);
        else this.jump(jumpMultiplier);
        break;
        
      case 'longpress':
        this.squish();
        break;
    }
  }

  jump(multiplier = 1) {
    if (this.action !== 'idle') return;
    
    this.action = 'jump';
    this.vy = -15 * multiplier;
    this.animations.setAnimation('jump');
    this.state.interact('jump');
    this.actionTimer = 500;
  }

  splat() {
    if (this.action !== 'idle') return;
    
    this.action = 'splat';
    this.scaleY = 0.5;
    this.scaleX = 1.5;
    this.animations.setAnimation('splat');
    this.state.interact('splat');
    this.actionTimer = 300;
  }

  slide(direction) {
    if (this.action !== 'idle') return;
    
    this.action = 'slide';
    this.vx = direction * 10;
    this.animations.setAnimation('slide');
    this.state.interact('slide');
    this.actionTimer = 400;
  }

  squish() {
    if (this.action !== 'idle') return;
    
    this.action = 'squish';
    this.scaleX = 1.3;
    this.scaleY = 0.7;
    this.state.interact('squish');
    this.actionTimer = 500;
  }

  bounce() {
    this.scaleY = 0.9;
    this.scaleX = 1.1;
  }

  update(deltaTime) {
    // Physics
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    
    // Ground collision
    const groundY = this.canvas.height * 0.7;
    if (this.y > groundY) {
      this.y = groundY;
      
      if (this.vy > 5) {
        // Landed from jump - small splat
        this.scaleY = 0.8;
        this.scaleX = 1.2;
      }
      
      this.vy = 0;
    }
    
    // Friction
    this.vx *= this.friction;
    
    // Screen bounds
    const margin = 50;
    if (this.x < margin) this.x = margin;
    if (this.x > this.canvas.width - margin) this.x = this.canvas.width - margin;
    
    // Return to center slowly when idle
    if (this.action === 'idle') {
      this.targetX = this.canvas.width / 2;
      this.x += (this.targetX - this.x) * 0.02;
    }
    
    // Scale recovery
    this.scaleX += (1 - this.scaleX) * 0.2;
    this.scaleY += (1 - this.scaleY) * 0.2;
    
    // Action timer
    if (this.actionTimer > 0) {
      this.actionTimer -= deltaTime;
      if (this.actionTimer <= 0) {
        this.action = 'idle';
        this.animations.setAnimation('idle');
      }
    }
    
    // Update animations
    this.animations.update(deltaTime);
  }

  draw() {
    const ctx = this.ctx;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Scale based on action
    ctx.scale(this.scaleX, this.scaleY);
    
    // Draw sprite if loaded, otherwise placeholder
    const frame = this.animations.getCurrentFrame();
    if (frame && frame.complete) {
      // Draw sprite centered
      const scale = 4; // Scale up the 48px sprite
      ctx.drawImage(
        frame, 
        -frame.width * scale / 2, 
        -frame.height * scale / 2,
        frame.width * scale,
        frame.height * scale
      );
    } else {
      // Fallback to placeholder
      this.drawPlaceholder(ctx);
    }
    
    ctx.restore();
  }

  drawPlaceholder(ctx) {
    // Placeholder blob rendering
    const mood = this.state.stats.mood;
    
    // Color based on mood
    const hue = 150 + (100 - mood) * 0.5; // Blue-green to sad green
    const saturation = 60 + mood * 0.2;
    const lightness = 50 + (100 - mood) * 0.1;
    
    ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    
    // Body
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Eyes
    const eyeOffset = mood > 50 ? 0 : -5;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-20, -10 + eyeOffset, 15, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(20, -10 + eyeOffset, 15, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Pupils
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-20, -10 + eyeOffset, 7, 0, Math.PI * 2);
    ctx.arc(20, -10 + eyeOffset, 7, 0, Math.PI * 2);
    ctx.fill();
    
    // Mouth
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (mood > 70) {
      // Happy
      ctx.arc(0, 15, 15, 0, Math.PI);
    } else if (mood > 30) {
      // Neutral
      ctx.moveTo(-10, 20);
      ctx.lineTo(10, 20);
    } else {
      // Sad
      ctx.arc(0, 25, 10, Math.PI, 0);
    }
    ctx.stroke();
  }
}

window.Blob = Blob;
