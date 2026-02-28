// Particle System for effects
class Particle {
  constructor(x, y, config = {}) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * (config.speed || 5);
    this.vy = (Math.random() - 0.5) * (config.speed || 5) - 2;
    this.life = config.life || 1;
    this.maxLife = this.life;
    this.decay = config.decay || 0.02;
    this.size = config.size || 8;
    this.color = config.color || '#fff';
    this.gravity = config.gravity || 0.1;
    this.fade = config.fade !== false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.life -= this.decay;
    if (this.fade) {
      this.vx *= 0.98;
    }
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, config) {
    const count = config.count || 10;
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, config));
    }
  }

  update() {
    this.particles = this.particles.filter(p => p.update());
  }

  draw(ctx) {
    this.particles.forEach(p => p.draw(ctx));
  }

  jumpEffect(x, y) {
    // Sparkle burst upward
    this.emit(x, y, {
      count: 15,
      speed: 6,
      size: 5,
      color: '#FFD700',
      life: 0.8,
      decay: 0.03,
      gravity: -0.05
    });
    // Small dust below
    this.emit(x, y + 30, {
      count: 8,
      speed: 3,
      size: 4,
      color: '#E0E0E0',
      life: 0.5,
      decay: 0.04,
      gravity: 0.15
    });
  }

  splatEffect(x, y) {
    // Big burst on splat
    this.emit(x, y, {
      count: 25,
      speed: 12,
      size: 10,
      color: '#FF6B6B',
      life: 1,
      decay: 0.025,
      gravity: 0.2
    });
    // Secondary particles
    this.emit(x, y, {
      count: 15,
      speed: 8,
      size: 6,
      color: '#FFE66D',
      life: 0.8,
      decay: 0.03,
      gravity: 0.1
    });
    // Ring effect
    this.emit(x, y, {
      count: 12,
      speed: 4,
      size: 8,
      color: '#4ECDC4',
      life: 0.6,
      decay: 0.035,
      gravity: 0
    });
  }

  squishEffect(x, y) {
    this.emit(x, y + 20, {
      count: 10,
      speed: 4,
      size: 5,
      color: '#A8E6CF',
      life: 0.6,
      decay: 0.03,
      gravity: 0.2
    });
  }

  happyEffect(x, y) {
    // Happy particles - hearts and sparkles
    this.emit(x, y - 30, {
      count: 8,
      speed: 3,
      size: 4,
      color: '#FF69B4',
      life: 0.7,
      decay: 0.025,
      gravity: -0.08
    });
    this.emit(x, y - 20, {
      count: 6,
      speed: 2,
      size: 3,
      color: '#FFD700',
      life: 0.5,
      decay: 0.03,
      gravity: -0.05
    });
  }
}

// Screen shake effect
class ScreenShake {
  constructor() {
    this.intensity = 0;
    this.decay = 0.9;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  shake(intensity) {
    this.intensity = intensity;
  }

  update() {
    if (this.intensity > 0.1) {
      this.offsetX = (Math.random() - 0.5) * this.intensity;
      this.offsetY = (Math.random() - 0.5) * this.intensity;
      this.intensity *= this.decay;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
      this.intensity = 0;
    }
  }

  apply(ctx) {
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
  }

  restore(ctx) {
    ctx.restore();
  }
}

// Screen pulse effect (for sound-like visual feedback)
class ScreenPulse {
  constructor(canvas) {
    this.canvas = canvas;
ulseIntensity = 0;
    this.pulseColor = 'rgba    this.p(255, 255, 255, 0.3)';
  }

  pulse(color = 'rgba(255, 255, 255, 0.3)', intensity = 0.3) {
    this.pulseIntensity = intensity;
    this.pulseColor = color;
  }

  update() {
    if (this.pulseIntensity > 0.01) {
      this.pulseIntensity *= 0.9;
    } else {
      this.pulseIntensity = 0;
    }
  }

  draw(ctx, width, height) {
    if (this.pulseIntensity > 0.01) {
      ctx.save();
      ctx.globalAlpha = this.pulseIntensity;
      ctx.fillStyle = this.pulseColor;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }
}

// Ripple effect (for sound-like visual feedback)
class RippleEffect {
  constructor() {
    this.ripples = [];
  }

  addRipple(x, y) {
    this.ripples.push({
      x, y,
      radius: 0,
      maxRadius: 100,
      alpha: 0.5,
      speed: 8
    });
  }

  update() {
    this.ripples = this.ripples.filter(r => {
      r.radius += r.speed;
      r.alpha = 0.5 * (1 - r.radius / r.maxRadius);
      return r.radius < r.maxRadius;
    });
  }

  draw(ctx) {
    this.ripples.forEach(r => {
      if (r.alpha > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    });
  }
}

// Background environment with parallax
class BackgroundEnvironment {
  constructor(canvas) {
    this.canvas = canvas;
    this.stars = [];
    this.clouds = [];
    this.parallaxOffsetX = 0;
    this.parallaxOffsetY = 0;
    this.lastBlobX = 0;
    this.lastBlobY = 0;
    this.init();
  }

  init() {
    // Create stars
    for (let i = 0; i < 50; i++) {
      this.stars.push({
        x: Math.random() * 2000,
        y: Math.random() * 1000,
        size: Math.random() * 2 + 0.5,
        twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.01,
        parallaxFactor: 0.1 // Stars move less (farther)
      });
    }
    // Create floating clouds
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * 2000,
        y: Math.random() * 400 + 50,
        size: Math.random() * 60 + 40,
        speed: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.15 + 0.05,
        parallaxFactor: 0.3 // Clouds move moderately
      });
    }
  }

  update(blobX, blobY) {
    // Calculate parallax based on blob movement
    const dx = blobX - this.lastBlobX;
    const dy = blobY - this.lastBlobY;
    
    // Apply parallax with different factors
    this.parallaxOffsetX += dx * 0.05;
    this.parallaxOffsetY += dy * 0.03;
    
    // Clamp parallax
    this.parallaxOffsetX = Math.max(-100, Math.min(100, this.parallaxOffsetX));
    this.parallaxOffsetY = Math.max(-50, Math.min(50, this.parallaxOffsetY));
    
    // Decay parallax back to center
    this.parallaxOffsetX *= 0.98;
    this.parallaxOffsetY *= 0.98;
    
    this.lastBlobX = blobX;
    this.lastBlobY = blobY;
    
    // Twinkle stars
    this.stars.forEach(s => s.twinkle += s.speed);
    // Float clouds
    this.clouds.forEach(c => {
      c.x += c.speed;
      if (c.x > this.canvas.width + 200) c.x = -200;
    });
  }

  draw(ctx, width, height) {
    // Draw gradient sky - cosmic night
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.7);
    skyGradient.addColorStop(0, '#0f0c29');
    skyGradient.addColorStop(0.5, '#302b63');
    skyGradient.addColorStop(1, '#24243e');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height * 0.7);

    // Draw stars with parallax
    this.stars.forEach(s => {
      const alpha = 0.4 + Math.sin(s.twinkle) * 0.3;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      const x = (s.x + this.parallaxOffsetX * s.parallaxFactor) % width;
      ctx.arc(x, s.y + this.parallaxOffsetY * s.parallaxFactor, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw clouds with parallax
    this.clouds.forEach(c => {
      ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`;
      ctx.beginPath();
      const x = c.x + this.parallaxOffsetX * c.parallaxFactor;
      const y = c.y + this.parallaxOffsetY * c.parallaxFactor;
      ctx.arc(x, y, c.size, 0, Math.PI * 2);
      ctx.arc(x + c.size * 0.6, y - c.size * 0.2, c.size * 0.7, 0, Math.PI * 2);
      ctx.arc(x + c.size * 1.2, y, c.size * 0.8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw ground (sand beach)
    const groundGradient = ctx.createLinearGradient(0, height * 0.65, 0, height);
    groundGradient.addColorStop(0, '#E6C9A8');
    groundGradient.addColorStop(0.3, '#D4B896');
    groundGradient.addColorStop(1, '#B8956E');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, height * 0.65, width, height * 0.35);

    // Draw wave hints
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const waveY = height * 0.68 + i * 15;
      ctx.beginPath();
      ctx.moveTo(0, waveY);
      for (let x = 0; x < width; x += 20) {
        ctx.lineTo(x + 10, waveY + Math.sin(x * 0.02 + Date.now() * 0.001 + i) * 5);
      }
      ctx.stroke();
    }

    // Glow at horizon
    const glowGradient = ctx.createRadialGradient(
      width / 2, height * 0.65, 0,
      width / 2, height * 0.65, width * 0.5
    );
    glowGradient.addColorStop(0, 'rgba(255, 200, 100, 0.2)');
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height * 0.7);
  }
}

// Main - App initialization and game loop

class TouchBlobApp {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Initialize systems
    this.animations = new AnimationManager();
    this.state = new BlobState();
    this.blob = new Blob(this.canvas, this.state, this.animations);
    
    // Polish systems
    this.particles = new ParticleSystem();
    this.screenShake = new ScreenShake();
    this.screenPulse = new ScreenPulse(this.canvas);
    this.rippleEffect = new RippleEffect();
    this.environment = new BackgroundEnvironment(this.canvas);
    
    // Touch input
    this.touch = new TouchHandler(this.canvas, (gesture, zone) => {
      this.blob.handleGesture(gesture, zone);
    });
    
    // Load sprites (placeholder for now)
    this.animations.loadSprites('787f3bce-23e5-4ccf-bdf9-a5aaf3731983');
    
    // Game loop
    this.lastTime = 0;
    this.gameLoop = this.gameLoop.bind(this);
    requestAnimationFrame(this.gameLoop);
    
    // Stats decay timer
    this.statsTimer = 0;
    
    // UI Manager
    this.ui = new UIManager(this);
    
    // Load saved color for blob
    const savedColor = localStorage.getItem('touchblob_color');
    if (savedColor) {
      this.blob.customColor = savedColor;
    }
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.blob) this.blob.resize();
    if (this.environment) this.environment.canvas = this.canvas;
  }

  gameLoop(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    
    // Update
    this.blob.update(deltaTime);
    this.particles.update();
    this.screenShake.update();
    this.screenPulse.update();
    this.rippleEffect.update();
    this.environment.update(this.blob.x, this.blob.y);
    
    // Update stats every 10 seconds
    this.statsTimer += deltaTime;
    if (this.statsTimer >= 10000) {
      this.statsTimer = 0;
      this.state.update(10000);
    }
    
    // Draw
    this.draw();
    
    requestAnimationFrame(this.gameLoop);
  }

  draw() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Apply screen shake
    this.screenShake.apply(ctx);
    
    // Draw environment background
    this.environment.draw(ctx, width, height);
    
    // Draw ripples behind blob
    this.rippleEffect.draw(ctx);
    
    // Draw particles behind blob
    this.particles.draw(ctx);
    
    // Draw blob with glow
    this.drawBlobGlow();
    this.blob.draw();
    
    // Draw screen pulse overlay
    this.screenPulse.draw(ctx, width, height);
    
    // Draw stats overlay
    this.drawStats();
    
    // Restore from screen shake
    this.screenShake.restore(ctx);
  }

  drawBlobGlow() {
    const ctx = this.ctx;
    const mood = this.state.stats.mood;
    const glowIntensity = mood / 100;
    
    if (glowIntensity > 0.3) {
      ctx.save();
      ctx.globalAlpha = glowIntensity * 0.3;
      ctx.globalCompositeOperation = 'lighter';
      
      const gradient = ctx.createRadialGradient(
        this.blob.x, this.blob.y, 30,
        this.blob.x, this.blob.y, 100
      );
      gradient.addColorStop(0, `hsla(${150 + (100 - mood) * 0.5}, 80%, 60%, 0.5)`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.blob.x, this.blob.y, 100, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawStats() {
    const ctx = this.ctx;
    const mood = this.state.stats.mood;
    const energy = this.state.stats.energy;
    const hunger = this.state.stats.hunger;
    
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(`Mood: ${Math.round(mood)}%`, 20, 30);
    ctx.fillText(`Energy: ${Math.round(energy)}%`, 20, 50);
    ctx.fillText(`Hunger: ${Math.round(hunger)}%`, 20, 70);
  }
}

// Start app when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new TouchBlobApp();
});